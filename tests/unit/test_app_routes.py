"""Test that all routers are mounted in the main app."""
from ai_health_coach.main import create_app


def test_all_routers_mounted():
    """Verify patient, clinician, and auth routers are mounted."""
    app = create_app()
    routes = [r.path for r in app.routes]

    # Auth routes (under /api/auth)
    assert "/api/auth/login" in routes
    assert "/api/auth/me" in routes
    assert "/api/auth/demo-users" in routes

    # Patient routes (under /api/patient)
    assert "/api/patient/chat/messages" in routes
    assert "/api/patient/consent" in routes
    assert "/api/patient/chat/send" in routes
    assert "/api/patient/settings" in routes
    assert "/api/patient/status" in routes

    # Clinician routes (under /api/clinician)
    assert "/api/clinician/dashboard" in routes
    assert "/api/clinician/alerts" in routes
    assert "/api/clinician/health" in routes

    # SSE route
    assert "/api/patient/chat/stream" in routes


def test_health_endpoint_accessible():
    """Health check should be on the main app."""
    app = create_app()
    routes = {r.path for r in app.routes}
    assert "/api/clinician/health" in routes
