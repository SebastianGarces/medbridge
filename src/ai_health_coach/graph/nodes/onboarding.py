import json

from langchain_core.messages import AIMessage, SystemMessage, HumanMessage

from ai_health_coach.graph.state import CoachState
from ai_health_coach.safety.classifier import keyword_check
from ai_health_coach.safety.fallback import SAFE_FALLBACK_MESSAGE
from ai_health_coach.tools.program import get_program_summary

ONBOARDING_SYSTEM_PROMPT = (
    "You are an AI Health Coach assistant for MedBridge. You are helping a patient get started "
    "with their home exercise program. Be warm, encouraging, and motivational. "
    "NEVER provide clinical advice, diagnoses, or medication recommendations. "
    "If the patient asks a clinical question, redirect them to their care team."
)


async def welcome_node(state: CoachState, llm) -> dict:
    """Generate welcome message referencing the patient's exercises."""
    program = json.loads(get_program_summary.invoke({"patient_id": state["patient_id"]}))
    exercises = ", ".join(ex["name"] for ex in program["exercises"])

    response = await llm.ainvoke([
        SystemMessage(content=ONBOARDING_SYSTEM_PROMPT),
        SystemMessage(content=f"The patient's assigned exercises are: {exercises}"),
        HumanMessage(content=(
            "Generate a warm welcome message for the patient. Reference their exercises. "
            "Keep it brief and encouraging."
        )),
    ])
    return {"messages": [response]}


async def elicit_goal_node(state: CoachState, llm) -> dict:
    """Ask the patient for their exercise goal."""
    response = await llm.ainvoke([
        SystemMessage(content=ONBOARDING_SYSTEM_PROMPT),
        SystemMessage(content=(
            "Ask the patient what they'd like to achieve with their exercises. "
            "Keep it open-ended and encouraging. One question only."
        )),
        *state["messages"],
    ])
    return {"messages": [response]}


async def extract_goal_node(state: CoachState, llm) -> dict:
    """Extract structured goal from patient's response."""
    response = await llm.ainvoke([
        SystemMessage(content=(
            "Extract the patient's exercise goal from their message. "
            "Return ONLY the goal statement, concise and clear. "
            "If the goal seems unrealistic, return it as-is for now."
        )),
        *state["messages"],
    ])

    goal_text = response.content.strip()
    return {
        "messages": [response],
        "goal": goal_text,
    }


async def confirm_goal_node(state: CoachState, llm) -> dict:
    """Confirm the extracted goal with the patient."""
    goal = state.get("goal", "")
    response = await llm.ainvoke([
        SystemMessage(content=ONBOARDING_SYSTEM_PROMPT),
        SystemMessage(content=(
            f"The patient's goal has been set to: '{goal}'. "
            "Confirm this goal with the patient in an encouraging way. "
            "Let them know you'll help them stay on track."
        )),
        *state["messages"],
    ])
    return {"messages": [response]}
