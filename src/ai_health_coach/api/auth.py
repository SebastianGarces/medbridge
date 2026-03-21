from fastapi import APIRouter, Request, Response, Depends, HTTPException
from fastapi.responses import RedirectResponse
from itsdangerous import URLSafeSerializer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.config import get_settings
from ai_health_coach.database import get_session
from ai_health_coach.models.patient import Patient

router = APIRouter()

DEMO_PATIENTS = [
    {"id": "patient-1", "name": "Sarah Johnson", "email": "sarah@example.com"},
    {"id": "patient-2", "name": "Michael Chen", "email": "michael@example.com"},
]

DEMO_CLINICIANS = [
    {"id": "clinician-1", "name": "Dr. Emily Rodriguez"},
]


def get_serializer() -> URLSafeSerializer:
    settings = get_settings()
    return URLSafeSerializer(settings.SECRET_KEY)


async def seed_demo_users(session: AsyncSession) -> None:
    """Seed demo patients and clinician if they don't exist."""
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


async def get_current_patient(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> Patient | None:
    """Read patient_id from session cookie, load from DB."""
    cookie = request.cookies.get("session")
    if not cookie:
        return None
    try:
        s = get_serializer()
        data = s.loads(cookie)
        if data.get("user_type") != "patient":
            return None
        patient_id = data.get("user_id")
        if not patient_id:
            return None
        patient = await session.get(Patient, patient_id)
        return patient
    except Exception:
        return None


async def get_current_clinician(request: Request) -> dict | None:
    """Read clinician_id from session cookie."""
    cookie = request.cookies.get("session")
    if not cookie:
        return None
    try:
        s = get_serializer()
        data = s.loads(cookie)
        if data.get("user_type") != "clinician":
            return None
        clinician_id = data.get("user_id")
        for c in DEMO_CLINICIANS:
            if c["id"] == clinician_id:
                return c
        return None
    except Exception:
        return None


@router.post("/login")
async def login(request: Request) -> Response:
    """Set session cookie for selected demo user."""
    form = await request.form()
    user_id = form.get("user_id")
    user_type = form.get("user_type", "patient")

    s = get_serializer()
    cookie_value = s.dumps({"user_id": user_id, "user_type": user_type})

    response = RedirectResponse(url="/", status_code=303)
    response.set_cookie(
        key="session",
        value=cookie_value,
        httponly=True,
        samesite="lax",
    )
    return response


@router.get("/auth/me")
async def auth_me(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """Return current user info (for testing)."""
    patient = await get_current_patient(request, session)
    if patient:
        return {"id": patient.id, "name": patient.name, "type": "patient"}

    clinician = await get_current_clinician(request)
    if clinician:
        return {"id": clinician["id"], "name": clinician["name"], "type": "clinician"}

    raise HTTPException(status_code=401, detail="Not authenticated")


@router.get("/login")
async def login_page(request: Request):
    """Render login page."""
    templates = request.app.state.templates
    return templates.TemplateResponse("login.html", {
        "request": request,
        "patients": DEMO_PATIENTS,
        "clinicians": DEMO_CLINICIANS,
    })


@router.post("/logout")
async def logout() -> Response:
    """Clear session cookie."""
    response = RedirectResponse(url="/login", status_code=303)
    response.delete_cookie("session")
    return response
