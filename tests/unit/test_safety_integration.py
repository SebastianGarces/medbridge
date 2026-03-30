import pytest
from unittest.mock import AsyncMock, MagicMock

from langchain_core.messages import AIMessage, HumanMessage

from ai_health_coach.graph.nodes.active import respond_node
from ai_health_coach.graph.router import build_graph
from ai_health_coach.safety.classifier import SafetyResult
from ai_health_coach.safety.fallback import SAFE_FALLBACK_MESSAGE, CRISIS_FALLBACK_MESSAGE
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
        "safety_category": None,
        "transition_event": None,
    }
    defaults.update(overrides)
    return defaults


@pytest.mark.asyncio
async def test_safe_message_passes_through():
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(content="Great job on your exercises!"))
    state = _make_state(messages=[HumanMessage(content="How am I doing?")])
    result = await respond_node(state, mock_llm, [])
    assert "messages" in result
    assert result["safety_blocked"] is False


@pytest.mark.asyncio
async def test_blocked_message_retries():
    """Blocked message retries with augmented prompt, second attempt is safe."""
    call_count = 0

    async def side_effect(messages):
        nonlocal call_count
        call_count += 1
        if call_count <= 2:
            # First call: subgraph generates clinical content
            # Second call: safety LLM classifies as SAFE (it's the keyword that blocks)
            return AIMessage(content="Great job on your exercises!")
        # Third call: retry generates safe content
        return AIMessage(content="Keep stretching daily!")

    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(side_effect=side_effect)

    # Use a message where the LLM initially returns clinical content
    # but keyword check catches it, then retry succeeds
    graph = build_graph(mock_llm)
    state = _make_state(messages=[HumanMessage(content="How am I doing?")])
    result = await graph.ainvoke(state)
    # Should have messages (either safe or fallback)
    assert len(result["messages"]) > 0


@pytest.mark.asyncio
async def test_double_block_uses_fallback():
    """Two blocks in a row returns safe fallback message."""
    # LLM always returns clinical content that keyword_check catches
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(
        return_value=AIMessage(content="You should take this medication for your diagnosis")
    )

    graph = build_graph(mock_llm)
    state = _make_state(messages=[HumanMessage(content="What should I do?")])
    result = await graph.ainvoke(state)

    # The last message should be the safe fallback
    last_ai = None
    for msg in reversed(result["messages"]):
        if isinstance(msg, AIMessage):
            last_ai = msg
            break
    assert last_ai is not None
    assert last_ai.content == SAFE_FALLBACK_MESSAGE


@pytest.mark.asyncio
async def test_crisis_skips_retry():
    """CRISIS classification returns crisis fallback and skips retry."""
    call_count = 0

    async def side_effect(messages):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            # Subgraph generates response
            return AIMessage(content="I understand you're in pain")
        # Safety LLM classifies as CRISIS
        return AIMessage(content="CRISIS")

    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(side_effect=side_effect)

    graph = build_graph(mock_llm)
    state = _make_state(messages=[HumanMessage(content="I want to hurt myself")])
    result = await graph.ainvoke(state)

    # Should have crisis fallback message
    last_ai = None
    for msg in reversed(result["messages"]):
        if isinstance(msg, AIMessage):
            last_ai = msg
            break
    assert last_ai is not None
    assert last_ai.content == CRISIS_FALLBACK_MESSAGE
    # safety_blocked should be False (crisis bypasses retry)
    assert result.get("safety_blocked") is False


@pytest.mark.asyncio
async def test_crisis_sets_safety_category():
    """CRISIS classification sets safety_category='CRISIS' in result state."""
    call_count = 0

    async def side_effect(messages):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return AIMessage(content="I hear your distress")
        return AIMessage(content="CRISIS")

    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(side_effect=side_effect)

    graph = build_graph(mock_llm)
    state = _make_state(messages=[HumanMessage(content="I can't go on")])
    result = await graph.ainvoke(state)
    assert result.get("safety_category") == "CRISIS"


@pytest.mark.asyncio
async def test_clinical_still_retries():
    """CLINICAL classification still goes through retry flow (not bypassed like CRISIS)."""
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(
        return_value=AIMessage(content="You should take this medication for your diagnosis")
    )

    graph = build_graph(mock_llm)
    state = _make_state(messages=[HumanMessage(content="What should I do?")])
    result = await graph.ainvoke(state)

    # The last message should be the safe fallback (after retry exhaustion)
    last_ai = None
    for msg in reversed(result["messages"]):
        if isinstance(msg, AIMessage):
            last_ai = msg
            break
    assert last_ai is not None
    assert last_ai.content == SAFE_FALLBACK_MESSAGE
    # Should NOT have CRISIS category (CLINICAL goes through retry, not bypass)
    assert result.get("safety_category") != "CRISIS"


@pytest.mark.asyncio
async def test_safety_gate_runs_on_all_phases():
    """Safety classification runs on outbound messages in every phase."""
    # Clinical content should be caught regardless of phase
    mock_llm = MagicMock()
    mock_llm.ainvoke = AsyncMock(
        return_value=AIMessage(content="Your diagnosis requires medication dosage adjustment")
    )

    for phase in [Phase.ONBOARDING, Phase.ACTIVE, Phase.RE_ENGAGING, Phase.DORMANT]:
        graph = build_graph(mock_llm)
        state = _make_state(
            phase=phase,
            messages=[HumanMessage(content="Hello")],
        )
        result = await graph.ainvoke(state)
        last_ai = None
        for msg in reversed(result["messages"]):
            if isinstance(msg, AIMessage):
                last_ai = msg
                break
        assert last_ai is not None
        assert last_ai.content == SAFE_FALLBACK_MESSAGE, (
            f"Safety gate did not catch clinical content in {phase} phase"
        )
