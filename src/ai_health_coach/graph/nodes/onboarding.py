from langchain_core.messages import AIMessage, SystemMessage, HumanMessage

from ai_health_coach.graph.state import CoachState
from ai_health_coach.graph.tool_loop import prepare_tools, run_tool_loop
from ai_health_coach.safety.classifier import keyword_check
from ai_health_coach.safety.fallback import SAFE_FALLBACK_MESSAGE

ONBOARDING_SYSTEM_PROMPT = (
    "You are an AI Health Coach assistant for MedBridge. You are helping a patient get started "
    "with their home exercise program. Be warm, encouraging, and motivational. "
    "NEVER provide clinical advice, diagnoses, or medication recommendations. "
    "If the patient asks a clinical question, redirect them to their care team."
)

CLASSIFICATION_PROMPT = (
    "Analyze the patient's message and classify it as exactly one of:\n"
    "GOAL_VALID: A reasonable, achievable exercise or wellness goal\n"
    "GOAL_UNREALISTIC: An exercise goal that seems unrealistic or potentially harmful "
    "(e.g., 'run a marathon tomorrow', 'do 500 pushups daily')\n"
    "REFUSAL: Patient is refusing or avoiding setting a goal "
    "(e.g., 'I don't want to', 'no thanks', 'leave me alone')\n"
    "OFF_TOPIC: Patient is asking about something unrelated to goal-setting "
    "(e.g., clinical questions, general chat)\n"
    "Respond with ONLY the classification word."
)

UNREALISTIC_GOAL_PROMPT = (
    "The patient has expressed a goal that seems unrealistic or potentially harmful. "
    "Acknowledge their ambition warmly, then gently explain why it might need adjustment. "
    "Suggest they refine it to something more achievable as a starting point. "
    "Ask a specific follow-up question. Keep it encouraging, not dismissive."
)

REFUSAL_PROMPT = (
    "The patient seems reluctant to set a goal right now. "
    "Acknowledge their feelings with empathy. Don't pressure them. "
    "Try a different angle — suggest a very small, easy goal as an example "
    "(like 'complete exercises 3 times this week'). "
    "Make it feel low-pressure and optional."
)

OFF_TOPIC_PROMPT = (
    "The patient's message doesn't seem to be about setting an exercise goal. "
    "Gently redirect the conversation back to goal-setting. "
    "If they asked a clinical question, remind them to contact their care team."
)

GOAL_EXTRACTION_PROMPT = (
    "Extract the patient's exercise goal from their message. "
    "Return ONLY the goal statement, concise and clear."
)


async def welcome_node(state: CoachState, llm, tools) -> dict:
    """Generate welcome message referencing the patient's exercises."""
    messages = [
        SystemMessage(content=ONBOARDING_SYSTEM_PROMPT),
        SystemMessage(content=f"Patient ID: {state['patient_id']}"),
        HumanMessage(content=(
            "Generate a warm welcome message for the patient. "
            "Use the get_program_summary tool to look up their exercises and reference them. "
            "Keep it brief and encouraging."
        )),
    ]

    if tools:
        llm_with_tools, tools_by_name = prepare_tools(llm, tools)
        response = await run_tool_loop(llm_with_tools, messages, tools_by_name)
    else:
        response = await llm.ainvoke(messages)

    return {"messages": [response]}


async def elicit_goal_node(state: CoachState, llm, tools) -> dict:
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


async def extract_goal_node(state: CoachState, llm, tools) -> dict:
    """Extract goal with classification for edge cases (unrealistic, refusal, off-topic)."""
    # Step 1: Classify the patient's response
    classification = await llm.ainvoke([
        SystemMessage(content=CLASSIFICATION_PROMPT),
        *state["messages"],
    ])
    category = classification.content.strip().upper()

    # Step 2: Branch based on classification
    if "UNREALISTIC" in category:
        response = await llm.ainvoke([
            SystemMessage(content=ONBOARDING_SYSTEM_PROMPT),
            SystemMessage(content=UNREALISTIC_GOAL_PROMPT),
            *state["messages"],
        ])
        return {"messages": [response]}  # No goal set — stays in ONBOARDING

    if "REFUSAL" in category:
        response = await llm.ainvoke([
            SystemMessage(content=ONBOARDING_SYSTEM_PROMPT),
            SystemMessage(content=REFUSAL_PROMPT),
            *state["messages"],
        ])
        return {"messages": [response]}  # No goal set

    if "OFF_TOPIC" in category:
        response = await llm.ainvoke([
            SystemMessage(content=ONBOARDING_SYSTEM_PROMPT),
            SystemMessage(content=OFF_TOPIC_PROMPT),
            *state["messages"],
        ])
        return {"messages": [response]}  # No goal set

    # GOAL_VALID (default): extract the goal, then respond naturally
    extraction = await llm.ainvoke([
        SystemMessage(content=GOAL_EXTRACTION_PROMPT),
        *state["messages"],
    ])
    goal_text = extraction.content.strip()

    # Generate a natural confirmation response for the patient
    response = await llm.ainvoke([
        SystemMessage(content=ONBOARDING_SYSTEM_PROMPT),
        SystemMessage(content=(
            f"The patient just told you their goal. You extracted it as: '{goal_text}'. "
            "Confirm you've set this as their goal in a warm, encouraging way. "
            "Keep it brief — 1-2 sentences. Don't repeat the goal word-for-word, "
            "acknowledge it naturally and let them know you'll help them get there."
        )),
        *state["messages"],
    ])
    return {"messages": [response], "goal": goal_text}


async def confirm_goal_node(state: CoachState, llm, tools) -> dict:
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
