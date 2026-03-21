import pytest
from unittest.mock import AsyncMock, MagicMock

from langchain_core.messages import AIMessage, HumanMessage

from ai_health_coach.graph.nodes.dormant import warm_reengagement_node
from ai_health_coach.models.enums import Phase


def _make_state(**overrides):
    defaults = {
        "messages": [],
        "patient_id": "p1",
        "phase": Phase.DORMANT,
        "goal": "Walk daily",
        "unanswered_count": 3,
        "consent_verified": True,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
    }
    defaults.update(overrides)
    return defaults


@pytest.mark.asyncio
async def test_warm_reengagement_welcoming():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(
        content="It's great to hear from you again! Welcome back!"
    ))
    state = _make_state(messages=[HumanMessage(content="Hello")])
    result = await warm_reengagement_node(state, mock_llm)
    assert "messages" in result
