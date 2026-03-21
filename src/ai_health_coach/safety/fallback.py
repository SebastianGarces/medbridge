SAFE_FALLBACK_MESSAGE = (
    "I appreciate your question! For anything related to your care plan, "
    "please reach out to your care team directly. "
    "I'm here to help with your exercise motivation and goal tracking!"
)


def get_safety_redirect_message() -> str:
    """Return a safe, non-clinical fallback message."""
    return SAFE_FALLBACK_MESSAGE
