import pytest
from unittest.mock import AsyncMock, MagicMock

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage

from ai_health_coach.graph.tool_loop import run_tool_loop, prepare_tools


def _make_tool(name, return_value="tool result"):
    """Create a mock tool."""
    tool = MagicMock()
    tool.name = name
    tool.ainvoke = AsyncMock(return_value=return_value)
    return tool


def _ai_message_with_tool_calls(content="", tool_calls=None):
    """Create an AIMessage with tool_calls."""
    msg = AIMessage(content=content, tool_calls=tool_calls or [])
    return msg


@pytest.mark.asyncio
async def test_no_tool_calls():
    """LLM returns text immediately — no tool loop iterations."""
    llm = MagicMock()
    llm.ainvoke = AsyncMock(return_value=AIMessage(content="Hello!"))

    messages = [HumanMessage(content="Hi")]
    result = await run_tool_loop(llm, messages, {})

    assert result.content == "Hello!"
    llm.ainvoke.assert_awaited_once()


@pytest.mark.asyncio
async def test_single_tool_call():
    """LLM calls one tool, then returns text."""
    tool = _make_tool("get_program_summary", return_value='{"exercises": []}')

    call_count = 0

    async def side_effect(messages):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _ai_message_with_tool_calls(
                tool_calls=[{"name": "get_program_summary", "args": {"patient_id": "p1"}, "id": "tc1"}]
            )
        return AIMessage(content="Your program has exercises.")

    llm = MagicMock()
    llm.ainvoke = AsyncMock(side_effect=side_effect)

    messages = [HumanMessage(content="What exercises?")]
    result = await run_tool_loop(llm, messages, {"get_program_summary": tool})

    assert result.content == "Your program has exercises."
    tool.ainvoke.assert_awaited_once_with({"patient_id": "p1"})
    assert llm.ainvoke.await_count == 2


@pytest.mark.asyncio
async def test_multiple_tool_calls():
    """LLM calls two tools sequentially, then returns text."""
    tool_a = _make_tool("get_program_summary", return_value='{"exercises": []}')
    tool_b = _make_tool("get_adherence_summary", return_value='{"adherence_pct": 80}')

    call_count = 0

    async def side_effect(messages):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _ai_message_with_tool_calls(
                tool_calls=[{"name": "get_program_summary", "args": {"patient_id": "p1"}, "id": "tc1"}]
            )
        if call_count == 2:
            return _ai_message_with_tool_calls(
                tool_calls=[{"name": "get_adherence_summary", "args": {"patient_id": "p1"}, "id": "tc2"}]
            )
        return AIMessage(content="You're at 80% adherence!")

    llm = MagicMock()
    llm.ainvoke = AsyncMock(side_effect=side_effect)

    messages = [HumanMessage(content="How am I doing?")]
    tools_by_name = {"get_program_summary": tool_a, "get_adherence_summary": tool_b}
    result = await run_tool_loop(llm, messages, tools_by_name)

    assert result.content == "You're at 80% adherence!"
    tool_a.ainvoke.assert_awaited_once()
    tool_b.ainvoke.assert_awaited_once()
    assert llm.ainvoke.await_count == 3


@pytest.mark.asyncio
async def test_unknown_tool():
    """Unknown tool name sends error ToolMessage back to LLM."""
    call_count = 0

    async def side_effect(messages):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _ai_message_with_tool_calls(
                tool_calls=[{"name": "nonexistent_tool", "args": {}, "id": "tc1"}]
            )
        return AIMessage(content="Sorry, let me try another way.")

    llm = MagicMock()
    llm.ainvoke = AsyncMock(side_effect=side_effect)

    messages = [HumanMessage(content="Do something")]
    result = await run_tool_loop(llm, messages, {})

    assert result.content == "Sorry, let me try another way."
    # Check that an error ToolMessage was appended
    tool_messages = [m for m in messages if isinstance(m, ToolMessage)]
    assert len(tool_messages) == 1
    assert "unknown tool" in tool_messages[0].content.lower()


@pytest.mark.asyncio
async def test_tool_execution_error():
    """Tool raises exception — error message sent back to LLM."""
    tool = _make_tool("buggy_tool")
    tool.ainvoke = AsyncMock(side_effect=RuntimeError("DB connection failed"))

    call_count = 0

    async def side_effect(messages):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _ai_message_with_tool_calls(
                tool_calls=[{"name": "buggy_tool", "args": {}, "id": "tc1"}]
            )
        return AIMessage(content="I had trouble fetching that data.")

    llm = MagicMock()
    llm.ainvoke = AsyncMock(side_effect=side_effect)

    messages = [HumanMessage(content="Check my data")]
    result = await run_tool_loop(llm, messages, {"buggy_tool": tool})

    assert result.content == "I had trouble fetching that data."
    tool_messages = [m for m in messages if isinstance(m, ToolMessage)]
    assert len(tool_messages) == 1
    assert "error" in tool_messages[0].content.lower()


@pytest.mark.asyncio
async def test_max_iteration_limit():
    """Loop stops after max iterations and returns fallback."""
    tool = _make_tool("looping_tool")

    # LLM always returns tool calls, never a final response
    llm = MagicMock()
    llm.ainvoke = AsyncMock(return_value=_ai_message_with_tool_calls(
        tool_calls=[{"name": "looping_tool", "args": {}, "id": "tc1"}]
    ))

    messages = [HumanMessage(content="Loop forever")]
    result = await run_tool_loop(llm, messages, {"looping_tool": tool}, max_iterations=3)

    assert "sorry" in result.content.lower() or "try again" in result.content.lower()
    assert llm.ainvoke.await_count == 3


@pytest.mark.asyncio
async def test_prepare_tools():
    """prepare_tools binds tools and creates lookup dict."""
    mock_llm = MagicMock()
    mock_bound = MagicMock()
    mock_llm.bind_tools = MagicMock(return_value=mock_bound)

    tool_a = _make_tool("tool_a")
    tool_b = _make_tool("tool_b")

    llm_with_tools, tools_by_name = prepare_tools(mock_llm, [tool_a, tool_b])

    assert llm_with_tools is mock_bound
    mock_llm.bind_tools.assert_called_once_with([tool_a, tool_b])
    assert tools_by_name == {"tool_a": tool_a, "tool_b": tool_b}
