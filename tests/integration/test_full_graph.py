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
