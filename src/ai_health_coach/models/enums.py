from enum import Enum


class Phase(str, Enum):
    PENDING = "PENDING"
    ONBOARDING = "ONBOARDING"
    ACTIVE = "ACTIVE"
    RE_ENGAGING = "RE_ENGAGING"
    DORMANT = "DORMANT"


class InteractionType(str, Enum):
    CELEBRATION = "celebration"
    NUDGE = "nudge"
    CHECK_IN = "check_in"
    RE_ENGAGEMENT = "re_engagement"


class AlertSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    SAFETY = "safety"


class MessageRole(str, Enum):
    COACH = "coach"
    PATIENT = "patient"
    SYSTEM = "system"
