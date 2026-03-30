"""Tool loop for autonomous LLM tool calling."""

import logging

from langchain_core.messages import AIMessage, ToolMessage

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 5


def prepare_tools(llm, tools):
    """Bind tools to LLM and return (llm_with_tools, tools_by_name)."""
    llm_with_tools = llm.bind_tools(tools)
    tools_by_name = {t.name: t for t in tools}
    return llm_with_tools, tools_by_name


async def run_tool_loop(llm_with_tools, messages, tools_by_name, max_iterations=MAX_TOOL_ITERATIONS):
    """Call the LLM, execute any tool calls, and loop until a final text response.

    Returns the final AIMessage (with no tool_calls).
    """
    for _ in range(max_iterations):
        response = await llm_with_tools.ainvoke(messages)

        tool_calls = getattr(response, "tool_calls", None)
        if not tool_calls:
            return response

        messages.append(response)

        for tc in tool_calls:
            tool_name = tc["name"]
            tool_args = tc["args"]
            tool_call_id = tc["id"]

            if tool_name not in tools_by_name:
                messages.append(ToolMessage(
                    content=f"Error: unknown tool '{tool_name}'",
                    tool_call_id=tool_call_id,
                ))
                continue

            try:
                result = await tools_by_name[tool_name].ainvoke(tool_args)
                messages.append(ToolMessage(
                    content=str(result),
                    tool_call_id=tool_call_id,
                ))
            except Exception as exc:
                logger.exception("Tool %s raised an error", tool_name)
                messages.append(ToolMessage(
                    content=f"Error executing {tool_name}: {exc}",
                    tool_call_id=tool_call_id,
                ))

    # Safety limit reached — return the last response as-is
    logger.warning("Tool loop hit max iterations (%d)", max_iterations)
    return AIMessage(content="I'm sorry, I had trouble processing that. Could you try again?")
