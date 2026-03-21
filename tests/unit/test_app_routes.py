"""Test that all routers are mounted in the main app."""
from ai_health_coach.main import create_app


def test_all_routers_mounted():
    """Verify patient, clinician, and auth routers are mounted."""
    app = create_app()
    routes = [r.path for r in app.routes]

    # Auth routes
    assert "/login" in routes

    # Patient routes
    assert "/chat" in routes
    assert "/consent" in routes
    assert "/chat/send" in routes
    assert "/settings" in routes

    # Clinician routes
    assert "/clinician/dashboard" in routes
    assert "/clinician/alerts" in routes
    assert "/api/health" in routes


def test_health_endpoint_accessible():
    """Health check should be on the main app."""
    app = create_app()
    routes = {r.path for r in app.routes}
    assert "/api/health" in routes
