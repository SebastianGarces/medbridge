from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.tools.goals import make_set_goal
from ai_health_coach.tools.reminders import make_set_reminder
from ai_health_coach.tools.program import get_program_summary
from ai_health_coach.tools.adherence import get_adherence_summary
from ai_health_coach.tools.alerts import make_alert_clinician


def get_all_tools(session: AsyncSession) -> list:
    """Return all 5 tools, binding DB-dependent ones to the given session."""
    return [
        make_set_goal(session),
        make_set_reminder(session),
        get_program_summary,
        get_adherence_summary,
        make_alert_clinician(session),
    ]
