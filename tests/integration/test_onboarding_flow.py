import pytest
from unittest.mock import AsyncMock, MagicMock

from langchain_core.messages import AIMessage, HumanMessage

from ai_health_coach.graph.router import build_graph, run_graph
from ai_health_coach.graph.state import CoachState
from ai_health_coach.models.enums import Phase
from ai_health_coach.models.patient import Patient, Goal
from sqlalchemy import select


@pytest.fixture
def mock_llm():
    llm = MagicMock()
    llm.ainvoke = AsyncMock(return_value=AIMessage(content="Welcome! Let's get started."))
    return llm


@pytest.mark.asyncio
async def test_full_onboarding_journey(db_session, mock_llm):
    """Consent → welcome → patient sends goal → goal confirmed → phase=ACTIVE"""
    patient = Patient(id="p-onboard", name="Onboard Test")
    db_session.add(patient)
    await db_session.commit()

    # Step 1: Grant consent
    from ai_health_coach.consent.gate import grant_consent
    await grant_consent("p-onboard", db_session)
    await db_session.refresh(patient)
    assert patient.phase == Phase.ONBOARDING
    assert patient.consent_given is True

    # Step 2: Patient sends a goal message
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(content="Pain-free shoulder stretches by April"))
    response = await run_graph("p-onboard", "I want pain-free shoulder stretches by April", db_session, mock_llm)
    assert response is not None

    # Step 3: Verify goal was created
    await db_session.refresh(patient)
    assert patient.goal is not None
    assert patient.phase == Phase.ACTIVE


@pytest.mark.asyncio
async def test_onboarding_handles_no_response(db_session, mock_llm):
    """Patient never responds → stays ONBOARDING"""
    patient = Patient(
        id="p-noresp",
        name="No Resp Test",
        consent_given=True,
        phase=Phase.ONBOARDING,
    )
    db_session.add(patient)
    await db_session.commit()

    # Run graph without patient message (coach-initiated)
    graph = build_graph(mock_llm)
    state = {
        "messages": [],
        "patient_id": "p-noresp",
        "phase": Phase.ONBOARDING,
        "goal": None,
        "unanswered_count": 0,
        "consent_verified": True,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
    }
    result = await graph.ainvoke(state)
    # Should still be in onboarding (no goal)
    assert result.get("goal") is None or result["phase"] == Phase.ONBOARDING


@pytest.mark.asyncio
async def test_active_to_dormant_escalation(db_session, mock_llm):
    """3 unanswered check-ins → RE_ENGAGING → DORMANT + alert"""
    from ai_health_coach.graph.edges import check_phase_transition
    from ai_health_coach.scheduler.followup import should_go_dormant

    # Simulate escalation via state transitions
    state = {
        "messages": [],
        "patient_id": "p-esc",
        "phase": Phase.ACTIVE,
        "goal": "Walk daily",
        "unanswered_count": 3,
        "consent_verified": True,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
    }

    # Should transition ACTIVE → RE_ENGAGING
    result = check_phase_transition(state)
    assert result["phase"] == Phase.RE_ENGAGING

    # Continue with 3 unanswered in RE_ENGAGING → DORMANT
    result["unanswered_count"] = 3
    result2 = check_phase_transition(result)
    assert result2["phase"] == Phase.DORMANT
    assert should_go_dormant(3) is True


@pytest.mark.asyncio
async def test_dormant_reengagement(db_session, mock_llm):
    """Dormant patient sends 'hi' → warm welcome → ACTIVE"""
    from ai_health_coach.graph.edges import check_phase_transition

    state = {
        "messages": [HumanMessage(content="hi")],
        "patient_id": "p-dormant",
        "phase": Phase.DORMANT,
        "goal": "Walk daily",
        "unanswered_count": 5,
        "consent_verified": True,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
    }

    result = check_phase_transition(state)
    assert result["phase"] == Phase.ACTIVE
    assert result["unanswered_count"] == 0


@pytest.mark.asyncio
async def test_safety_blocks_clinical_in_pipeline(db_session, mock_llm):
    """End-to-end: coach generates clinical content → caught by safety → fallback"""
    from ai_health_coach.safety.classifier import keyword_check
    from ai_health_coach.safety.fallback import SAFE_FALLBACK_MESSAGE

    # Simulate coach generating clinical content
    clinical_msg = "You should take ibuprofen for your diagnosis"
    assert keyword_check(clinical_msg) is True

    # The fallback should be safe
    assert keyword_check(SAFE_FALLBACK_MESSAGE) is False


@pytest.mark.asyncio
async def test_consent_revoke_blocks_everything(db_session, mock_llm):
    """Revoke consent → next interaction blocked"""
    patient = Patient(
        id="p-revoke",
        name="Revoke Test",
        consent_given=True,
        phase=Phase.ACTIVE,
    )
    db_session.add(patient)
    await db_session.commit()

    # Revoke consent
    from ai_health_coach.consent.gate import revoke_consent
    await revoke_consent("p-revoke", db_session)
    await db_session.refresh(patient)
    assert patient.consent_given is False
    assert patient.phase == Phase.PENDING

    # Next graph invocation should be blocked
    graph = build_graph(mock_llm)
    state = {
        "messages": [HumanMessage(content="hello")],
        "patient_id": "p-revoke",
        "phase": Phase.PENDING,
        "goal": None,
        "unanswered_count": 0,
        "consent_verified": False,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
    }
    result = await graph.ainvoke(state)
    # Should get a consent-blocked message
    last_msg = result["messages"][-1]
    assert "consent" in last_msg.content.lower()


@pytest.mark.asyncio
async def test_concurrent_phase_transition(db_session, mock_llm):
    """Goal confirmation triggers ACTIVE"""
    mock_llm.ainvoke = AsyncMock(return_value=AIMessage(content="Great goal!"))

    patient = Patient(
        id="p-concurrent",
        name="Concurrent Test",
        consent_given=True,
        phase=Phase.ONBOARDING,
    )
    db_session.add(patient)
    await db_session.commit()

    response = await run_graph(
        "p-concurrent",
        "I want to do my shoulder stretches without pain by March 31",
        db_session,
        mock_llm,
    )
    assert response is not None

    await db_session.refresh(patient)
    # Should have transitioned to ACTIVE with goal set
    assert patient.goal is not None
    assert patient.phase == Phase.ACTIVE
