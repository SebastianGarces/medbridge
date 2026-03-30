import json
from datetime import datetime

import markdown as md
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.api.dependencies import require_patient, require_patient_with_consent
from ai_health_coach.consent.gate import grant_consent, revoke_consent
from ai_health_coach.config import get_settings
from ai_health_coach.database import get_session
from ai_health_coach.models.enums import MessageRole, Phase
from ai_health_coach.models.patient import Message, Patient
from ai_health_coach.models.schemas import (
    AdherenceResponse,
    ConsentRequest,
    ExerciseVideo,
    ExercisesPageResponse,
    GoalResponse,
    GoalsPageResponse,
    GoalSubmitRequest,
    MessageResponse,
    PatientStatusResponse,
    ProgramExercise,
    SendMessageRequest,
    WeekDay,
)
from ai_health_coach.tools.program import make_get_program_summary
from ai_health_coach.tools.adherence import make_get_adherence_summary
from ai_health_coach.exercises.video_library import (
    extract_tokens, get_by_token, get_all as get_all_videos, strip_markers,
)

router = APIRouter(prefix="/api/patient", tags=["patient"])


def _render_content_html(text: str) -> str:
    """Convert markdown to HTML, stripping exercise markers."""
    cleaned = strip_markers(text)
    return md.markdown(cleaned, extensions=["nl2br"])


def _serialize_messages(messages) -> list[dict]:
    """Convert DB messages to serializable dicts with content_html and exercise_videos."""
    result = []
    for msg in messages:
        exercise_videos = []
        content_html = ""
        if msg.role != MessageRole.PATIENT and msg.content:
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
        elif msg.content:
            content_html = md.markdown(msg.content, extensions=["nl2br"])

        result.append({
            "id": msg.id,
            "role": msg.role,
            "content": msg.content or "",
            "content_html": content_html,
            "created_at": msg.created_at.isoformat(),
            "exercise_videos": exercise_videos,
        })
    return result


def _get_llm():
    """Get the configured LLM instance (via OpenRouter)."""
    from langchain_openai import ChatOpenAI
    settings = get_settings()
    return ChatOpenAI(
        model=settings.MODEL_NAME,
        api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL,
        default_headers={
            "HTTP-Referer": settings.APP_URL,
            "X-Title": settings.APP_TITLE,
        },
    )


@router.get("/status")
async def patient_status(
    patient: Patient = Depends(require_patient),
):
    """Return patient status for frontend routing."""
    return PatientStatusResponse(
        phase=patient.phase,
        consent_given=patient.consent_given,
        has_goal=patient.goal is not None,
    )


@router.get("/consent")
async def consent_get(
    patient: Patient = Depends(require_patient),
):
    """Return consent status."""
    return {
        "consent_given": patient.consent_given,
        "consent_given_at": patient.consent_given_at.isoformat() if patient.consent_given_at else None,
    }


@router.post("/consent")
async def consent_submit(
    body: ConsentRequest,
    request: Request,
    patient: Patient = Depends(require_patient),
    session: AsyncSession = Depends(get_session),
):
    """Submit consent decision."""
    if body.consent:
        await grant_consent(patient.id, session)
    else:
        scheduler = getattr(request.app.state, "scheduler", None)
        await revoke_consent(patient.id, session, scheduler=scheduler)

    await session.refresh(patient)
    return {"consent_given": patient.consent_given, "phase": patient.phase}


@router.get("/onboarding")
async def onboarding_data(
    patient: Patient = Depends(require_patient_with_consent),
    session: AsyncSession = Depends(get_session),
):
    """Return onboarding data (exercises and step)."""
    program_tool = make_get_program_summary(session)
    program = json.loads(await program_tool.ainvoke({"patient_id": patient.id}))
    return {"exercises": program["exercises"], "step": 1 if not patient.goal else 2}


@router.post("/onboarding/goal")
async def onboarding_goal(
    body: GoalSubmitRequest,
    patient: Patient = Depends(require_patient_with_consent),
    session: AsyncSession = Depends(get_session),
):
    """Submit onboarding goal."""
    from ai_health_coach.models.patient import Goal
    goal = patient.goal
    if goal:
        goal.goal_text = body.goal_text
    else:
        session.add(Goal(patient_id=patient.id, goal_text=body.goal_text))

    if patient.phase == Phase.ONBOARDING:
        patient.phase = Phase.ACTIVE
    await session.commit()
    return {"success": True}


@router.get("/chat/messages")
async def chat_messages(
    request: Request,
    patient: Patient = Depends(require_patient_with_consent),
    session: AsyncSession = Depends(get_session),
):
    """Get chat messages, optionally filtered by timestamp."""
    after = request.query_params.get("after")
    stmt = select(Message).where(Message.patient_id == patient.id)
    if after:
        try:
            after_dt = datetime.fromisoformat(after)
            stmt = stmt.where(Message.created_at > after_dt)
        except ValueError:
            pass
    stmt = stmt.order_by(Message.created_at)
    messages = (await session.execute(stmt)).scalars().all()

    # Auto-generate welcome for new onboarding patients
    if not after and patient.phase == Phase.ONBOARDING and len(messages) == 0:
        from ai_health_coach.graph.router import run_graph_welcome
        llm = _get_llm()
        await run_graph_welcome(patient.id, session, llm)
        messages = (await session.execute(stmt)).scalars().all()

    return {"messages": _serialize_messages(messages)}


