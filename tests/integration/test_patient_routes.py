import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import async_sessionmaker

from ai_health_coach.models.patient import Patient
from ai_health_coach.models.enums import Phase
from tests.conftest import make_auth_header


@pytest.fixture
async def patient_app(db_engine, db_session):
    """Create test app with patient routes."""
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

    return app


@pytest.fixture
def patient_headers():
    """Auth headers for patient-1."""
    return make_auth_header("patient-1", "patient")


@pytest.mark.asyncio
async def test_patient_status(patient_app, patient_headers):
    transport = ASGITransport(app=patient_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/patient/status", headers=patient_headers)
        assert response.status_code == 200
        data = response.json()
        assert "phase" in data
        assert "consent_given" in data
        assert data["consent_given"] is False


@pytest.mark.asyncio
async def test_consent_grant(patient_app, patient_headers, db_engine):
    transport = ASGITransport(app=patient_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/patient/consent",
            json={"consent": True},
            headers=patient_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["consent_given"] is True

    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        patient = await session.get(Patient, "patient-1")
        assert patient.consent_given is True


@pytest.mark.asyncio
async def test_consent_revoke(patient_app, patient_headers, db_engine):
    # First grant consent
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        patient = await session.get(Patient, "patient-1")
        patient.consent_given = True
        patient.phase = Phase.ACTIVE
        await session.commit()

    transport = ASGITransport(app=patient_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/patient/consent",
            json={"consent": False},
            headers=patient_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["consent_given"] is False


@pytest.mark.asyncio
async def test_chat_requires_consent(patient_app, patient_headers):
    transport = ASGITransport(app=patient_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/patient/chat/messages", headers=patient_headers)
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_chat_messages_returns_json(patient_app, patient_headers, db_engine):
    # Make patient consented
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        patient = await session.get(Patient, "patient-1")
        patient.consent_given = True
        patient.phase = Phase.ACTIVE
        await session.commit()

    transport = ASGITransport(app=patient_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/patient/chat/messages", headers=patient_headers)
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert isinstance(data["messages"], list)


@pytest.mark.asyncio
async def test_settings_returns_json(patient_app, patient_headers):
    transport = ASGITransport(app=patient_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/patient/settings", headers=patient_headers)
        assert response.status_code == 200
        data = response.json()
        assert "consent_given" in data


@pytest.mark.asyncio
async def test_exercises_returns_json(patient_app, patient_headers, db_engine):
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        patient = await session.get(Patient, "patient-1")
        patient.consent_given = True
        patient.phase = Phase.ACTIVE
        await session.commit()

    transport = ASGITransport(app=patient_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/patient/exercises", headers=patient_headers)
        assert response.status_code == 200
        data = response.json()
        assert "program_videos" in data
        assert "all_videos" in data
        assert "categories" in data


@pytest.mark.asyncio
async def test_goals_returns_json(patient_app, patient_headers, db_engine):
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        patient = await session.get(Patient, "patient-1")
        patient.consent_given = True
        patient.phase = Phase.ACTIVE
        await session.commit()

    transport = ASGITransport(app=patient_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/patient/goals", headers=patient_headers)
        assert response.status_code == 200
        data = response.json()
        assert "adherence" in data
        assert "week_days" in data


@pytest.mark.asyncio
async def test_unauthenticated_returns_401(patient_app):
    transport = ASGITransport(app=patient_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/patient/status")
        assert response.status_code == 401
