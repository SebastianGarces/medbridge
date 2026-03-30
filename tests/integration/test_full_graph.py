import pytest
from unittest.mock import AsyncMock, MagicMock

from langchain_core.messages import AIMessage, HumanMessage

from ai_health_coach.graph.router import build_graph, run_graph
from ai_health_coach.graph.state import CoachState
from ai_health_coach.models.enums import Phase
from ai_health_coach.models.patient import Patient


@pytest.fixture
def mock_llm():
    llm = MagicMock()
    llm.ainvoke = AsyncMock(return_value=AIMessage(content="Welcome to your health coach!"))
    # bind_tools returns a mock whose ainvoke is also async
    bound = MagicMock()
    bound.ainvoke = AsyncMock(return_value=AIMessage(content="Welcome to your health coach!"))
    llm.bind_tools = MagicMock(return_value=bound)
    return llm


def test_graph_compiles(mock_llm):
    graph = build_graph(mock_llm)
    assert graph is not None


@pytest.mark.asyncio
async def test_consent_blocks_non_consented(mock_llm):
    graph = build_graph(mock_llm)
    state = {
        "messages": [HumanMessage(content="Hello")],
        "patient_id": "p1",
        "phase": Phase.PENDING,
        "goal": None,
        "unanswered_count": 0,
        "consent_verified": False,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
        "safety_category": None,
        "transition_event": None,
    }
    result = await graph.ainvoke(state)
    # Should have a message about needing consent
    assert len(result["messages"]) > 0


@pytest.mark.asyncio
async def test_onboarding_route(mock_llm):
    graph = build_graph(mock_llm)
    state = {
        "messages": [HumanMessage(content="Hi")],
        "patient_id": "p1",
        "phase": Phase.ONBOARDING,
        "goal": None,
        "unanswered_count": 0,
        "consent_verified": True,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
        "safety_category": None,
        "transition_event": None,
    }
    result = await graph.ainvoke(state)
    assert len(result["messages"]) > 0


@pytest.mark.asyncio
async def test_active_route(mock_llm):
    graph = build_graph(mock_llm)
    state = {
        "messages": [HumanMessage(content="How are my exercises?")],
        "patient_id": "p1",
        "phase": Phase.ACTIVE,
        "goal": "Walk daily",
        "unanswered_count": 0,
        "consent_verified": True,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
        "safety_category": None,
        "transition_event": None,
    }
    result = await graph.ainvoke(state)
    assert len(result["messages"]) > 0


@pytest.mark.asyncio
async def test_phase_transition_after_goal(mock_llm):
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(content="Pain-free stretches by March"))
    graph = build_graph(mock_llm)
    state = {
        "messages": [HumanMessage(content="I want to stretch pain-free by March")],
        "patient_id": "p1",
        "phase": Phase.ONBOARDING,
        "goal": None,
        "unanswered_count": 0,
        "consent_verified": True,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
        "safety_category": None,
        "transition_event": None,
    }
    result = await graph.ainvoke(state)
    # The onboarding subgraph should extract a goal
    assert result.get("goal") is not None


@pytest.mark.asyncio
async def test_run_graph_saves_messages(db_session, mock_llm):
    patient = Patient(id="p-run", name="Run Test", consent_given=True, phase=Phase.ACTIVE)
    db_session.add(patient)
    await db_session.commit()

    response = await run_graph("p-run", "How are my exercises?", db_session, mock_llm)
    assert response is not None

    from ai_health_coach.models.patient import Message
    from sqlalchemy import select
    stmt = select(Message).where(Message.patient_id == "p-run")
    messages = (await db_session.execute(stmt)).scalars().all()
    assert len(messages) >= 2  # patient msg + coach response


@pytest.mark.asyncio
async def test_run_graph_loads_history(db_session, mock_llm):
    """Verify that run_graph loads prior messages and passes them to the graph."""
    from ai_health_coach.models.patient import Message
    from ai_health_coach.models.enums import MessageRole
    from sqlalchemy import select
    import uuid

    patient = Patient(id="p-hist", name="History Test", consent_given=True, phase=Phase.ACTIVE)
    db_session.add(patient)
    await db_session.commit()

    # Create some prior conversation messages
    for i in range(3):
        db_session.add(Message(
            id=str(uuid.uuid4()),
            patient_id="p-hist",
            role=MessageRole.PATIENT,
            content=f"Patient message {i}",
        ))
        db_session.add(Message(
            id=str(uuid.uuid4()),
            patient_id="p-hist",
            role=MessageRole.COACH,
            content=f"Coach response {i}",
        ))
    await db_session.commit()

    # Track what messages the LLM receives (first call = the subgraph node)
    first_call_messages = []
    call_count = 0
    async def capture_ainvoke(messages, **kwargs):
        nonlocal call_count
        if call_count == 0:
            first_call_messages.extend(messages)
        call_count += 1
        return AIMessage(content="Got your history!")
    mock_llm.ainvoke = capture_ainvoke
    # Also capture on the bound tools mock (tool loop calls llm_with_tools.ainvoke)
    bound_mock = mock_llm.bind_tools.return_value
    bound_mock.ainvoke = capture_ainvoke

    response = await run_graph("p-hist", "New message", db_session, mock_llm)
    assert response is not None

    # The first LLM call should have received history messages + the new message
    human_msgs = [m for m in first_call_messages if isinstance(m, HumanMessage)]
    ai_msgs = [m for m in first_call_messages if isinstance(m, AIMessage)]

    # Should have the 3 prior patient messages + 1 new message
    assert len(human_msgs) >= 4
    # Should have the 3 prior coach messages
    assert len(ai_msgs) >= 3
    # Verify history content is present
    history_contents = [m.content for m in human_msgs]
    assert "Patient message 0" in history_contents
    assert "Patient message 2" in history_contents
    assert "New message" in history_contents
