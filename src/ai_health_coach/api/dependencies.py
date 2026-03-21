from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.database import get_session
from ai_health_coach.api.auth import get_current_patient, get_current_clinician
from ai_health_coach.models.patient import Patient


async def require_patient(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> Patient:
    """Require authenticated patient or raise 401."""
    patient = await get_current_patient(request, session)
    if not patient:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return patient


async def require_patient_with_consent(
    patient: Patient = Depends(require_patient),
) -> Patient:
    """Require authenticated and consented patient, or redirect to /consent."""
    if not patient.consent_given:
        raise HTTPException(status_code=303, headers={"Location": "/consent"})
    return patient


async def require_clinician(request: Request) -> dict:
    """Require authenticated clinician or raise 401."""
    clinician = await get_current_clinician(request)
    if not clinician:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return clinician
