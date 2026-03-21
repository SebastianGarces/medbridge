import pytest
from datetime import datetime

from ai_health_coach.models.enums import Phase, InteractionType, AlertSeverity, MessageRole
from ai_health_coach.models.patient import Patient, Goal, Message, Alert, PhaseTransition
from ai_health_coach.models.schemas import ConsentRequest, SendMessageRequest, GoalSubmitRequest


@pytest.mark.asyncio
async def test_patient_creation(db_session):
    patient = Patient(id="p1", name="Test Patient")
    db_session.add(patient)
    await db_session.commit()
    await db_session.refresh(patient)
    assert patient.phase == Phase.PENDING
    assert patient.consent_given is False


@pytest.mark.asyncio
async def test_goal_relationship(db_session):
    patient = Patient(id="p2", name="Goal Patient")
    db_session.add(patient)
    await db_session.commit()

    goal = Goal(id="g1", patient_id="p2", goal_text="Walk daily")
    db_session.add(goal)
    await db_session.commit()
    await db_session.refresh(patient)
    assert patient.goal is not None
    assert patient.goal.goal_text == "Walk daily"


@pytest.mark.asyncio
async def test_message_ordering(db_session):
    patient = Patient(id="p3", name="Msg Patient")
    db_session.add(patient)
    await db_session.commit()

    m1 = Message(id="m1", patient_id="p3", role=MessageRole.COACH, content="Hello")
    m2 = Message(id="m2", patient_id="p3", role=MessageRole.PATIENT, content="Hi")
    db_session.add_all([m1, m2])
    await db_session.commit()
    await db_session.refresh(patient)
    assert len(patient.messages) == 2


@pytest.mark.asyncio
async def test_alert_creation(db_session):
    patient = Patient(id="p4", name="Alert Patient")
    db_session.add(patient)
    await db_session.commit()

    alert = Alert(
        id="a1",
        patient_id="p4",
        severity=AlertSeverity.CRITICAL,
        title="Crisis detected",
        description="Patient expressed crisis language",
    )
    db_session.add(alert)
    await db_session.commit()
    await db_session.refresh(alert)
    assert alert.severity == AlertSeverity.CRITICAL
    assert alert.acknowledged is False


@pytest.mark.asyncio
async def test_phase_transition_log(db_session):
    patient = Patient(id="p5", name="Phase Patient")
    db_session.add(patient)
    await db_session.commit()

    transition = PhaseTransition(
        id="pt1",
        patient_id="p5",
        from_phase=Phase.PENDING,
        to_phase=Phase.ONBOARDING,
        reason="consent_given",
    )
    db_session.add(transition)
    await db_session.commit()
    await db_session.refresh(transition)
    assert transition.from_phase == Phase.PENDING
    assert transition.to_phase == Phase.ONBOARDING


def test_phase_enum_values():
    assert Phase.PENDING == "PENDING"
    assert Phase.ONBOARDING == "ONBOARDING"
    assert Phase.ACTIVE == "ACTIVE"
    assert Phase.RE_ENGAGING == "RE_ENGAGING"
    assert Phase.DORMANT == "DORMANT"
    assert len(Phase) == 5


def test_pydantic_schemas_validate():
    consent = ConsentRequest(consent=True)
    assert consent.consent is True

    msg = SendMessageRequest(message="Hello coach")
    assert msg.message == "Hello coach"

    goal = GoalSubmitRequest(goal_text="Walk 30 min daily")
    assert goal.goal_text == "Walk 30 min daily"

    # Invalid data should raise
    with pytest.raises(Exception):
        SendMessageRequest(message="")
