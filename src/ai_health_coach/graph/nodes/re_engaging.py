from langchain_core.messages import AIMessage, SystemMessage, HumanMessage

from ai_health_coach.graph.state import CoachState
from ai_health_coach.graph.edges import last_message_is_from_patient

RE_ENGAGING_SYSTEM_PROMPT = (
    "You are an AI Health Coach. The patient hasn't responded to recent check-ins. "
    "Be gentle and supportive, not guilt-tripping. "
    "NEVER provide clinical advice."
)


async def nudge_node(state: CoachState, llm, tools) -> dict:
    """Generate re-engagement messages with increasing urgency."""
    unanswered = state.get("unanswered_count", 1)

    if last_message_is_from_patient(state):
        # Patient responded — welcome them back
        response = await llm.ainvoke([
            SystemMessage(content=(
                "The patient has responded after a period of silence. "
                "Welcome them back warmly. Be encouraging about resuming their exercises."
            )),
            *state["messages"],
        ])
        return {"messages": [response]}

    urgency = "gentle" if unanswered <= 1 else "moderate" if unanswered == 2 else "concerned"

    response = await llm.ainvoke([
        SystemMessage(content=RE_ENGAGING_SYSTEM_PROMPT),
        SystemMessage(content=(
            f"This is attempt {unanswered} to re-engage. Use a {urgency} tone. "
            f"Patient's goal: {state.get('goal', 'their exercises')}. "
            "Keep the message brief."
        )),
    ])

    return {"messages": [response]}
