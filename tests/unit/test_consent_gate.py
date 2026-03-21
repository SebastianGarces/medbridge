import pytest
from datetime import datetime

from ai_health_coach.models.patient import Patient
from ai_health_coach.models.enums import Phase
from ai_health_coach.consent.gate import verify_consent, grant_consent, revoke_consent


@pytest.mark.asyncio
async def test_verify_consent_true(db_session):
    patient = Patient(id="p1", name="Consented", consent_given=True)
    db_session.add(patient)
    await db_session.commit()
    assert await verify_consent("p1", db_session) is True


@pytest.mark.asyncio
async def test_verify_consent_false(db_session):
    patient = Patient(id="p2", name="Not Consented", consent_given=False)
    db_session.add(patient)
    await db_session.commit()
    assert await verify_consent("p2", db_session) is False


@pytest.mark.asyncio
async def test_grant_consent_sets_fields(db_session):
    patient = Patient(id="p3", name="Grant Test")
    db_session.add(patient)
    await db_session.commit()

    await grant_consent("p3", db_session)
    await db_session.refresh(patient)
    assert patient.consent_given is True
    assert patient.consent_given_at is not None


@pytest.mark.asyncio
async def test_grant_consent_transitions_to_onboarding(db_session):
    patient = Patient(id="p4", name="Phase Test")
    db_session.add(patient)
    await db_session.commit()

    await grant_consent("p4", db_session)
    await db_session.refresh(patient)
    assert patient.phase == Phase.ONBOARDING


@pytest.mark.asyncio
async def test_revoke_consent_clears_fields(db_session):
    patient = Patient(id="p5", name="Revoke Test", consent_given=True, phase=Phase.ACTIVE)
    db_session.add(patient)
    await db_session.commit()

    await revoke_consent("p5", db_session)
    await db_session.refresh(patient)
    assert patient.consent_given is False
    assert patient.consent_given_at is None
    assert patient.phase == Phase.PENDING


@pytest.mark.asyncio
async def test_revoke_consent_preserves_history(db_session):
    from ai_health_coach.models.patient import Message
    from ai_health_coach.models.enums import MessageRole

    patient = Patient(id="p6", name="History Test", consent_given=True, phase=Phase.ACTIVE)
    db_session.add(patient)
    await db_session.commit()

    msg = Message(id="m1", patient_id="p6", role=MessageRole.COACH, content="Hello")
    db_session.add(msg)
    await db_session.commit()

    await revoke_consent("p6", db_session)
    await db_session.refresh(patient)
    assert len(patient.messages) == 1


@pytest.mark.asyncio
async def test_require_consent_redirects(db_session):
    from fastapi import HTTPException
    from ai_health_coach.consent.gate import require_consent

    patient = Patient(id="p7", name="Redirect Test", consent_given=False)
    db_session.add(patient)
    await db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        await require_consent(patient)
    assert exc_info.value.status_code == 303


@pytest.mark.asyncio
async def test_require_consent_passes(db_session):
    from ai_health_coach.consent.gate import require_consent

    patient = Patient(id="p8", name="Pass Test", consent_given=True)
    db_session.add(patient)
    await db_session.commit()

    result = await require_consent(patient)
    assert result.id == "p8"
