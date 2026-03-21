import pytest

from ai_health_coach.graph.state import CoachState
from ai_health_coach.graph.edges import (
    route_by_phase,
    check_phase_transition,
    last_message_is_from_patient,
)
from ai_health_coach.models.enums import Phase
from langchain_core.messages import HumanMessage, AIMessage


def _make_state(**overrides) -> CoachState:
    defaults = {
        "messages": [],
        "patient_id": "p1",
        "phase": Phase.ACTIVE,
        "goal": None,
        "unanswered_count": 0,
        "consent_verified": True,
        "interaction_type": None,
        "safety_blocked": False,
        "retry_count": 0,
    }
    defaults.update(overrides)
    return defaults


def test_route_onboarding():
    state = _make_state(phase=Phase.ONBOARDING)
    assert route_by_phase(state) == "onboarding_subgraph"


def test_route_active():
    state = _make_state(phase=Phase.ACTIVE)
    assert route_by_phase(state) == "active_subgraph"


def test_route_re_engaging():
    state = _make_state(phase=Phase.RE_ENGAGING)
    assert route_by_phase(state) == "re_engaging_subgraph"


def test_route_dormant():
    state = _make_state(phase=Phase.DORMANT)
    assert route_by_phase(state) == "dormant_subgraph"


def test_transition_pending_to_onboarding():
    state = _make_state(phase=Phase.PENDING, consent_verified=True)
    new_state = check_phase_transition(state)
    assert new_state["phase"] == Phase.ONBOARDING


def test_transition_onboarding_to_active():
    state = _make_state(phase=Phase.ONBOARDING, goal="Walk daily")
    new_state = check_phase_transition(state)
    assert new_state["phase"] == Phase.ACTIVE


def test_transition_active_to_re_engaging():
    state = _make_state(phase=Phase.ACTIVE, unanswered_count=3)
    new_state = check_phase_transition(state)
    assert new_state["phase"] == Phase.RE_ENGAGING


def test_transition_re_engaging_to_active():
    state = _make_state(
        phase=Phase.RE_ENGAGING,
        messages=[HumanMessage(content="I'm back")],
    )
    new_state = check_phase_transition(state)
    assert new_state["phase"] == Phase.ACTIVE
    assert new_state["unanswered_count"] == 0


def test_transition_re_engaging_to_dormant():
    state = _make_state(phase=Phase.RE_ENGAGING, unanswered_count=3)
    new_state = check_phase_transition(state)
    assert new_state["phase"] == Phase.DORMANT


def test_transition_dormant_to_active():
    state = _make_state(
        phase=Phase.DORMANT,
        messages=[HumanMessage(content="Hi again")],
    )
    new_state = check_phase_transition(state)
    assert new_state["phase"] == Phase.ACTIVE
    assert new_state["unanswered_count"] == 0


def test_no_transition_when_no_trigger():
    state = _make_state(phase=Phase.ACTIVE, unanswered_count=1)
    new_state = check_phase_transition(state)
    assert new_state["phase"] == Phase.ACTIVE


def test_last_message_is_from_patient():
    state_patient = _make_state(messages=[HumanMessage(content="hi")])
    assert last_message_is_from_patient(state_patient) is True

    state_coach = _make_state(messages=[AIMessage(content="hello")])
    assert last_message_is_from_patient(state_coach) is False

    state_empty = _make_state(messages=[])
    assert last_message_is_from_patient(state_empty) is False
