import asyncio
import json
from datetime import datetime

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.api.auth import get_current_patient
from ai_health_coach.database import get_session, get_session_factory
from ai_health_coach.models.enums import MessageRole
from ai_health_coach.models.patient import Message, Patient
from ai_health_coach.exercises.video_library import extract_tokens, get_by_token, strip_markers

router = APIRouter(prefix="/api/patient", tags=["patient-sse"])


def _serialize_message(msg) -> dict:
    """Serialize a single message for SSE."""
    import markdown as md
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
        cleaned = strip_markers(msg.content)
        content_html = md.markdown(cleaned, extensions=["nl2br"])
    elif msg.content:
        import markdown as md
        content_html = md.markdown(msg.content, extensions=["nl2br"])

    return {
        "id": msg.id,
        "role": msg.role,
        "content": msg.content or "",
        "content_html": content_html,
        "created_at": msg.created_at.isoformat(),
        "exercise_videos": exercise_videos,
    }


@router.get("/chat/stream")
async def chat_stream(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """Server-Sent Events endpoint for real-time chat updates.

    Auth is via query parameter ?token=<jwt> since EventSource API
    does not support custom headers.
    """
    patient = await get_current_patient(request, session)
    if not patient:
        return StreamingResponse(
            iter(["event: error\ndata: {\"error\": \"Not authenticated\"}\n\n"]),
            media_type="text/event-stream",
            status_code=401,
        )

    if not patient.consent_given:
        return StreamingResponse(
            iter(["event: error\ndata: {\"error\": \"Consent required\"}\n\n"]),
            media_type="text/event-stream",
            status_code=403,
        )

    patient_id = patient.id
    factory = get_session_factory()

    async def event_generator():
        last_check = datetime.utcnow()
        while True:
            if await request.is_disconnected():
                break

            async with factory() as poll_session:
                stmt = (
                    select(Message)
                    .where(
                        Message.patient_id == patient_id,
                        Message.created_at > last_check,
                    )
                    .order_by(Message.created_at)
                )
                new_msgs = (await poll_session.execute(stmt)).scalars().all()

                if new_msgs:
                    last_check = new_msgs[-1].created_at
                    for msg in new_msgs:
                        data = json.dumps(_serialize_message(msg))
                        yield f"data: {data}\n\n"

            await asyncio.sleep(2)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
