import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import async_sessionmaker

from ai_health_coach.models.patient import Patient, Alert, Message
from ai_health_coach.models.enums import Phase, AlertSeverity, MessageRole


@pytest.fixture
async def clinician_app(db_engine, db_session):
    """Create test app with clinician routes."""
    from ai_health_coach.main import create_app
    from ai_health_coach.database import get_session
    from ai_health_coach.api.auth import router as auth_router, seed_demo_users
    from ai_health_coach.api.clinician_routes import router as clinician_router

    app = create_app()

    async def override_get_session():
        factory = async_sessionmaker(db_engine, expire_on_commit=False)
        async with factory() as session:
            yield session

    app.include_router(auth_router)
    app.include_router(clinician_router)
    app.dependency_overrides[get_session] = override_get_session

    # Seed users and test data
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        await seed_demo_users(session)
        # Update patient-1 to active phase
        p = await session.get(Patient, "patient-1")
        p.phase = Phase.ACTIVE
        p.consent_given = True

        # Add an alert
        alert = Alert(
            id="alert-1",
            patient_id="patient-1",
            severity=AlertSeverity.CRITICAL,
            title="Crisis detected",
            description="Patient expressed crisis language",
        )
        session.add(alert)

        # Add message
        msg = Message(
            id="msg-1",
            patient_id="patient-1",
            role=MessageRole.COACH,
            content="Welcome!",
        )
        session.add(msg)
        await session.commit()

    return app


@pytest.fixture
async def clinician_client(clinician_app):
    """Client logged in as clinician."""
    transport = ASGITransport(app=clinician_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post(
            "/login",
            data={"user_id": "clinician-1", "user_type": "clinician"},
            follow_redirects=False,
        )
        yield client


@pytest.mark.asyncio
async def test_dashboard_lists_patients(clinician_client):
    response = await clinician_client.get("/clinician/dashboard")
    assert response.status_code == 200
    assert "Sarah Johnson" in response.text


@pytest.mark.asyncio
async def test_dashboard_search(clinician_client):
    response = await clinician_client.get("/clinician/dashboard?q=Sarah")
    assert response.status_code == 200
    assert "Sarah" in response.text


@pytest.mark.asyncio
async def test_patient_detail_shows_transcript(clinician_client):
    response = await clinician_client.get("/clinician/patients/patient-1")
    assert response.status_code == 200
    assert "Welcome!" in response.text


@pytest.mark.asyncio
async def test_alerts_page_lists_alerts(clinician_client):
    response = await clinician_client.get("/clinician/alerts")
    assert response.status_code == 200
    assert "Crisis detected" in response.text


@pytest.mark.asyncio
async def test_alerts_filter_by_severity(clinician_client):
    response = await clinician_client.get("/clinician/alerts?severity=critical")
    assert response.status_code == 200
    assert "Crisis detected" in response.text


@pytest.mark.asyncio
async def test_acknowledge_alert(clinician_client, clinician_app, db_engine):
    response = await clinician_client.post(
        "/clinician/alerts/alert-1/acknowledge",
        follow_redirects=False,
    )
    assert response.status_code in (200, 303)

    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        alert = await session.get(Alert, "alert-1")
        assert alert.acknowledged is True


@pytest.mark.asyncio
async def test_health_check(clinician_client):
    response = await clinician_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_clinician_auth_required(clinician_app):
    transport = ASGITransport(app=clinician_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/clinician/dashboard", follow_redirects=False)
        assert response.status_code in (401, 303)
