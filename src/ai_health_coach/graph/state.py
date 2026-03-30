from typing import Annotated, TypedDict

from langgraph.graph import add_messages


class CoachState(TypedDict):
    messages: Annotated[list, add_messages]
    patient_id: str
    phase: str
    goal: str | None
    unanswered_count: int
    consent_verified: bool
    interaction_type: str | None
    safety_blocked: bool
    retry_count: int
    safety_category: str | None
    transition_event: str | None
