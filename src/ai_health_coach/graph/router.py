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
from ai_health_coach.safety.fallback import SAFE_FALLBACK_MESSAGE
from ai_health_coach.models.enums import Phase
from ai_health_coach.models.patient import Patient, Message
from ai_health_coach.models.enums import MessageRole
from sqlalchemy import select


def _wrap_node(node_fn, llm):
    """Wrap a node function to inject the LLM."""
    async def wrapper(state):
        return await node_fn(state, llm)
    return wrapper


def build_graph(llm):
    """Build the main LangGraph StateGraph."""
    graph = StateGraph(CoachState)

    # Add nodes
    graph.add_node("consent_check", consent_check_node)
    graph.add_node("onboarding_subgraph", _wrap_node(_onboarding_handler, llm))
    graph.add_node("active_subgraph", _wrap_node(_active_handler, llm))
    graph.add_node("re_engaging_subgraph", _wrap_node(nudge_node, llm))
    graph.add_node("dormant_subgraph", _wrap_node(warm_reengagement_node, llm))
    graph.add_node("pending_check", consent_check_node)
    graph.add_node("safety_classify", _wrap_node(_safety_classify_node, llm))
    graph.add_node("safety_retry", _wrap_node(_safety_retry_node, llm))
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
        return {"safety_blocked": False, "retry_count": 0}

    # Find the last AI message (the coach's outbound response)
    last_ai_content = None
    for msg in reversed(messages):
        if isinstance(msg, AIMessage):
            last_ai_content = msg.content
            break

    if not last_ai_content:
        return {"safety_blocked": False, "retry_count": 0}

    result = await classify_message(last_ai_content, llm)
    if result.is_safe:
        return {"safety_blocked": False, "retry_count": 0}

    # Blocked — mark for retry
    return {"safety_blocked": True, "retry_count": 0}


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


async def _onboarding_handler(state: CoachState, llm) -> dict:
    """Combined onboarding handler — determines which sub-step to run."""
    messages = state.get("messages", [])
    goal = state.get("goal")

    # If goal already confirmed, run confirm
    if goal:
        return await confirm_goal_node(state, llm)

    # If patient has sent a message (potential goal), extract it
    patient_messages = [m for m in messages if isinstance(m, HumanMessage)]
    if patient_messages:
        return await extract_goal_node(state, llm)

    # Otherwise, welcome + elicit
    return await welcome_node(state, llm)


async def _active_handler(state: CoachState, llm) -> dict:
    """Active phase handler — route between respond and checkin."""
    interaction_type = state.get("interaction_type")
    if interaction_type:
        return await checkin_node(state, llm)
    return await respond_node(state, llm)


async def _phase_transition_node(state: CoachState) -> dict:
    """Apply deterministic phase transitions."""
    return check_phase_transition(state)


async def run_graph(
    patient_id: str,
    message: str,
    session,
    llm,
) -> str:
    """Convenience function: load patient, invoke graph, persist results."""
    # Load patient
    stmt = select(Patient).where(Patient.id == patient_id)
    patient = (await session.execute(stmt)).scalar_one()

    # Save patient message
    patient_msg = Message(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        role=MessageRole.PATIENT,
        content=message,
    )
    session.add(patient_msg)
    await session.commit()

    # Build and invoke graph
    graph = build_graph(llm)
    state = {
        "messages": [HumanMessage(content=message)],
        "patient_id": patient_id,
        "phase": patient.phase,
        "goal": patient.goal.goal_text if patient.goal else None,
        "unanswered_count": patient.unanswered_count,
        "consent_verified": patient.consent_given,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
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

    # Update patient state
    if result.get("phase") and result["phase"] != patient.phase:
        patient.phase = result["phase"]
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

    from datetime import datetime
    patient.last_interaction_at = datetime.utcnow()
    await session.commit()

    return coach_content
