from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.config import get_settings
from ai_health_coach.database import get_session
from ai_health_coach.models.patient import Patient

router = APIRouter(prefix="/api/auth", tags=["auth"])

DEMO_PATIENTS = [
    {"id": "patient-1", "name": "Sarah Johnson", "email": "sarah@example.com"},
    {"id": "patient-2", "name": "Michael Chen", "email": "michael@example.com"},
]

DEMO_CLINICIANS = [
    {"id": "clinician-1", "name": "Dr. Emily Rodriguez"},
]


class LoginRequest(BaseModel):
    user_id: str
    user_type: str = "patient"


def create_jwt_token(user_id: str, user_type: str) -> str:
    settings = get_settings()
    payload = {
        "user_id": user_id,
        "user_type": user_type,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_jwt_token(token: str) -> dict:
    settings = get_settings()
    return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])


def _extract_token(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    token = request.query_params.get("token")
    if token:
        return token
    return None


async def seed_demo_users(session: AsyncSession) -> None:
    """Seed demo patients, exercise programs, and sample sessions."""
    from ai_health_coach.models.patient import AssignedExercise, ExerciseSession
    from ai_health_coach.exercises.video_library import get_all as get_all_videos

    for patient_data in DEMO_PATIENTS:
        existing = await session.get(Patient, patient_data["id"])
        if not existing:
            patient = Patient(
                id=patient_data["id"],
                name=patient_data["name"],
                email=patient_data["email"],
            )
            session.add(patient)
    await session.commit()

    # Seed exercise programs from real MedBridge video library
    all_videos = get_all_videos()
    assignments = {
        "patient-1": [v for v in all_videos if v.get("category1") == "Orthopedics"][:4],
        "patient-2": [v for v in all_videos if v.get("category1") == "Neurology"][:4],
    }

    for pid, exercises in assignments.items():
        for ex in exercises:
            exists = (await session.execute(
                select(AssignedExercise).where(
                    AssignedExercise.patient_id == pid,
                    AssignedExercise.exercise_name == ex["name"],
                )
            )).scalar_one_or_none()
            if not exists:
                session.add(AssignedExercise(
                    patient_id=pid,
                    exercise_name=ex["name"],
                    exercise_token=ex.get("token"),
                    sets=3,
                    reps=10,
                ))
    await session.commit()

    # Seed sample exercise sessions for patient-1 (12 sessions over past 15 days)
    p1_exercises = (await session.execute(
        select(AssignedExercise).where(AssignedExercise.patient_id == "patient-1")
    )).scalars().all()
    existing_sessions = (await session.execute(
        select(ExerciseSession).where(ExerciseSession.patient_id == "patient-1")
    )).scalars().all()

    if p1_exercises and not existing_sessions:
        now = datetime.utcnow()
        for days_ago in [1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14]:
            ex = p1_exercises[days_ago % len(p1_exercises)]
            session.add(ExerciseSession(
                exercise_id=ex.id,
                patient_id="patient-1",
                completed_at=now - timedelta(days=days_ago, hours=10),
            ))
        await session.commit()


async def get_current_patient(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> Patient | None:
    """Read patient from JWT token."""
    token = _extract_token(request)
    if not token:
        return None
    try:
        data = decode_jwt_token(token)
        if data.get("user_type") != "patient":
            return None
        patient_id = data.get("user_id")
        if not patient_id:
            return None
        return await session.get(Patient, patient_id)
    except jwt.PyJWTError:
        return None


async def get_current_clinician(request: Request) -> dict | None:
    """Read clinician from JWT token."""
    token = _extract_token(request)
    if not token:
        return None
    try:
        data = decode_jwt_token(token)
        if data.get("user_type") != "clinician":
            return None
        clinician_id = data.get("user_id")
        for c in DEMO_CLINICIANS:
            if c["id"] == clinician_id:
                return c
        return None
    except jwt.PyJWTError:
        return None


@router.get("/demo-users")
async def demo_users():
    """Return available demo users for login page."""
    return {"patients": DEMO_PATIENTS, "clinicians": DEMO_CLINICIANS}


@router.post("/login")
async def login(
    body: LoginRequest,
    session: AsyncSession = Depends(get_session),
):
    """Authenticate and return JWT token."""
    if body.user_type == "patient":
        patient = await session.get(Patient, body.user_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        token = create_jwt_token(body.user_id, body.user_type)
        return {
            "token": token,
            "user": {
                "id": patient.id,
                "name": patient.name,
                "type": "patient",
                "email": patient.email,
                "phase": patient.phase,
                "consent_given": patient.consent_given,
            },
        }
    elif body.user_type == "clinician":
        clinician = next((c for c in DEMO_CLINICIANS if c["id"] == body.user_id), None)
        if not clinician:
            raise HTTPException(status_code=404, detail="Clinician not found")
        token = create_jwt_token(body.user_id, body.user_type)
        return {
            "token": token,
            "user": {
                "id": clinician["id"],
                "name": clinician["name"],
                "type": "clinician",
            },
        }
    raise HTTPException(status_code=400, detail="Invalid user_type")


@router.get("/me")
async def auth_me(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """Return current user info."""
    patient = await get_current_patient(request, session)
    if patient:
        return {
            "id": patient.id,
            "name": patient.name,
            "type": "patient",
            "email": patient.email,
            "phase": patient.phase,
            "consent_given": patient.consent_given,
        }

    clinician = await get_current_clinician(request)
    if clinician:
        return {"id": clinician["id"], "name": clinician["name"], "type": "clinician"}

    raise HTTPException(status_code=401, detail="Not authenticated")


@router.post("/logout")
async def logout():
    """Logout (client should discard token)."""
    return {"ok": True}
