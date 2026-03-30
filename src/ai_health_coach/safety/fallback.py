SAFE_FALLBACK_MESSAGE = (
    "I appreciate your question! For anything related to your care plan, "
    "please reach out to your care team directly. "
    "I'm here to help with your exercise motivation and goal tracking!"
)

CRISIS_FALLBACK_MESSAGE = (
    "I hear you, and I want you to know that support is available. "
    "Your care team has been notified and will reach out to you. "
    "If you need immediate help, please call 988 (Suicide & Crisis Lifeline) or 911."
)


def get_safety_redirect_message() -> str:
    """Return a safe, non-clinical fallback message."""
    return SAFE_FALLBACK_MESSAGE
