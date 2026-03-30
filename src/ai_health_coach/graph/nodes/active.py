from langchain_core.messages import AIMessage, SystemMessage

from ai_health_coach.graph.state import CoachState
from ai_health_coach.graph.tool_loop import prepare_tools, run_tool_loop
from ai_health_coach.safety.classifier import keyword_check
from ai_health_coach.safety.fallback import SAFE_FALLBACK_MESSAGE

ACTIVE_SYSTEM_PROMPT = (
    "You are an AI Health Coach assistant for MedBridge. You help patients stay motivated "
    "with their home exercise program. Be encouraging and supportive. "
    "NEVER provide clinical advice, diagnoses, or medication recommendations. "
    "If asked clinical questions, redirect to their care team. "
    "You have access to tools to look up the patient's exercise program and adherence data. "
    "Use the get_program_summary and get_adherence_summary tools to retrieve relevant information "
    "before responding to the patient."
)

CHECKIN_PROMPTS = {
    "celebration": (
        "Generate an enthusiastic celebration message! The patient has been doing great. "
        "Use the get_adherence_summary tool to check their adherence and streak. Keep it brief and joyful."
    ),
    "nudge": (
        "Generate a gentle nudge message. Encourage the patient to keep up with their exercises. "
        "Use the get_program_summary tool to reference specific exercises. Keep it supportive, not pushy."
    ),
    "check_in": (
        "Generate a friendly check-in message. Ask how the patient's exercises are going. "
        "Keep it conversational and warm."
    ),
}


async def respond_node(state: CoachState, llm, tools) -> dict:
    """Handle patient messages during active phase."""
    context = (
        f"Patient ID: {state['patient_id']}\n"
        f"Patient's goal: {state.get('goal', 'Not set')}"
    )

    messages = [
        SystemMessage(content=ACTIVE_SYSTEM_PROMPT),
        SystemMessage(content=context),
        *state["messages"],
    ]

    if tools:
        llm_with_tools, tools_by_name = prepare_tools(llm, tools)
        response = await run_tool_loop(llm_with_tools, messages, tools_by_name)
    else:
        response = await llm.ainvoke(messages)

    # Safety check on output
    if keyword_check(response.content):
        return {
            "messages": [AIMessage(content=SAFE_FALLBACK_MESSAGE)],
            "safety_blocked": True,
        }

    return {
        "messages": [response],
        "safety_blocked": False,
    }


async def checkin_node(state: CoachState, llm, tools) -> dict:
    """Generate scheduled check-in messages with tone variation."""
    interaction_type = state.get("interaction_type", "check_in")
    prompt = CHECKIN_PROMPTS.get(interaction_type, CHECKIN_PROMPTS["check_in"])

    context = (
        f"Patient ID: {state['patient_id']}\n"
        f"Patient's goal: {state.get('goal', 'Not set')}"
    )

    messages = [
        SystemMessage(content=ACTIVE_SYSTEM_PROMPT),
        SystemMessage(content=context),
        SystemMessage(content=prompt),
    ]

    if tools:
        llm_with_tools, tools_by_name = prepare_tools(llm, tools)
        response = await run_tool_loop(llm_with_tools, messages, tools_by_name)
    else:
        response = await llm.ainvoke(messages)

    return {
        "messages": [response],
        "unanswered_count": state.get("unanswered_count", 0) + 1,
    }
