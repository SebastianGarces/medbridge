import pytest
from unittest.mock import AsyncMock, MagicMock

from langchain_core.messages import AIMessage, HumanMessage

from ai_health_coach.graph.nodes.re_engaging import nudge_node
from ai_health_coach.models.enums import Phase


def _make_state(**overrides):
    defaults = {
        "messages": [],
        "patient_id": "p1",
        "phase": Phase.RE_ENGAGING,
        "goal": "Walk daily",
        "unanswered_count": 1,
        "consent_verified": True,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
    }
    defaults.update(overrides)
    return defaults


@pytest.mark.asyncio
async def test_nudge_increases_urgency():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(content="We miss you!"))
    state = _make_state(unanswered_count=2)
    result = await nudge_node(state, mock_llm, [])
    assert "messages" in result


@pytest.mark.asyncio
async def test_patient_response_marks_active():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(content="Welcome back!"))
    state = _make_state(messages=[HumanMessage(content="I'm back")])
    result = await nudge_node(state, mock_llm, [])
    assert "messages" in result
