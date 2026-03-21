import pytest
from unittest.mock import AsyncMock, MagicMock

from langchain_core.messages import AIMessage, HumanMessage

from ai_health_coach.graph.nodes.active import respond_node, checkin_node
from ai_health_coach.models.enums import Phase


def _make_state(**overrides):
    defaults = {
        "messages": [],
        "patient_id": "p1",
        "phase": Phase.ACTIVE,
        "goal": "Walk daily",
        "unanswered_count": 0,
        "consent_verified": True,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
    }
    defaults.update(overrides)
    return defaults


@pytest.mark.asyncio
async def test_respond_node_uses_tools():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(
        content="Your program includes Shoulder flexion stretch (3x10)."
    ))
    state = _make_state(messages=[HumanMessage(content="What exercises do I have?")])
    result = await respond_node(state, mock_llm)
    assert "messages" in result


@pytest.mark.asyncio
async def test_checkin_celebration_tone():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(
        content="Amazing work this week! You've been so consistent!"
    ))
    state = _make_state(interaction_type="celebration")
    result = await checkin_node(state, mock_llm)
    assert "messages" in result


@pytest.mark.asyncio
async def test_checkin_nudge_tone():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(
        content="Hey! Just checking in — how are your exercises going?"
    ))
    state = _make_state(interaction_type="nudge")
    result = await checkin_node(state, mock_llm)
    assert "messages" in result


@pytest.mark.asyncio
async def test_checkin_increments_unanswered():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(content="How are you?"))
    state = _make_state(interaction_type="check_in", unanswered_count=1)
    result = await checkin_node(state, mock_llm)
    assert result["unanswered_count"] == 2
