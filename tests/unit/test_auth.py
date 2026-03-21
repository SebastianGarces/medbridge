import pytest
from httpx import AsyncClient, ASGITransport

from ai_health_coach.models.patient import Patient


@pytest.fixture
async def app_with_db(db_engine, db_session):
    """Create a test app with the test database."""
    from ai_health_coach.main import create_app
    from ai_health_coach.database import get_session, Base
    import ai_health_coach.database as db_module

    app = create_app()

    # Override get_session to use test DB
    async def override_get_session():
        from sqlalchemy.ext.asyncio import async_sessionmaker
        factory = async_sessionmaker(db_engine, expire_on_commit=False)
        async with factory() as session:
            yield session

    # Wire up auth routes
    from ai_health_coach.api.auth import router as auth_router, seed_demo_users
    app.include_router(auth_router)

    # Seed demo users
    from sqlalchemy.ext.asyncio import async_sessionmaker
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        await seed_demo_users(session)

    app.dependency_overrides[get_session] = override_get_session
    return app


@pytest.mark.asyncio
async def test_login_sets_cookie(app_with_db):
    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/login",
            data={"user_id": "patient-1", "user_type": "patient"},
            follow_redirects=False,
        )
        assert response.status_code in (303, 302, 200)
        assert "session" in response.cookies or "set-cookie" in response.headers


@pytest.mark.asyncio
async def test_get_current_patient_valid(app_with_db):
    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login first
        login_resp = await client.post(
            "/login",
            data={"user_id": "patient-1", "user_type": "patient"},
            follow_redirects=False,
        )
        # Use cookies from login to check auth endpoint
        response = await client.get("/auth/me", follow_redirects=False)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "patient-1"


@pytest.mark.asyncio
async def test_get_current_patient_invalid(app_with_db):
    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/auth/me", follow_redirects=False)
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_require_patient_unauthorized(app_with_db):
    transport = ASGITransport(app=app_with_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/auth/me", follow_redirects=False)
        assert response.status_code == 401


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
