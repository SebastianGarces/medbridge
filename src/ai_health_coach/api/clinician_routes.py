import markdown as md
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.api.dependencies import require_clinician
from ai_health_coach.database import get_session
from ai_health_coach.models.patient import Patient, Alert, Message, PhaseTransition, AssignedExercise, ExerciseSession
from ai_health_coach.models.enums import Phase
from ai_health_coach.models.schemas import (
    AdherenceResponse,
    AlertResponse,
    DashboardResponse,
    DashboardStatsResponse,
    GoalResponse,
    MessageResponse,
    PatientDetailResponse,
    PatientSummary,
    PhaseTransitionResponse,
)
from ai_health_coach.exercises.video_library import extract_tokens, get_by_token, strip_markers


async def _calc_adherence_pct(session: AsyncSession, patient_id: str) -> int:
    """Compute adherence percentage for a single patient."""
    total_assigned = (await session.execute(
        select(func.count(AssignedExercise.id))
        .where(AssignedExercise.patient_id == patient_id)
    )).scalar() or 0
    if total_assigned == 0:
        return 0
    sessions_completed = (await session.execute(
        select(func.count(ExerciseSession.id))
        .where(ExerciseSession.patient_id == patient_id)
    )).scalar() or 0
    expected = total_assigned * 14
    return min(100, round((sessions_completed / expected) * 100))

router = APIRouter(prefix="/api/clinician", tags=["clinician"])


def _render_content_html(text: str) -> str:
    """Convert markdown to HTML, stripping exercise markers."""
    cleaned = strip_markers(text)
    return md.markdown(cleaned, extensions=["nl2br"])


@router.get("/dashboard")
async def dashboard(
    request: Request,
    clinician: dict = Depends(require_clinician),
    session: AsyncSession = Depends(get_session),
):
    """Return dashboard data with patient list and stats."""
    q = request.query_params.get("q", "")

    stmt = select(Patient)
    if q:
        stmt = stmt.where(Patient.name.ilike(f"%{q}%"))
    stmt = stmt.order_by(Patient.name)
    patients = (await session.execute(stmt)).scalars().all()

    # Compute stats
    all_patients = (await session.execute(select(Patient))).scalars().all()
    active = sum(1 for p in all_patients if p.phase == Phase.ACTIVE)
    dormant = sum(1 for p in all_patients if p.phase == Phase.DORMANT)

    alerts_stmt = select(func.count(Alert.id)).where(Alert.acknowledged == False)
    pending_alerts = (await session.execute(alerts_stmt)).scalar() or 0

    total_sessions = (await session.execute(
        select(func.count(ExerciseSession.id))
    )).scalar() or 0
    total_assigned = (await session.execute(
        select(func.count(AssignedExercise.id))
    )).scalar() or 0
    expected = total_assigned * 14 if total_assigned > 0 else 1
    avg_adherence = min(100, round((total_sessions / expected) * 100))

    patient_summaries = []
    for p in patients:
        adh = await _calc_adherence_pct(session, p.id)
        patient_summaries.append(PatientSummary(
            id=p.id,
            name=p.name,
            phase=p.phase,
            consent_given=p.consent_given,
            adherence_pct=adh,
            last_interaction_at=p.last_interaction_at,
        ))

    return DashboardResponse(
        patients=patient_summaries,
        stats=DashboardStatsResponse(
            active=active,
            avg_adherence=avg_adherence,
            pending_alerts=pending_alerts,
            dormant=dormant,
        ),
    )


