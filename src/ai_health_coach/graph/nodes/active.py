import json

from langchain_core.messages import AIMessage, SystemMessage

from ai_health_coach.graph.state import CoachState
from ai_health_coach.safety.classifier import keyword_check
from ai_health_coach.safety.fallback import SAFE_FALLBACK_MESSAGE
from ai_health_coach.tools.program import get_program_summary
from ai_health_coach.tools.adherence import get_adherence_summary

ACTIVE_SYSTEM_PROMPT = (
    "You are an AI Health Coach assistant for MedBridge. You help patients stay motivated "
    "with their home exercise program. Be encouraging and supportive. "
    "NEVER provide clinical advice, diagnoses, or medication recommendations. "
    "If asked clinical questions, redirect to their care team. "
    "You can reference their exercise program and adherence data."
)

CHECKIN_PROMPTS = {
    "celebration": (
        "Generate an enthusiastic celebration message! The patient has been doing great. "
        "Reference their adherence and streak. Keep it brief and joyful."
    ),
    "nudge": (
        "Generate a gentle nudge message. Encourage the patient to keep up with their exercises. "
        "Reference specific exercises from their program. Keep it supportive, not pushy."
    ),
    "check_in": (
        "Generate a friendly check-in message. Ask how the patient's exercises are going. "
        "Keep it conversational and warm."
    ),
}


async def respond_node(state: CoachState, llm) -> dict:
    """Handle patient messages during active phase."""
    program = json.loads(get_program_summary.invoke({"patient_id": state["patient_id"]}))
    adherence = json.loads(get_adherence_summary.invoke({"patient_id": state["patient_id"]}))

    context = (
        f"Patient's goal: {state.get('goal', 'Not set')}\n"
        f"Adherence: {adherence['adherence_pct']}%, Streak: {adherence['streak']} days\n"
        f"Exercises: {', '.join(ex['name'] for ex in program['exercises'])}"
    )

    response = await llm.ainvoke([
        SystemMessage(content=ACTIVE_SYSTEM_PROMPT),
        SystemMessage(content=context),
        *state["messages"],
    ])

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


async def checkin_node(state: CoachState, llm) -> dict:
    """Generate scheduled check-in messages with tone variation."""
    interaction_type = state.get("interaction_type", "check_in")
    prompt = CHECKIN_PROMPTS.get(interaction_type, CHECKIN_PROMPTS["check_in"])

    program = json.loads(get_program_summary.invoke({"patient_id": state["patient_id"]}))
    adherence = json.loads(get_adherence_summary.invoke({"patient_id": state["patient_id"]}))

    context = (
        f"Patient's goal: {state.get('goal', 'Not set')}\n"
        f"Adherence: {adherence['adherence_pct']}%, Streak: {adherence['streak']} days\n"
        f"Exercises: {', '.join(ex['name'] for ex in program['exercises'])}"
    )

    response = await llm.ainvoke([
        SystemMessage(content=ACTIVE_SYSTEM_PROMPT),
        SystemMessage(content=context),
        SystemMessage(content=prompt),
    ])

    return {
        "messages": [response],
        "unanswered_count": state.get("unanswered_count", 0) + 1,
    }
