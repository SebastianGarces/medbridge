from langchain_core.messages import AIMessage, SystemMessage

from ai_health_coach.graph.state import CoachState


async def warm_reengagement_node(state: CoachState, llm) -> dict:
    """Provide warm welcome-back message when dormant patient sends message."""
    response = await llm.ainvoke([
        SystemMessage(content=(
            "You are an AI Health Coach. A patient who has been away for a while "
            "has sent a message. Welcome them back warmly! Be excited to hear from them. "
            "Remind them of their goal and encourage them to restart their exercises. "
            "NEVER provide clinical advice."
        )),
        SystemMessage(content=f"Patient's previous goal: {state.get('goal', 'their exercises')}"),
        *state["messages"],
    ])
    return {"messages": [response]}