@router.get("/patients/{patient_id}")
async def patient_detail(
    patient_id: str,
    clinician: dict = Depends(require_clinician),
    session: AsyncSession = Depends(get_session),
):
    """Return patient detail with messages, transitions, and alerts."""
    patient = await session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    msg_stmt = (
        select(Message)
        .where(Message.patient_id == patient_id)
        .order_by(Message.created_at)
    )
    messages = (await session.execute(msg_stmt)).scalars().all()

    trans_stmt = (
        select(PhaseTransition)
        .where(PhaseTransition.patient_id == patient_id)
        .order_by(PhaseTransition.created_at.desc())
    )
    transitions = (await session.execute(trans_stmt)).scalars().all()

    alerts_stmt = select(func.count(Alert.id)).where(Alert.acknowledged == False)
    alert_count = (await session.execute(alerts_stmt)).scalar() or 0

    serialized_messages = []
    for msg in messages:
        content_html = ""
        exercise_videos = []
        if msg.content:
            from ai_health_coach.models.enums import MessageRole
            if msg.role != MessageRole.PATIENT:
                tokens = extract_tokens(msg.content)
                exercise_videos = [
                    {
                        "token": ex.get("token", ""),
                        "name": ex.get("name", ""),
                        "category1": ex.get("category1"),
                        "category2": ex.get("category2"),
                        "thumbnail1": ex.get("thumbnail1"),
                        "description": ex.get("description"),
                    }
                    for t in tokens
                    if (ex := get_by_token(t)) is not None
                ]
                content_html = _render_content_html(msg.content)
            else:
                content_html = md.markdown(msg.content, extensions=["nl2br"])

        serialized_messages.append(MessageResponse(
            id=msg.id,
            role=msg.role,
            content=msg.content or "",
            content_html=content_html,
            created_at=msg.created_at,
            exercise_videos=exercise_videos,
        ))

    serialized_transitions = [
        PhaseTransitionResponse(
            id=t.id,
            from_phase=t.from_phase,
            to_phase=t.to_phase,
            reason=t.reason,
            created_at=t.created_at,
        )
        for t in transitions
    ]

    adh_pct = await _calc_adherence_pct(session, patient_id)

    # Build full adherence response
    from ai_health_coach.tools.adherence import _compute_streak
    total_assigned = (await session.execute(
        select(func.count(AssignedExercise.id))
        .where(AssignedExercise.patient_id == patient_id)
    )).scalar() or 0
    sessions_completed = (await session.execute(
        select(func.count(ExerciseSession.id))
        .where(ExerciseSession.patient_id == patient_id)
    )).scalar() or 0
    streak = await _compute_streak(session, patient_id)
    expected = total_assigned * 14 if total_assigned > 0 else 0

    adherence_resp = AdherenceResponse(
        adherence_pct=adh_pct,
        streak=streak,
        best_streak=max(streak, sessions_completed // max(total_assigned, 1)) if total_assigned else 0,
        sessions_completed=sessions_completed,
        sessions_total=expected,
    )

    # Goal
    goal_resp = None
    if patient.goal:
        goal_resp = GoalResponse(
            id=patient.goal.id,
            goal_text=patient.goal.goal_text,
            target_date=patient.goal.target_date,
            progress_pct=patient.goal.progress_pct,
            created_at=patient.goal.created_at,
        )

    return PatientDetailResponse(
        patient=PatientSummary(
            id=patient.id,
            name=patient.name,
            phase=patient.phase,
            consent_given=patient.consent_given,
            adherence_pct=adh_pct,
            last_interaction_at=patient.last_interaction_at,
        ),
        messages=serialized_messages,
        transitions=serialized_transitions,
        alert_count=alert_count,
        goal=goal_resp,
        adherence=adherence_resp,
    )


@router.get("/alerts")
async def alerts_page(
    request: Request,
    clinician: dict = Depends(require_clinician),
    session: AsyncSession = Depends(get_session),
):
    """Return alerts list."""
    severity_filter = request.query_params.get("severity")

    stmt = select(Alert).order_by(Alert.created_at.desc())
    if severity_filter:
        stmt = stmt.where(Alert.severity == severity_filter)
    alerts = (await session.execute(stmt)).scalars().all()

    # Load patient names
    for alert in alerts:
        await session.refresh(alert, ["patient"])

    count_stmt = select(func.count(Alert.id)).where(Alert.acknowledged == False)
    alert_count = (await session.execute(count_stmt)).scalar() or 0

    alert_responses = [
        AlertResponse(
            id=a.id,
            patient_id=a.patient_id,
            severity=a.severity,
            title=a.title,
            description=a.description,
            acknowledged=a.acknowledged,
            created_at=a.created_at,
            patient_name=a.patient.name if a.patient else None,
        )
        for a in alerts
    ]

    return {"alerts": alert_responses, "alert_count": alert_count}


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    clinician: dict = Depends(require_clinician),
    session: AsyncSession = Depends(get_session),
):
    """Acknowledge an alert."""
    alert = await session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acknowledged = True
    await session.commit()
    return {"success": True}


@router.get("/health")
async def health_check():
    return JSONResponse({"status": "ok"})
