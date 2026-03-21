from langchain_core.messages import AIMessage

from ai_health_coach.graph.state import CoachState


async def consent_check_node(state: CoachState, **kwargs) -> dict:
    """Verify consent_verified in state; if false, return blocked message."""
    if not state.get("consent_verified", False):
        return {
            "messages": [AIMessage(
                content="I need your consent before we can continue. "
                "Please visit your settings to enable the AI Health Coach."
            )],
            "safety_blocked": True,
        }
    return {}
