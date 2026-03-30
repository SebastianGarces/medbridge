import uuid

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END

from ai_health_coach.graph.state import CoachState
from ai_health_coach.graph.edges import route_by_phase, check_phase_transition
from ai_health_coach.graph.nodes.consent_check import consent_check_node
from ai_health_coach.graph.nodes.onboarding import (
    welcome_node, elicit_goal_node, extract_goal_node, confirm_goal_node,
)
from ai_health_coach.graph.nodes.active import respond_node, checkin_node
from ai_health_coach.graph.nodes.re_engaging import nudge_node
from ai_health_coach.graph.nodes.dormant import warm_reengagement_node
from ai_health_coach.safety.classifier import classify_message
from ai_health_coach.safety.fallback import SAFE_FALLBACK_MESSAGE, CRISIS_FALLBACK_MESSAGE
from ai_health_coach.models.enums import Phase
from ai_health_coach.models.patient import Patient, Message, Alert, PhaseTransition
from ai_health_coach.models.enums import MessageRole
from sqlalchemy import select


def _persist_phase_transition(session, patient, result, reason_default="phase_transition"):
    """Log a PhaseTransition record if the phase changed."""
    new_phase = result.get("phase")
    if new_phase and new_phase != patient.phase:
        transition = PhaseTransition(
            id=str(uuid.uuid4()),
            patient_id=patient.id,
            from_phase=patient.phase,
            to_phase=new_phase,
            reason=result.get("transition_event") or reason_default,
        )
        session.add(transition)
        patient.phase = new_phase


def _wrap_node(node_fn, llm, tools):
    """Wrap a node function to inject the LLM and tools."""
    async def wrapper(state):
        return await node_fn(state, llm, tools)
    return wrapper


def _wrap_node_no_tools(node_fn, llm):
    """Wrap a node function to inject only the LLM (for safety nodes)."""
    async def wrapper(state):
        return await node_fn(state, llm)
    return wrapper


def build_graph(llm, tools=None):
    """Build the main LangGraph StateGraph."""
    if tools is None:
        tools = []

    graph = StateGraph(CoachState)

    # Add nodes
    graph.add_node("consent_check", consent_check_node)
    graph.add_node("onboarding_subgraph", _wrap_node(_onboarding_handler, llm, tools))
    graph.add_node("active_subgraph", _wrap_node(_active_handler, llm, tools))
    graph.add_node("re_engaging_subgraph", _wrap_node(nudge_node, llm, tools))
    graph.add_node("dormant_subgraph", _wrap_node(warm_reengagement_node, llm, tools))
    graph.add_node("pending_check", consent_check_node)
    graph.add_node("safety_classify", _wrap_node_no_tools(_safety_classify_node, llm))
    graph.add_node("safety_retry", _wrap_node_no_tools(_safety_retry_node, llm))
    graph.add_node("safety_fallback", _safety_fallback_node)
    graph.add_node("phase_transition", _phase_transition_node)

    # Entry
    graph.set_entry_point("consent_check")

    # Consent check routes
    graph.add_conditional_edges(
        "consent_check",
        _consent_router,
        {
            "blocked": END,
            "route_phase": "phase_router",
        },
    )

    # Phase router as virtual node — use conditional edges from consent
    graph.add_node("phase_router", _noop_node)
    graph.add_conditional_edges(
        "phase_router",
        route_by_phase,
        {
            "onboarding_subgraph": "onboarding_subgraph",
            "active_subgraph": "active_subgraph",
            "re_engaging_subgraph": "re_engaging_subgraph",
            "dormant_subgraph": "dormant_subgraph",
            "pending_check": "pending_check",
        },
    )

    # After subgraphs → safety_classify
    for node in ["onboarding_subgraph", "active_subgraph", "re_engaging_subgraph",
                  "dormant_subgraph", "pending_check"]:
        graph.add_edge(node, "safety_classify")

    # Safety classify routes: safe → phase_transition, blocked → retry or fallback
    graph.add_conditional_edges(
        "safety_classify",
        _safety_router,
        {
            "safe": "phase_transition",
            "retry": "safety_retry",
        },
    )

    # Safety retry routes: safe → phase_transition, blocked → fallback
    graph.add_conditional_edges(
        "safety_retry",
        _safety_retry_router,
        {
            "safe": "phase_transition",
            "fallback": "safety_fallback",
        },
    )

    graph.add_edge("safety_fallback", "phase_transition")
    graph.add_edge("phase_transition", END)

    return graph.compile()


async def _noop_node(state: CoachState) -> dict:
    """Pass-through node."""
    return {}


def _consent_router(state: CoachState) -> str:
    """Route based on consent status."""
    if not state.get("consent_verified", False):
        return "blocked"
    return "route_phase"


