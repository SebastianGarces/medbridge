import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from ai_health_coach.scheduler.followup import (
    schedule_followups,
    cancel_patient_jobs,
    get_scheduler,
    configure_callback,
    _checkin_callback,
)


@pytest.fixture
async def event_loop_scheduler():
    """Create an AsyncIOScheduler for testing (must be used within async context)."""
    scheduler = get_scheduler()
    scheduler.start()
    yield scheduler
    scheduler.shutdown(wait=False)


@pytest.mark.asyncio
async def test_schedule_creates_three_jobs(event_loop_scheduler):
    scheduler = event_loop_scheduler
    now = datetime.utcnow()
    schedule_followups("p1", now, scheduler)

    jobs = scheduler.get_jobs()
    patient_jobs = [j for j in jobs if "p1" in j.id]
    assert len(patient_jobs) == 3


@pytest.mark.asyncio
async def test_cancel_patient_jobs_removes_all(event_loop_scheduler):
    scheduler = event_loop_scheduler
    now = datetime.utcnow()
    schedule_followups("p2", now, scheduler)

    jobs_before = [j for j in scheduler.get_jobs() if "p2" in j.id]
    assert len(jobs_before) == 3

    cancel_patient_jobs("p2", scheduler)

    jobs_after = [j for j in scheduler.get_jobs() if "p2" in j.id]
    assert len(jobs_after) == 0


@pytest.mark.asyncio
async def test_checkin_callback_noop_without_config():
    """_checkin_callback returns without error when no LLM factory is configured."""
    # Reset factory
    import ai_health_coach.scheduler.followup as mod
    old = mod._llm_factory
    mod._llm_factory = None
    try:
        await _checkin_callback("p1", "check_in")
    finally:
        mod._llm_factory = old


@pytest.mark.asyncio
async def test_checkin_callback_calls_run_followup():
    """_checkin_callback invokes run_followup when configured."""
    mock_llm = MagicMock()
    mock_factory = MagicMock(return_value=mock_llm)
    configure_callback(mock_factory)

    mock_session = AsyncMock()
    mock_session_factory = MagicMock()
    mock_session_factory.return_value.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session_factory.return_value.__aexit__ = AsyncMock(return_value=False)

    with patch("ai_health_coach.database.get_session_factory", return_value=mock_session_factory), \
         patch("ai_health_coach.graph.router.run_followup", new_callable=AsyncMock) as mock_run:
        await _checkin_callback("p1", "nudge")
        mock_run.assert_awaited_once_with(
            "p1", "nudge", mock_session, mock_llm, scheduler=None
        )

    # Cleanup
    import ai_health_coach.scheduler.followup as mod
    mod._llm_factory = None
