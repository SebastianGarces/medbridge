import pytest
import json

from ai_health_coach.models.patient import Patient, Goal, AssignedExercise, ExerciseSession, Reminder
from ai_health_coach.tools.goals import make_set_goal
from ai_health_coach.tools.alerts import make_alert_clinician
from ai_health_coach.tools.program import make_get_program_summary
from ai_health_coach.tools.adherence import make_get_adherence_summary
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


@pytest.mark.asyncio
async def test_get_program_summary_returns_exercises(db_session):
    patient = Patient(id="p4", name="Test4")
    db_session.add(patient)
    await db_session.commit()

    db_session.add(AssignedExercise(
        patient_id="p4", exercise_name="Shoulder Stretch", sets=3, reps=10,
    ))
    db_session.add(AssignedExercise(
        patient_id="p4", exercise_name="Pendulum Swings", sets=2, reps=15,
    ))
    await db_session.commit()

    tool = make_get_program_summary(db_session)
    result = await tool.ainvoke({"patient_id": "p4"})
    data = json.loads(result)
    assert "exercises" in data
    assert len(data["exercises"]) == 2
    assert data["exercises"][0]["sets"] == 3


@pytest.mark.asyncio
async def test_get_adherence_summary_returns_metrics(db_session):
    patient = Patient(id="p5", name="Test5")
    db_session.add(patient)
    await db_session.commit()

    ex = AssignedExercise(patient_id="p5", exercise_name="Stretch", sets=1, reps=5)
    db_session.add(ex)
    await db_session.commit()

    # Add a session
    db_session.add(ExerciseSession(patient_id="p5", exercise_id=ex.id))
    await db_session.commit()

    tool = make_get_adherence_summary(db_session)
    result = await tool.ainvoke({"patient_id": "p5"})
    data = json.loads(result)
    assert "adherence_pct" in data
    assert "streak" in data
    assert data["sessions_completed"] == 1


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
async def test_set_reminder_creates_record(db_session):
    patient = Patient(id="p6", name="Test6")
    db_session.add(patient)
    await db_session.commit()

    set_reminder = make_set_reminder(db_session)
    result = await set_reminder.ainvoke({
        "patient_id": "p6",
        "reminder_type": "check_in",
        "scheduled_date": "2026-03-25",
    })
    assert "scheduled" in result.lower()

    from sqlalchemy import select
    stmt = select(Reminder).where(Reminder.patient_id == "p6")
    reminder = (await db_session.execute(stmt)).scalar_one()
    assert reminder.reminder_type == "check_in"
    assert not reminder.fired