@router.post("/chat/send")
async def chat_send(
    body: SendMessageRequest,
    request: Request,
    patient: Patient = Depends(require_patient_with_consent),
    session: AsyncSession = Depends(get_session),
):
    """Send a message and get the coach response."""
    from ai_health_coach.graph.router import run_graph
    llm = _get_llm()
    scheduler = getattr(request.app.state, "scheduler", None)
    await run_graph(patient.id, body.message, session, llm, scheduler=scheduler)

    # Return all messages
    stmt = (
        select(Message)
        .where(Message.patient_id == patient.id)
        .order_by(Message.created_at)
    )
    messages = (await session.execute(stmt)).scalars().all()
    return {"messages": _serialize_messages(messages)}


@router.get("/goals")
async def goals_page(
    patient: Patient = Depends(require_patient_with_consent),
    session: AsyncSession = Depends(get_session),
):
    """Return goals and adherence data."""
    from datetime import timedelta
    from ai_health_coach.models.patient import ExerciseSession

    await session.refresh(patient)
    adherence_tool = make_get_adherence_summary(session)
    adherence_raw = json.loads(await adherence_tool.ainvoke({"patient_id": patient.id}))

    # Update goal progress from real adherence data
    if patient.goal:
        patient.goal.progress_pct = adherence_raw.get("adherence_pct", 0)
        await session.commit()

    # Build weekly activity data
    today = datetime.utcnow().date()
    monday = today - timedelta(days=today.weekday())
    completed_dates_stmt = (
        select(func.date(ExerciseSession.completed_at))
        .where(
            ExerciseSession.patient_id == patient.id,
            func.date(ExerciseSession.completed_at) >= monday,
        )
        .distinct()
    )
    completed_dates = set(
        (await session.execute(completed_dates_stmt)).scalars().all()
    )
    day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    week_days = []
    for i, label in enumerate(day_labels):
        d = monday + timedelta(days=i)
        week_days.append(WeekDay(
            label=label,
            completed=d in completed_dates,
            is_today=d == today,
            is_future=d > today,
        ))

    goal_resp = None
    if patient.goal:
        goal_resp = GoalResponse(
            id=patient.goal.id,
            goal_text=patient.goal.goal_text,
            target_date=patient.goal.target_date,
            progress_pct=patient.goal.progress_pct,
            created_at=patient.goal.created_at,
        )

    return GoalsPageResponse(
        goal=goal_resp,
        adherence=AdherenceResponse(**adherence_raw),
        week_days=week_days,
    )


@router.get("/exercises")
async def exercises_page(
    patient: Patient = Depends(require_patient_with_consent),
    session: AsyncSession = Depends(get_session),
):
    """Return exercises data."""
    from ai_health_coach.models.patient import AssignedExercise, ExerciseSession

    assigned = (await session.execute(
        select(AssignedExercise).where(AssignedExercise.patient_id == patient.id)
    )).scalars().all()

    today = datetime.utcnow().date()
    today_sessions = (await session.execute(
        select(ExerciseSession.exercise_id).where(
            ExerciseSession.patient_id == patient.id,
            func.date(ExerciseSession.completed_at) == today,
        )
    )).scalars().all()
    completed_today = set(today_sessions)

    program_videos = []
    for ex in assigned:
        video = get_by_token(ex.exercise_token) if ex.exercise_token else None
        program_videos.append(ProgramExercise(
            exercise_id=ex.id,
            name=ex.exercise_name,
            sets=ex.sets,
            reps=ex.reps,
            token=ex.exercise_token,
            category1=video.get("category1", "") if video else "",
            category2=video.get("category2", "") if video else "",
            thumbnail1=video.get("thumbnail1", "") if video else "",
            description=video.get("description", "") if video else "",
            video_embed_url=video.get("videoEmbedUrl", "") if video else "",
            completed_today=ex.id in completed_today,
        ))

    all_videos_raw = get_all_videos()
    categories = sorted(set(v["category1"] for v in all_videos_raw if v.get("category1")))

    all_videos = [
        ExerciseVideo(
            token=v.get("token", ""),
            name=v.get("name", ""),
            category1=v.get("category1"),
            category2=v.get("category2"),
            thumbnail1=v.get("thumbnail1"),
            description=v.get("description"),
            video_embed_url=v.get("videoEmbedUrl"),
        )
        for v in all_videos_raw
    ]

    return ExercisesPageResponse(
        program_videos=program_videos,
        all_videos=all_videos,
        categories=categories,
    )


@router.post("/exercises/{exercise_id}/complete")
async def complete_exercise(
    exercise_id: str,
    patient: Patient = Depends(require_patient_with_consent),
    session: AsyncSession = Depends(get_session),
):
    """Mark an exercise as completed today."""
    from ai_health_coach.models.patient import AssignedExercise, ExerciseSession

    exercise = await session.get(AssignedExercise, exercise_id)
    if not exercise or exercise.patient_id != patient.id:
        raise HTTPException(status_code=404, detail="Exercise not found")

    session.add(ExerciseSession(
        patient_id=patient.id,
        exercise_id=exercise_id,
    ))
    await session.commit()

    return {"success": True, "completed_at": datetime.utcnow().isoformat()}


@router.get("/settings")
async def settings_get(
    patient: Patient = Depends(require_patient),
):
    """Return patient settings."""
    return {
        "consent_given": patient.consent_given,
    }


@router.post("/settings")
async def settings_update(
    body: ConsentRequest,
    request: Request,
    patient: Patient = Depends(require_patient),
    session: AsyncSession = Depends(get_session),
):
    """Update patient settings."""
    if body.consent and not patient.consent_given:
        await grant_consent(patient.id, session)
    elif not body.consent and patient.consent_given:
        scheduler = getattr(request.app.state, "scheduler", None)
        await revoke_consent(patient.id, session, scheduler=scheduler)

    return {"success": True}
