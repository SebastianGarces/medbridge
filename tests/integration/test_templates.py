import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import async_sessionmaker

from ai_health_coach.models.patient import Patient, Alert, Message, Goal
from ai_health_coach.models.enums import Phase, AlertSeverity, MessageRole


@pytest.fixture
async def full_app(db_engine, db_session):
    """Create full test app with all routes."""
    from ai_health_coach.main import create_app
    from ai_health_coach.database import get_session
    from ai_health_coach.api.auth import router as auth_router, seed_demo_users
    from ai_health_coach.api.patient_routes import router as patient_router
    from ai_health_coach.api.clinician_routes import router as clinician_router

    app = create_app()

    async def override_get_session():
        factory = async_sessionmaker(db_engine, expire_on_commit=False)
        async with factory() as session:
            yield session

    app.include_router(auth_router)
    app.include_router(patient_router)
    app.include_router(clinician_router)
    app.dependency_overrides[get_session] = override_get_session

    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        await seed_demo_users(session)
        # Set up patient-1 with consent and data
        p = await session.get(Patient, "patient-1")
        p.consent_given = True
        p.phase = Phase.ACTIVE
        goal = Goal(id="goal-1", patient_id="patient-1", goal_text="Pain-free stretches", progress_pct=45)
        session.add(goal)
        msg = Message(id="msg-1", patient_id="patient-1", role=MessageRole.COACH, content="Welcome!")
        session.add(msg)
        alert = Alert(id="alert-t1", patient_id="patient-1", severity=AlertSeverity.CRITICAL,
                      title="Crisis detected", description="Test")
        session.add(alert)
        await session.commit()

    return app


def test_base_template_includes_tailwind(full_app):
    from jinja2 import Environment, FileSystemLoader
    import pathlib
    templates_dir = pathlib.Path(__file__).parent.parent.parent / "src" / "ai_health_coach" / "templates"
    env = Environment(loader=FileSystemLoader(str(templates_dir)), autoescape=True)
    template = env.get_template("base.html")
    rendered = template.render(request=None)
    assert "tailwindcss" in rendered or "cdn.tailwindcss.com" in rendered


def test_base_template_includes_htmx(full_app):
    from jinja2 import Environment, FileSystemLoader
    import pathlib
    templates_dir = pathlib.Path(__file__).parent.parent.parent / "src" / "ai_health_coach" / "templates"
    env = Environment(loader=FileSystemLoader(str(templates_dir)), autoescape=True)
    template = env.get_template("base.html")
    rendered = template.render(request=None)
    assert "htmx" in rendered


@pytest.mark.asyncio
async def test_chat_template_has_polling(full_app):
    transport = ASGITransport(app=full_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/login", data={"user_id": "patient-1", "user_type": "patient"}, follow_redirects=False)
        response = await client.get("/chat")
        assert 'hx-trigger="every 3s"' in response.text


@pytest.mark.asyncio
async def test_chat_template_has_send_form(full_app):
    transport = ASGITransport(app=full_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/login", data={"user_id": "patient-1", "user_type": "patient"}, follow_redirects=False)
        response = await client.get("/chat")
        assert 'hx-post="/chat/send"' in response.text


@pytest.mark.asyncio
async def test_consent_template_renders(full_app):
    transport = ASGITransport(app=full_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/login", data={"user_id": "patient-2", "user_type": "patient"}, follow_redirects=False)
        response = await client.get("/consent")
        assert response.status_code == 200
        assert "Enable Your AI Health Coach" in response.text


@pytest.mark.asyncio
async def test_dashboard_template_renders(full_app):
    transport = ASGITransport(app=full_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/login", data={"user_id": "clinician-1", "user_type": "clinician"}, follow_redirects=False)
        response = await client.get("/clinician/dashboard")
        assert response.status_code == 200
        assert "Patient Dashboard" in response.text


@pytest.mark.asyncio
async def test_alerts_template_has_filter_pills(full_app):
    transport = ASGITransport(app=full_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/login", data={"user_id": "clinician-1", "user_type": "clinician"}, follow_redirects=False)
        response = await client.get("/clinician/alerts")
        assert response.status_code == 200
        assert "Critical" in response.text
        assert "Warning" in response.text


@pytest.mark.asyncio
async def test_templates_autoescaping(full_app, db_engine):
    """XSS payload in message content should be escaped."""
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        xss_msg = Message(
            id="xss-msg",
            patient_id="patient-1",
            role=MessageRole.PATIENT,
            content='<script>alert("xss")</script>',
        )
        session.add(xss_msg)
        await session.commit()

    transport = ASGITransport(app=full_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post("/login", data={"user_id": "patient-1", "user_type": "patient"}, follow_redirects=False)
        response = await client.get("/chat")
        # The script tag should be escaped, not raw
        assert '<script>alert("xss")</script>' not in response.text
        assert '&lt;script&gt;' in response.text or '&lt;script' in response.text
