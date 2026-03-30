import uuid
from datetime import datetime

from langchain_core.tools import tool, StructuredTool
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.models.patient import Reminder


def make_set_reminder(session: AsyncSession) -> StructuredTool:
    """Create a set_reminder tool bound to the given DB session."""

    @tool
    async def set_reminder(patient_id: str, reminder_type: str, scheduled_date: str) -> str:
        """Schedule a follow-up reminder for the patient."""
        try:
            dt = datetime.fromisoformat(scheduled_date)
        except ValueError:
            return f"Invalid date format: {scheduled_date}. Use ISO format (YYYY-MM-DD)."

        reminder = Reminder(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            reminder_type=reminder_type,
            scheduled_date=dt,
        )
        session.add(reminder)
        await session.commit()
        return (
            f"Reminder scheduled for patient {patient_id}: "
            f"{reminder_type} on {scheduled_date}"
        )

    return set_reminder
