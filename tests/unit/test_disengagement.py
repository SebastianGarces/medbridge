import pytest

from ai_health_coach.scheduler.followup import get_backoff_delay, should_go_dormant


def test_backoff_delays():
    assert get_backoff_delay(1) == 2
    assert get_backoff_delay(2) == 3


def test_dormant_after_three_unanswered():
    assert should_go_dormant(3) is True
    assert should_go_dormant(2) is False
    assert should_go_dormant(1) is False


def test_warning_alert_at_three():
    assert should_go_dormant(3) is True
