from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore

from sqlalchemy import select


_llm_factory = None
_scheduler_ref = None


def configure_callback(llm_factory):
    """Set the LLM factory for scheduler callbacks. Called during app startup."""
    global _llm_factory
    _llm_factory = llm_factory


def set_scheduler_ref(scheduler):
    """Store a module-level reference to the scheduler for use in callbacks."""
    global _scheduler_ref
    _scheduler_ref = scheduler


def get_scheduler() -> AsyncIOScheduler:
    """Create and return an APScheduler instance with persistent job store."""
    from ai_health_coach.config import get_settings
    settings = get_settings()
    # APScheduler's SQLAlchemyJobStore uses synchronous SQLAlchemy
    sync_url = settings.DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")
    scheduler = AsyncIOScheduler(
        jobstores={"default": SQLAlchemyJobStore(url=sync_url)},
    )
    return scheduler


def get_backoff_delay(unanswered_count: int) -> int:
    """Return delay in days using exponential backoff."""
    return 2 ** unanswered_count


def should_go_dormant(unanswered_count: int) -> bool:
    """Check if patient should transition to DORMANT."""
    return unanswered_count >= 3


async def _checkin_callback(patient_id: str, interaction_type: str):
    """Async callback for scheduled check-ins."""
    if _llm_factory is None:
        return

    from ai_health_coach.graph.router import run_followup
    from ai_health_coach.database import get_session_factory

    llm = _llm_factory()
    session_factory = get_session_factory()
    async with session_factory() as session:
        await run_followup(
            patient_id, interaction_type, session, llm, scheduler=_scheduler_ref
        )


def schedule_followups(
    patient_id: str,
    goal_confirmed_at: datetime,
    scheduler: AsyncIOScheduler,
) -> None:
    """Schedule 3 follow-up jobs: Day 2 check_in, Day 5 nudge, Day 7 celebration."""
    schedule = [
        (2, "check_in"),
        (5, "nudge"),
        (7, "celebration"),
    ]

    for day, interaction_type in schedule:
        run_date = goal_confirmed_at + timedelta(days=day)
        scheduler.add_job(
            _checkin_callback,
            trigger="date",
            run_date=run_date,
            args=[patient_id, interaction_type],
            id=f"checkin-{patient_id}-day{day}",
            replace_existing=True,
        )


def schedule_backoff_checkin(
    patient_id: str,
    unanswered_count: int,
    scheduler: AsyncIOScheduler,
) -> None:
    """Schedule next re-engagement check-in with exponential backoff."""
    delay_days = get_backoff_delay(unanswered_count)
    run_date = datetime.utcnow() + timedelta(days=delay_days)
    scheduler.add_job(
        _checkin_callback,
        trigger="date",
        run_date=run_date,
        args=[patient_id, "re_engagement"],
        id=f"backoff-{patient_id}-attempt{unanswered_count}",
        replace_existing=True,
    )


def schedule_onboarding_nudge(
    patient_id: str,
    onboarding_started_at: datetime,
    scheduler: AsyncIOScheduler,
) -> None:
    """Schedule a gentle nudge if patient hasn't set a goal after 2 days."""
    nudge_date = onboarding_started_at + timedelta(days=2)
    scheduler.add_job(
        _checkin_callback,
        trigger="date",
        run_date=nudge_date,
        args=[patient_id, "onboarding_nudge"],
        id=f"onboarding-nudge-{patient_id}",
        replace_existing=True,
    )


async def fire_pending_reminders():
    """Poll for unfired reminders past their scheduled date and fire them."""
    from ai_health_coach.database import get_session_factory
    from ai_health_coach.models.patient import Reminder

    session_factory = get_session_factory()
    async with session_factory() as session:
        stmt = select(Reminder).where(
            Reminder.fired == False,
            Reminder.scheduled_date <= datetime.utcnow(),
        )
        reminders = (await session.execute(stmt)).scalars().all()
        for r in reminders:
            await _checkin_callback(r.patient_id, r.reminder_type)
            r.fired = True
        await session.commit()


def cancel_patient_jobs(patient_id: str, scheduler: AsyncIOScheduler) -> None:
    """Remove all scheduled jobs for a patient."""
    for job in scheduler.get_jobs():
        if patient_id in job.id:
            job.remove()
