import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch

from langchain_core.messages import AIMessage, HumanMessage

from ai_health_coach.graph.nodes.onboarding import welcome_node, elicit_goal_node, extract_goal_node, confirm_goal_node
from ai_health_coach.graph.state import CoachState
from ai_health_coach.models.enums import Phase


def _make_state(**overrides) -> CoachState:
    defaults = {
        "messages": [],
        "patient_id": "p1",
        "phase": Phase.ONBOARDING,
        "goal": None,
        "unanswered_count": 0,
        "consent_verified": True,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
    }
    defaults.update(overrides)
    return defaults


@pytest.mark.asyncio
async def test_welcome_node_references_exercises():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(
        content="Welcome, Sarah! I see you have Shoulder flexion stretch and Pendulum swings in your program."
    ))
    state = _make_state()
    result = await welcome_node(state, mock_llm, [])
    assert "messages" in result
    msg_content = result["messages"][-1].content
    assert len(msg_content) > 0


@pytest.mark.asyncio
async def test_elicit_goal_asks_open_ended():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(
        content="What would you like to achieve with your exercises?"
    ))
    state = _make_state()
    result = await elicit_goal_node(state, mock_llm, [])
    assert "messages" in result


@pytest.mark.asyncio
async def test_extract_goal_valid():
    """Valid goal: classify as GOAL_VALID, then extract goal text."""
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(side_effect=[
        AIMessage(content="GOAL_VALID"),  # classification
        AIMessage(content="Pain-free shoulder stretches by March 31"),  # extraction
    ])
    state = _make_state(
        messages=[HumanMessage(content="I want to do shoulder stretches without pain by March")],
    )
    result = await extract_goal_node(state, mock_llm, [])
    assert result.get("goal") is not None
    assert "Pain-free shoulder stretches" in result["goal"]


@pytest.mark.asyncio
async def test_extract_goal_unrealistic():
    """Unrealistic goal: classify as GOAL_UNREALISTIC, no goal set."""
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(side_effect=[
        AIMessage(content="GOAL_UNREALISTIC"),  # classification
        AIMessage(content="That's ambitious! Let's find something more achievable."),  # response
    ])
    state = _make_state(
        messages=[HumanMessage(content="I want to run a marathon tomorrow")],
    )
    result = await extract_goal_node(state, mock_llm, [])
    assert "goal" not in result
    assert "messages" in result


@pytest.mark.asyncio
async def test_extract_goal_refusal():
    """Patient refuses to set goal: classify as REFUSAL, no goal set."""
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(side_effect=[
        AIMessage(content="REFUSAL"),  # classification
        AIMessage(content="No pressure! How about something small?"),  # response
    ])
    state = _make_state(
        messages=[HumanMessage(content="I don't want to set a goal")],
    )
    result = await extract_goal_node(state, mock_llm, [])
    assert "goal" not in result
    assert "messages" in result


@pytest.mark.asyncio
async def test_extract_goal_off_topic():
    """Off-topic message: classify as OFF_TOPIC, no goal set."""
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(side_effect=[
        AIMessage(content="OFF_TOPIC"),  # classification
        AIMessage(content="Let's focus on setting a goal for your exercises."),  # response
    ])
    state = _make_state(
        messages=[HumanMessage(content="What medication should I take?")],
    )
    result = await extract_goal_node(state, mock_llm, [])
    assert "goal" not in result
    assert "messages" in result


@pytest.mark.asyncio
async def test_confirm_goal_includes_goal_text():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(
        content="Great! Your goal is: Pain-free shoulder stretches by March 31. Let's do this!"
    ))
    state = _make_state(goal="Pain-free shoulder stretches by March 31")
    result = await confirm_goal_node(state, mock_llm, [])
    assert "messages" in result
