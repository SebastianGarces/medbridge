from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.models.patient import Patient
from ai_health_coach.models.enums import Phase


async def verify_consent(patient_id: str, session: AsyncSession) -> bool:
    """Check if patient has given consent."""
    stmt = select(Patient).where(Patient.id == patient_id)
    patient = (await session.execute(stmt)).scalar_one_or_none()
    if patient is None:
        return False
    return patient.consent_given


async def require_consent(patient: Patient) -> Patient:
    """FastAPI dependency: raises 303 redirect if consent not given."""
    if not patient.consent_given:
        raise HTTPException(status_code=303, headers={"Location": "/consent"})
    return patient


async def grant_consent(patient_id: str, session: AsyncSession) -> None:
    """Grant consent and transition to ONBOARDING."""
    stmt = select(Patient).where(Patient.id == patient_id)
    patient = (await session.execute(stmt)).scalar_one()
    patient.consent_given = True
    patient.consent_given_at = datetime.utcnow()
    patient.phase = Phase.ONBOARDING
    await session.commit()


async def revoke_consent(patient_id: str, session: AsyncSession) -> None:
    """Revoke consent, reset phase to PENDING, preserve history."""
    stmt = select(Patient).where(Patient.id == patient_id)
    patient = (await session.execute(stmt)).scalar_one()
    patient.consent_given = False
    patient.consent_given_at = None
    patient.phase = Phase.PENDING
    await session.commit()
