import re

from pydantic import BaseModel
from langchain_core.messages import SystemMessage, HumanMessage

CLINICAL_TERMS = [
    "diagnosis",
    "prescription",
    "medication",
    "dosage",
    "symptom",
    "treatment",
    "prognosis",
]

MEDICAL_ADVICE_PATTERNS = [
    r"you should take",
    r"increase your dose",
    r"stop taking",
    r"prescribe",
    r"diagnose",
]


class SafetyResult(BaseModel):
    is_safe: bool
    category: str  # SAFE, CLINICAL, CRISIS
    reason: str | None = None


def keyword_check(message: str) -> bool:
    """Return True if message contains clinical terms (i.e., is blocked)."""
    lower = message.lower()
    for term in CLINICAL_TERMS:
        if term in lower:
            return True
    for pattern in MEDICAL_ADVICE_PATTERNS:
        if re.search(pattern, lower):
            return True
    return False


async def llm_classify(message: str, llm) -> SafetyResult:
    """Use LLM to classify message as SAFE/CLINICAL/CRISIS."""
    system_prompt = (
        "Classify the following message as exactly one of: SAFE, CLINICAL, CRISIS.\n"
        "SAFE: Motivational, exercise-related, or general wellness.\n"
        "CLINICAL: Contains medical advice, diagnosis, or treatment recommendations.\n"
        "CRISIS: Indicates mental health emergency or self-harm.\n"
        "Respond with ONLY the classification word."
    )
    response = await llm.ainvoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=message),
    ])
    category = response.content.strip().upper()
    if category not in ("SAFE", "CLINICAL", "CRISIS"):
        category = "SAFE"

    return SafetyResult(
        is_safe=(category == "SAFE"),
        category=category,
        reason=f"LLM classified as {category}" if category != "SAFE" else None,
    )


async def classify_message(message: str, llm) -> SafetyResult:
    """Two-layer safety classification: keyword check first, then LLM."""
    if keyword_check(message):
        return SafetyResult(
            is_safe=False,
            category="CLINICAL",
            reason="Keyword filter detected clinical content",
        )
    return await llm_classify(message, llm)
