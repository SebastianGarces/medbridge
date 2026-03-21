from langchain_core.tools import tool, StructuredTool
from sqlalchemy.ext.asyncio import AsyncSession


def make_set_reminder(session: AsyncSession) -> StructuredTool:
    """Create a set_reminder tool bound to the given DB session."""

    @tool
    async def set_reminder(patient_id: str, reminder_type: str, scheduled_date: str) -> str:
        """Schedule a follow-up reminder for the patient."""
        return (
            f"Reminder scheduled for patient {patient_id}: "
            f"{reminder_type} on {scheduled_date}"
        )

    return set_reminder