async def _safety_classify_node(state: CoachState, llm) -> dict:
    """Safety classification gate on all outbound coach messages."""
    messages = state.get("messages", [])
    if not messages:
        return {"safety_blocked": False, "retry_count": 0, "safety_category": None}

    # Find the last AI message (the coach's outbound response)
    last_ai_content = None
    for msg in reversed(messages):
        if isinstance(msg, AIMessage):
            last_ai_content = msg.content
            break

    if not last_ai_content:
        return {"safety_blocked": False, "retry_count": 0, "safety_category": None}

    result = await classify_message(last_ai_content, llm)

    if result.category == "CRISIS":
        # Crisis: replace response with crisis message, skip retry
        return {
            "messages": [AIMessage(content=CRISIS_FALLBACK_MESSAGE)],
            "safety_blocked": False,
            "safety_category": "CRISIS",
            "retry_count": 0,
        }

    if result.is_safe:
        return {"safety_blocked": False, "retry_count": 0, "safety_category": "SAFE"}

    # Blocked (CLINICAL) — mark for retry
    return {"safety_blocked": True, "retry_count": 0, "safety_category": "CLINICAL"}


def _safety_router(state: CoachState) -> str:
    """Route after safety classification."""
    if state.get("safety_blocked", False):
        return "retry"
    return "safe"


async def _safety_retry_node(state: CoachState, llm) -> dict:
    """Retry with augmented prompt after safety block."""
    augmented_prompt = (
        "Your previous response contained clinical content. "
        "Rephrase as motivational support only. "
        "NEVER mention diagnoses, medications, dosages, symptoms, treatments, or prognosis. "
        "Focus only on exercise encouragement and goal tracking."
    )

    response = await llm.ainvoke([
        SystemMessage(content=augmented_prompt),
        *[m for m in state.get("messages", []) if isinstance(m, HumanMessage)],
    ])

    # Check safety on the retry
    retry_result = await classify_message(response.content, llm)
    if retry_result.is_safe:
        return {
            "messages": [response],
            "safety_blocked": False,
            "retry_count": 1,
        }

    # Still blocked — mark for fallback
    return {
        "safety_blocked": True,
        "retry_count": 1,
    }


def _safety_retry_router(state: CoachState) -> str:
    """Route after safety retry."""
    if state.get("safety_blocked", False) and state.get("retry_count", 0) >= 1:
        return "fallback"
    return "safe"


async def _safety_fallback_node(state: CoachState) -> dict:
    """Return safe fallback message after retry failure."""
    return {
        "messages": [AIMessage(content=SAFE_FALLBACK_MESSAGE)],
        "safety_blocked": True,
        "retry_count": 2,
    }


async def _onboarding_handler(state: CoachState, llm, tools) -> dict:
    """Combined onboarding handler — determines which sub-step to run."""
    messages = state.get("messages", [])
    goal = state.get("goal")

    # If goal already confirmed, run confirm
    if goal:
        return await confirm_goal_node(state, llm, tools)

    # If patient has sent a message (potential goal), extract it
    patient_messages = [m for m in messages if isinstance(m, HumanMessage)]
    if patient_messages:
        return await extract_goal_node(state, llm, tools)

    # Otherwise, welcome + elicit
    return await welcome_node(state, llm, tools)


async def _active_handler(state: CoachState, llm, tools) -> dict:
    """Active phase handler — route between respond and checkin."""
    interaction_type = state.get("interaction_type")
    if interaction_type:
        return await checkin_node(state, llm, tools)
    return await respond_node(state, llm, tools)


async def _phase_transition_node(state: CoachState) -> dict:
    """Apply deterministic phase transitions."""
    return check_phase_transition(state)


HISTORY_WINDOW = 20


async def run_graph_welcome(patient_id: str, session, llm) -> str:
    """Invoke graph to generate coach-initiated welcome (no patient message)."""
    patient = (await session.execute(select(Patient).where(Patient.id == patient_id))).scalar_one()

    graph = build_graph(llm)
    state = {
        "messages": [],  # No patient message — triggers welcome_node
        "patient_id": patient_id,
        "phase": patient.phase,
        "goal": patient.goal.goal_text if patient.goal else None,
        "unanswered_count": patient.unanswered_count,
        "consent_verified": patient.consent_given,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
        "safety_category": None,
        "transition_event": None,
    }

    result = await graph.ainvoke(state)

    # Save coach welcome message
    coach_content = ""
    for msg in reversed(result.get("messages", [])):
        if isinstance(msg, AIMessage):
            coach_content = msg.content
            break

    if coach_content:
        coach_msg = Message(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            role=MessageRole.COACH,
            content=coach_content,
        )
        session.add(coach_msg)

    _persist_phase_transition(session, patient, result, "welcome_transition")
    await session.commit()

    return coach_content


