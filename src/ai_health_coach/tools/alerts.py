import uuid

from langchain_core.tools import tool, StructuredTool
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.models.patient import Alert


def make_alert_clinician(session: AsyncSession) -> StructuredTool:
    """Create an alert_clinician tool bound to the given DB session."""

    @tool
    async def alert_clinician(patient_id: str, severity: str, reason: str) -> str:
        """Send an alert to the patient's clinician."""
        alert = Alert(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            severity=severity,
            title=f"Alert: {reason[:50]}",
            description=reason,
        )
        session.add(alert)
        await session.commit()
        return f"Alert created for patient {patient_id} with severity {severity}"

    return alert_clinician
