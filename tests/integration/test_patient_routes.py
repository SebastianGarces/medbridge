import pytest
from datetime import datetime
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import async_sessionmaker

from ai_health_coach.models.patient import Patient, Message
from ai_health_coach.models.enums import Phase, MessageRole


@pytest.fixture
async def patient_app(db_engine, db_session):
    """Create test app with patient routes."""
    from ai_health_coach.main import create_app
    from ai_health_coach.database import get_session
    from ai_health_coach.api.auth import router as auth_router, seed_demo_users
    from ai_health_coach.api.patient_routes import router as patient_router

    app = create_app()

    async def override_get_session():
        factory = async_sessionmaker(db_engine, expire_on_commit=False)
        async with factory() as session:
            yield session

    app.include_router(auth_router)
    app.include_router(patient_router)
    app.dependency_overrides[get_session] = override_get_session

    # Seed users
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        await seed_demo_users(session)

    return app


@pytest.fixture
async def authed_client(patient_app):
    """Client logged in as patient-1."""
    transport = ASGITransport(app=patient_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post(
            "/login",
            data={"user_id": "patient-1", "user_type": "patient"},
            follow_redirects=False,
        )
        yield client


@pytest.mark.asyncio
async def test_root_redirects_to_consent(authed_client):
    response = await authed_client.get("/", follow_redirects=False)
    assert response.status_code == 303
    assert "/consent" in response.headers.get("location", "")


@pytest.mark.asyncio
async def test_root_redirects_to_chat(patient_app, db_engine):
    # Make patient-1 consented
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        patient = await session.get(Patient, "patient-1")
        patient.consent_given = True
        patient.phase = Phase.ACTIVE
        await session.commit()

    transport = ASGITransport(app=patient_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post(
            "/login",
            data={"user_id": "patient-1", "user_type": "patient"},
            follow_redirects=False,
        )
        response = await client.get("/", follow_redirects=False)
        assert response.status_code == 303
        assert "/chat" in response.headers.get("location", "")


@pytest.mark.asyncio
async def test_consent_grant(patient_app, db_engine):
    transport = ASGITransport(app=patient_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post(
            "/login",
            data={"user_id": "patient-1", "user_type": "patient"},
            follow_redirects=False,
        )
        response = await client.post(
            "/consent",
            data={"consent": "true"},
            follow_redirects=False,
        )
        assert response.status_code == 303

    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        patient = await session.get(Patient, "patient-1")
        assert patient.consent_given is True


@pytest.mark.asyncio
async def test_chat_requires_consent(authed_client):
    response = await authed_client.get("/chat", follow_redirects=False)
    assert response.status_code == 303
    assert "/consent" in response.headers.get("location", "")


@pytest.mark.asyncio
async def test_settings_page(patient_app, db_engine):
    transport = ASGITransport(app=patient_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        await client.post(
            "/login",
            data={"user_id": "patient-1", "user_type": "patient"},
            follow_redirects=False,
        )
        response = await client.get("/settings", follow_redirects=False)
        assert response.status_code == 200
