import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import async_sessionmaker

from ai_health_coach.models.patient import Patient, Alert, Message
from ai_health_coach.models.enums import Phase, AlertSeverity, MessageRole
from tests.conftest import make_auth_header


@pytest.fixture
async def clinician_app(db_engine, db_session):
    """Create test app with clinician routes."""
    from ai_health_coach.main import create_app
    from ai_health_coach.database import get_session
    from ai_health_coach.api.auth import seed_demo_users

    app = create_app()

    async def override_get_session():
        factory = async_sessionmaker(db_engine, expire_on_commit=False)
        async with factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session

    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        await seed_demo_users(session)
        p = await session.get(Patient, "patient-1")
        p.phase = Phase.ACTIVE
        p.consent_given = True

        alert = Alert(
            id="alert-1",
            patient_id="patient-1",
            severity=AlertSeverity.CRITICAL,
            title="Crisis detected",
            description="Patient expressed crisis language",
        )
        session.add(alert)

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
def clinician_headers():
    """Auth headers for clinician-1."""
    return make_auth_header("clinician-1", "clinician")


@pytest.mark.asyncio
async def test_dashboard_lists_patients(clinician_app, clinician_headers):
    transport = ASGITransport(app=clinician_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/clinician/dashboard", headers=clinician_headers)
        assert response.status_code == 200
        data = response.json()
        assert "patients" in data
        assert "stats" in data
        patient_names = [p["name"] for p in data["patients"]]
        assert "Sarah Johnson" in patient_names


@pytest.mark.asyncio
async def test_dashboard_search(clinician_app, clinician_headers):
    transport = ASGITransport(app=clinician_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/clinician/dashboard?q=Sarah", headers=clinician_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["patients"]) >= 1
        assert data["patients"][0]["name"] == "Sarah Johnson"


@pytest.mark.asyncio
async def test_patient_detail_shows_messages(clinician_app, clinician_headers):
    transport = ASGITransport(app=clinician_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/clinician/patients/patient-1", headers=clinician_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["patient"]["id"] == "patient-1"
        assert len(data["messages"]) >= 1
        assert data["messages"][0]["content"] == "Welcome!"


@pytest.mark.asyncio
async def test_alerts_page_lists_alerts(clinician_app, clinician_headers):
    transport = ASGITransport(app=clinician_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/clinician/alerts", headers=clinician_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["alerts"]) >= 1
        assert data["alerts"][0]["title"] == "Crisis detected"


@pytest.mark.asyncio
async def test_alerts_filter_by_severity(clinician_app, clinician_headers):
    transport = ASGITransport(app=clinician_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/clinician/alerts?severity=critical", headers=clinician_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["alerts"]) >= 1


@pytest.mark.asyncio
async def test_acknowledge_alert(clinician_app, clinician_headers, db_engine):
    transport = ASGITransport(app=clinician_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/clinician/alerts/alert-1/acknowledge",
            headers=clinician_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        alert = await session.get(Alert, "alert-1")
        assert alert.acknowledged is True


@pytest.mark.asyncio
async def test_health_check(clinician_app, clinician_headers):
    transport = ASGITransport(app=clinician_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/clinician/health", headers=clinician_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_clinician_auth_required(clinician_app):
    transport = ASGITransport(app=clinician_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/clinician/dashboard")
        assert response.status_code == 401
