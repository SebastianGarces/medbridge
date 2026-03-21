from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.api.dependencies import require_clinician
from ai_health_coach.database import get_session
from ai_health_coach.models.patient import Patient, Alert, Message, PhaseTransition
from ai_health_coach.models.enums import Phase

router = APIRouter()


@router.get("/clinician/dashboard")
async def dashboard(
    request: Request,
    clinician: dict = Depends(require_clinician),
    session: AsyncSession = Depends(get_session),
):
    q = request.query_params.get("q", "")

    stmt = select(Patient)
    if q:
        stmt = stmt.where(Patient.name.ilike(f"%{q}%"))
    stmt = stmt.order_by(Patient.name)
    patients = (await session.execute(stmt)).scalars().all()

    # Compute stats
    all_patients_stmt = select(Patient)
    all_patients = (await session.execute(all_patients_stmt)).scalars().all()

    active = sum(1 for p in all_patients if p.phase == Phase.ACTIVE)
    dormant = sum(1 for p in all_patients if p.phase == Phase.DORMANT)

    alerts_stmt = select(func.count(Alert.id)).where(Alert.acknowledged == False)
    pending_alerts = (await session.execute(alerts_stmt)).scalar() or 0

    stats = {
        "active": active,
        "avg_adherence": 72,
        "pending_alerts": pending_alerts,
        "dormant": dormant,
    }

    templates = request.app.state.templates
    return templates.TemplateResponse("clinician/dashboard.html", {
        "request": request,
        "patients": patients,
        "stats": stats,
        "q": q,
        "active_page": "dashboard",
        "alert_count": pending_alerts,
    })


@router.get("/clinician/patients/{patient_id}")
async def patient_detail(
    request: Request,
    patient_id: str,
    clinician: dict = Depends(require_clinician),
    session: AsyncSession = Depends(get_session),
):
    patient = await session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Load messages
    msg_stmt = (
        select(Message)
        .where(Message.patient_id == patient_id)
        .order_by(Message.created_at)
    )
    messages = (await session.execute(msg_stmt)).scalars().all()

    # Load phase transitions
    trans_stmt = (
        select(PhaseTransition)
        .where(PhaseTransition.patient_id == patient_id)
        .order_by(PhaseTransition.created_at.desc())
    )
    transitions = (await session.execute(trans_stmt)).scalars().all()

    # Count pending alerts for sidebar badge
    alerts_stmt = select(func.count(Alert.id)).where(Alert.acknowledged == False)
    alert_count = (await session.execute(alerts_stmt)).scalar() or 0

    templates = request.app.state.templates
    return templates.TemplateResponse("clinician/patient_detail.html", {
        "request": request,
        "patient": patient,
        "messages": messages,
        "transitions": transitions,
        "active_page": "patients",
        "alert_count": alert_count,
    })


@router.get("/clinician/alerts")
async def alerts_page(
    request: Request,
    clinician: dict = Depends(require_clinician),
    session: AsyncSession = Depends(get_session),
):
    severity_filter = request.query_params.get("severity")

    stmt = select(Alert).order_by(Alert.created_at.desc())
    if severity_filter:
        stmt = stmt.where(Alert.severity == severity_filter)
    alerts = (await session.execute(stmt)).scalars().all()

    # Load patient for each alert
    for alert in alerts:
        await session.refresh(alert, ["patient"])

    # Count unacknowledged for sidebar badge
    count_stmt = select(func.count(Alert.id)).where(Alert.acknowledged == False)
    alert_count = (await session.execute(count_stmt)).scalar() or 0

    templates = request.app.state.templates
    return templates.TemplateResponse("clinician/alerts.html", {
        "request": request,
        "alerts": alerts,
        "severity_filter": severity_filter,
        "active_page": "alerts",
        "alert_count": alert_count,
    })


@router.post("/clinician/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    clinician: dict = Depends(require_clinician),
    session: AsyncSession = Depends(get_session),
):
    alert = await session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acknowledged = True
    await session.commit()
    return HTMLResponse(content='<span class="text-xs text-[#AAAAAA]">Acknowledged</span>')


@router.get("/api/health")
async def health_check():
    return JSONResponse({"status": "ok"})
