from langchain_core.messages import HumanMessage

from ai_health_coach.graph.state import CoachState
from ai_health_coach.models.enums import Phase


def route_by_phase(state: CoachState) -> str:
    """Return subgraph name based on current phase."""
    match state["phase"]:
        case Phase.ONBOARDING:
            return "onboarding_subgraph"
        case Phase.ACTIVE:
            return "active_subgraph"
        case Phase.RE_ENGAGING:
            return "re_engaging_subgraph"
        case Phase.DORMANT:
            return "dormant_subgraph"
        case _:
            return "pending_check"


def last_message_is_from_patient(state: CoachState) -> bool:
    """Check if the last message in state is from the patient."""
    messages = state.get("messages", [])
    if not messages:
        return False
    return isinstance(messages[-1], HumanMessage)


def backoff_exhausted(state: CoachState) -> bool:
    """Check if re-engagement backoff is exhausted (3 unanswered)."""
    return state.get("unanswered_count", 0) >= 3


def check_phase_transition(state: CoachState) -> CoachState:
    """Apply deterministic phase transition rules. Returns updated state."""
    phase = state["phase"]
    new_state = dict(state)

    if phase == Phase.PENDING and state.get("consent_verified"):
        new_state["phase"] = Phase.ONBOARDING
        return new_state

    if phase == Phase.ONBOARDING and state.get("goal"):
        new_state["phase"] = Phase.ACTIVE
        return new_state

    if phase == Phase.ACTIVE and state.get("unanswered_count", 0) >= 3:
        new_state["phase"] = Phase.RE_ENGAGING
        return new_state

    if phase == Phase.RE_ENGAGING:
        if last_message_is_from_patient(state):
            new_state["phase"] = Phase.ACTIVE
            new_state["unanswered_count"] = 0
            new_state["transition_event"] = None
            return new_state
        if backoff_exhausted(state):
            new_state["phase"] = Phase.DORMANT
            new_state["transition_event"] = "re_engaging_to_dormant"
            return new_state

    if phase == Phase.DORMANT and last_message_is_from_patient(state):
        new_state["phase"] = Phase.ACTIVE
        new_state["unanswered_count"] = 0
        return new_state

    return new_state
