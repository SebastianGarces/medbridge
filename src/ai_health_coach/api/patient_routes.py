import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.api.dependencies import require_patient, require_patient_with_consent
from ai_health_coach.consent.gate import grant_consent, revoke_consent
from ai_health_coach.config import get_settings
from ai_health_coach.database import get_session
from ai_health_coach.models.enums import MessageRole, Phase
from ai_health_coach.models.patient import Message, Patient
from ai_health_coach.tools.program import get_program_summary
from ai_health_coach.tools.adherence import get_adherence_summary

router = APIRouter()


def _get_llm():
    """Get the configured LLM instance."""
    from langchain_openai import ChatOpenAI
    settings = get_settings()
    return ChatOpenAI(model=settings.MODEL_NAME, api_key=settings.OPENAI_API_KEY)


@router.get("/")
async def root(request: Request, session: AsyncSession = Depends(get_session)):
    from ai_health_coach.api.auth import get_current_patient
    patient = await get_current_patient(request, session)
    if not patient:
        return RedirectResponse(url="/login", status_code=303)
    if not patient.consent_given:
        return RedirectResponse(url="/consent", status_code=303)
    return RedirectResponse(url="/chat", status_code=303)


@router.get("/consent")
async def consent_page(request: Request, session: AsyncSession = Depends(get_session)):
    from ai_health_coach.api.auth import get_current_patient
    patient = await get_current_patient(request, session)
    if not patient:
        return RedirectResponse(url="/login", status_code=303)
    templates = request.app.state.templates
    return templates.TemplateResponse("consent.html", {"request": request, "patient": patient})


@router.post("/consent")
async def consent_submit(request: Request, session: AsyncSession = Depends(get_session)):
    from ai_health_coach.api.auth import get_current_patient
    patient = await get_current_patient(request, session)
    if not patient:
        return RedirectResponse(url="/login", status_code=303)
    form = await request.form()
    consent_value = form.get("consent")
    if consent_value == "true":
        await grant_consent(patient.id, session)
        return RedirectResponse(url="/onboarding", status_code=303)
    else:
        await revoke_consent(patient.id, session)
        return RedirectResponse(url="/", status_code=303)


@router.get("/onboarding")
async def onboarding_page(
    request: Request,
    patient: Patient = Depends(require_patient_with_consent),
    session: AsyncSession = Depends(get_session),
):
    program = json.loads(get_program_summary.invoke({"patient_id": patient.id}))
    templates = request.app.state.templates
    return templates.TemplateResponse("patient/onboarding.html", {
        "request": request,
        "patient": patient,
        "exercises": program["exercises"],
    })


@router.post("/onboarding/goal")
async def submit_goal(
    request: Request,
    patient: Patient = Depends(require_patient_with_consent),
    session: AsyncSession = Depends(get_session),
):
    form = await request.form()
    goal_text = form.get("goal_text", "")
    if not goal_text.strip():
        return RedirectResponse(url="/onboarding", status_code=303)

    # Create goal
    from ai_health_coach.models.patient import Goal
    goal = Goal(id=str(uuid.uuid4()), patient_id=patient.id, goal_text=goal_text.strip())
    session.add(goal)
    patient.phase = Phase.ACTIVE
    await session.commit()

    return RedirectResponse(url="/chat", status_code=303)


@router.get("/chat")
async def chat_page(
    request: Request,
    patient: Patient = Depends(require_patient_with_consent),
    session: AsyncSession = Depends(get_session),
):
    stmt = (
        select(Message)
        .where(Message.patient_id == patient.id)
        .order_by(Message.created_at)
    )
    messages = (await session.execute(stmt)).scalars().all()

    program = json.loads(get_program_summary.invoke({"patient_id": patient.id}))

    await session.refresh(patient)

    templates = request.app.state.templates
    return templates.TemplateResponse("patient/chat.html", {
        "request": request,
        "patient": patient,
        "messages": messages,
        "goal": patient.goal,
        "exercises": program["exercises"],
        "active_page": "chat",
    })


@router.post("/chat/send")
async def chat_send(
    request: Request,
    patient: Patient = Depends(require_patient_with_consent),
    session: AsyncSession = Depends(get_session),
):
    form = await request.form()
    message_text = form.get("message", "").strip()
    if not message_text:
        return RedirectResponse(url="/chat", status_code=303)

    # Invoke the LangGraph agent — run_graph handles saving messages,
    # safety classification, and state persistence
    from ai_health_coach.graph.router import run_graph
    llm = _get_llm()
    await run_graph(patient.id, message_text, session, llm)

    # Return all messages for HTMX swap
    stmt = (
        select(Message)
        .where(Message.patient_id == patient.id)
        .order_by(Message.created_at)
    )
    messages = (await session.execute(stmt)).scalars().all()

    templates = request.app.state.templates
    html = ""
    for msg in messages:
        html += templates.get_template("components/chat_bubble.html").render(
            msg=msg, request=request
        )
    return HTMLResponse(content=html)


@router.get("/chat/messages")
async def chat_messages(
    request: Request,
    patient: Patient = Depends(require_patient_with_consent),
    session: AsyncSession = Depends(get_session),
):
    after = request.query_params.get("after")
    stmt = select(Message).where(Message.patient_id == patient.id)
    if after:
        from datetime import datetime
        try:
            after_dt = datetime.fromisoformat(after)
            stmt = stmt.where(Message.created_at > after_dt)
        except ValueError:
            pass
    stmt = stmt.order_by(Message.created_at)
    messages = (await session.execute(stmt)).scalars().all()

    templates = request.app.state.templates
    html = ""
    for msg in messages:
        html += templates.get_template("components/chat_bubble.html").render(
            msg=msg, request=request
        )
    return HTMLResponse(content=html)


@router.get("/goals")
async def goals_page(
    request: Request,
    patient: Patient = Depends(require_patient_with_consent),
    session: AsyncSession = Depends(get_session),
):
    await session.refresh(patient)
    adherence = json.loads(get_adherence_summary.invoke({"patient_id": patient.id}))

    templates = request.app.state.templates
    return templates.TemplateResponse("patient/goals.html", {
        "request": request,
        "patient": patient,
        "goal": patient.goal,
        "adherence": adherence,
        "active_page": "goals",
    })


@router.get("/settings")
async def settings_page(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    from ai_health_coach.api.auth import get_current_patient
    patient = await get_current_patient(request, session)
    if not patient:
        return RedirectResponse(url="/login", status_code=303)
    templates = request.app.state.templates
    return templates.TemplateResponse("patient/settings.html", {
        "request": request,
        "patient": patient,
        "active_page": "settings",
    })


@router.post("/settings")
async def settings_update(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    from ai_health_coach.api.auth import get_current_patient
    patient = await get_current_patient(request, session)
    if not patient:
        return RedirectResponse(url="/login", status_code=303)

    form = await request.form()
    consent_value = form.get("consent")

    if consent_value == "true" and not patient.consent_given:
        await grant_consent(patient.id, session)
    elif consent_value is None and patient.consent_given:
        await revoke_consent(patient.id, session)

    return RedirectResponse(url="/settings", status_code=303)
