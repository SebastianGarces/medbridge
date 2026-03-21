import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from ai_health_coach.scheduler.followup import (
    schedule_followups,
    cancel_patient_jobs,
    get_scheduler,
)


def test_schedule_creates_three_jobs():
    scheduler = get_scheduler()
    scheduler.start()

    now = datetime.utcnow()
    schedule_followups("p1", now, scheduler)

    jobs = scheduler.get_jobs()
    patient_jobs = [j for j in jobs if "p1" in j.id]
    assert len(patient_jobs) == 3

    scheduler.shutdown(wait=False)


def test_cancel_patient_jobs_removes_all():
    scheduler = get_scheduler()
    scheduler.start()

    now = datetime.utcnow()
    schedule_followups("p2", now, scheduler)

    jobs_before = [j for j in scheduler.get_jobs() if "p2" in j.id]
    assert len(jobs_before) == 3

    cancel_patient_jobs("p2", scheduler)

    jobs_after = [j for j in scheduler.get_jobs() if "p2" in j.id]
    assert len(jobs_after) == 0

    scheduler.shutdown(wait=False)
