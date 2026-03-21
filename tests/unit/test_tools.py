import pytest
import json

from ai_health_coach.models.patient import Patient, Goal
from ai_health_coach.tools.goals import make_set_goal
from ai_health_coach.tools.alerts import make_alert_clinician
from ai_health_coach.tools.program import get_program_summary
from ai_health_coach.tools.adherence import get_adherence_summary
from ai_health_coach.tools.reminders import make_set_reminder
from ai_health_coach.tools import get_all_tools


@pytest.mark.asyncio
async def test_set_goal_creates_record(db_session):
    patient = Patient(id="p1", name="Test")
    db_session.add(patient)
    await db_session.commit()

    set_goal = make_set_goal(db_session)
    result = await set_goal.ainvoke({"patient_id": "p1", "goal_text": "Walk 30 min daily"})
    assert "Walk 30 min daily" in result

    from sqlalchemy import select
    stmt = select(Goal).where(Goal.patient_id == "p1")
    goal = (await db_session.execute(stmt)).scalar_one_or_none()
    assert goal is not None
    assert goal.goal_text == "Walk 30 min daily"


@pytest.mark.asyncio
async def test_set_goal_idempotent(db_session):
    patient = Patient(id="p2", name="Test2")
    db_session.add(patient)
    await db_session.commit()

    set_goal = make_set_goal(db_session)
    await set_goal.ainvoke({"patient_id": "p2", "goal_text": "Goal v1"})
    await set_goal.ainvoke({"patient_id": "p2", "goal_text": "Goal v2"})

    from sqlalchemy import select
    stmt = select(Goal).where(Goal.patient_id == "p2")
    goals = (await db_session.execute(stmt)).scalars().all()
    assert len(goals) == 1
    assert goals[0].goal_text == "Goal v2"


@pytest.mark.asyncio
async def test_alert_clinician_creates_alert(db_session):
    patient = Patient(id="p3", name="Test3")
    db_session.add(patient)
    await db_session.commit()

    alert_clinician = make_alert_clinician(db_session)
    result = await alert_clinician.ainvoke({
        "patient_id": "p3",
        "severity": "critical",
        "reason": "Crisis language detected",
    })
    assert "alert" in result.lower() or "created" in result.lower()

    from sqlalchemy import select
    from ai_health_coach.models.patient import Alert
    stmt = select(Alert).where(Alert.patient_id == "p3")
    alert = (await db_session.execute(stmt)).scalar_one()
    assert alert.severity == "critical"


def test_get_program_summary_returns_exercises():
    result = get_program_summary.invoke({"patient_id": "p1"})
    data = json.loads(result)
    assert "exercises" in data
    assert len(data["exercises"]) == 4
    assert "sets" in data["exercises"][0]
    assert "reps" in data["exercises"][0]


def test_get_adherence_summary_returns_metrics():
    result = get_adherence_summary.invoke({"patient_id": "p1"})
    data = json.loads(result)
    assert "adherence_pct" in data
    assert "streak" in data


def test_get_all_tools_returns_five(db_session):
    tools = get_all_tools(db_session)
    assert len(tools) == 5
    names = {t.name for t in tools}
    assert "set_goal" in names
    assert "set_reminder" in names
    assert "get_program_summary" in names
    assert "get_adherence_summary" in names
    assert "alert_clinician" in names


@pytest.mark.asyncio
async def test_set_reminder_returns_confirmation(db_session):
    set_reminder = make_set_reminder(db_session)
    result = await set_reminder.ainvoke({
        "patient_id": "p1",
        "reminder_type": "check_in",
        "scheduled_date": "2026-03-25",
    })
    assert "reminder" in result.lower() or "scheduled" in result.lower()
