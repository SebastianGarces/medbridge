from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.memory import MemoryJobStore


def get_scheduler() -> BackgroundScheduler:
    """Create and return an APScheduler instance."""
    scheduler = BackgroundScheduler(
        jobstores={"default": MemoryJobStore()},
    )
    return scheduler


def get_backoff_delay(unanswered_count: int) -> int:
    """Return delay in days based on unanswered count."""
    return unanswered_count + 1


def should_go_dormant(unanswered_count: int) -> bool:
    """Check if patient should transition to DORMANT."""
    return unanswered_count >= 3


def _checkin_callback(patient_id: str, interaction_type: str):
    """Placeholder callback for scheduled check-ins."""
    pass


def schedule_followups(
    patient_id: str,
    goal_confirmed_at: datetime,
    scheduler: BackgroundScheduler,
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


def cancel_patient_jobs(patient_id: str, scheduler: BackgroundScheduler) -> None:
    """Remove all scheduled jobs for a patient."""
    for job in scheduler.get_jobs():
        if patient_id in job.id:
            job.remove()
