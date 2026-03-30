import json
from datetime import datetime, timedelta

from langchain_core.tools import tool, StructuredTool
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ai_health_coach.models.patient import AssignedExercise, ExerciseSession


def make_get_adherence_summary(session: AsyncSession) -> StructuredTool:
    """Create a get_adherence_summary tool bound to the given DB session."""

    @tool
    async def get_adherence_summary(patient_id: str) -> str:
        """Get the patient's exercise adherence metrics."""
        total_assigned = (await session.execute(
            select(func.count(AssignedExercise.id))
            .where(AssignedExercise.patient_id == patient_id)
        )).scalar() or 0

        sessions_completed = (await session.execute(
            select(func.count(ExerciseSession.id))
            .where(ExerciseSession.patient_id == patient_id)
        )).scalar() or 0

        # Expected: one session per exercise per day over 14 days
        expected = total_assigned * 14 if total_assigned > 0 else 1
        adherence_pct = min(100, round((sessions_completed / expected) * 100))

        streak = await _compute_streak(session, patient_id)

        metrics = {
            "adherence_pct": adherence_pct,
            "streak": streak,
            "best_streak": max(streak, sessions_completed // max(total_assigned, 1)),
            "sessions_completed": sessions_completed,
            "sessions_total": expected,
        }
        return json.dumps(metrics)

    return get_adherence_summary


async def _compute_streak(session: AsyncSession, patient_id: str) -> int:
    """Count consecutive days of exercise ending at today."""
    today = datetime.utcnow().date()
    stmt = (
        select(func.date(ExerciseSession.completed_at))
        .where(ExerciseSession.patient_id == patient_id)
        .distinct()
        .order_by(func.date(ExerciseSession.completed_at).desc())
    )
    rows = (await session.execute(stmt)).scalars().all()
    streak = 0
    for i, d in enumerate(rows):
        # SQLite returns date strings from func.date()
        if isinstance(d, str):
            from datetime import date as _date
            d = _date.fromisoformat(d)
        expected = today - timedelta(days=i)
        if d == expected:
            streak += 1
        else:
            break
    return streak
