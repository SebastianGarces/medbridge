import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import async_sessionmaker

from ai_health_coach.api.auth import create_jwt_token, decode_jwt_token
from ai_health_coach.models.patient import Patient
from tests.conftest import make_auth_header


@pytest.fixture
async def app_with_db(db_engine, db_session):
    """Create a test app with the test database."""
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


def test_create_and_decode_jwt():
    token = create_jwt_token("patient-1", "patient")
    data = decode_jwt_token(token)
    assert data["user_id"] == "patient-1"
    assert data["user_type"] == "patient"


@pytest.mark.asyncio
async def test_login_returns_token(app_with_db):
    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/login",
            json={"user_id": "patient-1", "user_type": "patient"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["id"] == "patient-1"
        assert data["user"]["type"] == "patient"


@pytest.mark.asyncio
async def test_get_current_patient_valid(app_with_db):
    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = make_auth_header("patient-1", "patient")
        response = await client.get("/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "patient-1"


@pytest.mark.asyncio
async def test_get_current_patient_invalid(app_with_db):
    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/me")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_require_patient_unauthorized(app_with_db):
    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/me")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_demo_users_endpoint(app_with_db):
    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/demo-users")
        assert response.status_code == 200
        data = response.json()
        assert len(data["patients"]) == 2
        assert len(data["clinicians"]) == 1


@pytest.mark.asyncio
async def test_demo_users_seeded(app_with_db, db_engine):
    from sqlalchemy.ext.asyncio import async_sessionmaker
    from sqlalchemy import select

    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        result = await session.execute(select(Patient))
        patients = result.scalars().all()
        patient_ids = [p.id for p in patients]
        assert "patient-1" in patient_ids
        assert "patient-2" in patient_ids