async def run_graph(
    patient_id: str,
    message: str,
    session,
    llm,
    scheduler=None,
) -> str:
    """Convenience function: load patient, invoke graph, persist results."""
    from datetime import datetime

    # Load patient
    stmt = select(Patient).where(Patient.id == patient_id)
    patient = (await session.execute(stmt)).scalar_one()

    # Load conversation history BEFORE saving the current message to avoid duplication
    history_stmt = (
        select(Message)
        .where(Message.patient_id == patient_id)
        .order_by(Message.created_at.desc())
        .limit(HISTORY_WINDOW)
    )
    history_messages = (await session.execute(history_stmt)).scalars().all()
    history_messages.reverse()  # Oldest first

    # Convert to LangChain message types
    langchain_history = []
    for msg in history_messages:
        if msg.role == MessageRole.PATIENT:
            langchain_history.append(HumanMessage(content=msg.content))
        else:
            langchain_history.append(AIMessage(content=msg.content))

    # Save patient message
    patient_msg = Message(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        role=MessageRole.PATIENT,
        content=message,
    )
    session.add(patient_msg)
    await session.commit()

    # Build and invoke graph with tools bound to session
    from ai_health_coach.tools import get_all_tools
    tools = get_all_tools(session)
    graph = build_graph(llm, tools=tools)
    old_phase = patient.phase
    state = {
        "messages": langchain_history + [HumanMessage(content=message)],
        "patient_id": patient_id,
        "phase": patient.phase,
        "goal": patient.goal.goal_text if patient.goal else None,
        "unanswered_count": patient.unanswered_count,
        "consent_verified": patient.consent_given,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
        "safety_category": None,
        "transition_event": None,
    }

    result = await graph.ainvoke(state)

    # Extract coach response
    coach_content = ""
    for msg in reversed(result.get("messages", [])):
        if isinstance(msg, AIMessage):
            coach_content = msg.content
            break

    # Save coach response
    if coach_content:
        coach_msg = Message(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            role=MessageRole.COACH,
            content=coach_content,
        )
        session.add(coach_msg)

    # CRISIS alert
    if result.get("safety_category") == "CRISIS":
        alert = Alert(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            severity="critical",
            title="CRISIS: Potential mental health emergency",
            description=f"Patient message triggered crisis detection. Message: {message[:500]}",
        )
        session.add(alert)

    # Dormant transition alert
    if result.get("transition_event") == "re_engaging_to_dormant":
        alert = Alert(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            severity="warning",
            title=f"Patient {patient.name} has gone dormant",
            description="Patient has not responded to 3 re-engagement attempts and transitioned to DORMANT.",
        )
        session.add(alert)

    # Log phase transitions
    _persist_phase_transition(session, patient, result)

    if result.get("goal") and not patient.goal:
        from ai_health_coach.models.patient import Goal
        goal = Goal(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            goal_text=result["goal"],
        )
        session.add(goal)
    if "unanswered_count" in result:
        patient.unanswered_count = result["unanswered_count"]

    patient.last_interaction_at = datetime.utcnow()
    await session.commit()

    # Schedule follow-ups on ONBOARDING → ACTIVE transition
    if old_phase == Phase.ONBOARDING and patient.phase == Phase.ACTIVE and scheduler:
        from ai_health_coach.scheduler.followup import schedule_followups
        schedule_followups(patient_id, datetime.utcnow(), scheduler)

    return coach_content


async def run_followup(patient_id: str, interaction_type: str, session, llm, scheduler=None):
    """Invoke graph for a scheduled follow-up (no patient message)."""
    from datetime import datetime

    stmt = select(Patient).where(Patient.id == patient_id)
    patient = (await session.execute(stmt)).scalar_one_or_none()
    if not patient or not patient.consent_given:
        return

    # Load recent history for context
    history_stmt = (
        select(Message)
        .where(Message.patient_id == patient_id)
        .order_by(Message.created_at.desc())
        .limit(HISTORY_WINDOW)
    )
    history_messages = (await session.execute(history_stmt)).scalars().all()
    history_messages.reverse()

    langchain_history = []
    for msg in history_messages:
        if msg.role == MessageRole.PATIENT:
            langchain_history.append(HumanMessage(content=msg.content))
        else:
            langchain_history.append(AIMessage(content=msg.content))

    graph = build_graph(llm)
    state = {
        "messages": langchain_history,
        "patient_id": patient_id,
        "phase": patient.phase,
        "goal": patient.goal.goal_text if patient.goal else None,
        "unanswered_count": patient.unanswered_count,
        "consent_verified": patient.consent_given,
        "interaction_type": interaction_type,
        "safety_blocked": False,
        "retry_count": 0,
    }
    result = await graph.ainvoke(state)

    # Save coach message
    coach_content = ""
    for msg in reversed(result.get("messages", [])):
        if isinstance(msg, AIMessage):
            coach_content = msg.content
            break
    if coach_content:
        coach_msg = Message(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            role=MessageRole.COACH,
            content=coach_content,
        )
        session.add(coach_msg)

    # Update unanswered count and phase
    new_unanswered = result.get("unanswered_count", patient.unanswered_count)
    if "unanswered_count" in result:
        patient.unanswered_count = new_unanswered

    _persist_phase_transition(session, patient, result, "followup_transition")

    patient.last_interaction_at = datetime.utcnow()
    await session.commit()

    # Schedule backoff re-engagement if unanswered and not dormant
    if scheduler and new_unanswered > 0:
        from ai_health_coach.scheduler.followup import schedule_backoff_checkin, should_go_dormant
        if not should_go_dormant(new_unanswered):
            schedule_backoff_checkin(patient_id, new_unanswered, scheduler)
