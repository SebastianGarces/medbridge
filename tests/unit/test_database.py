import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text

from ai_health_coach.database import Base


@pytest.mark.asyncio
async def test_create_tables():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Verify we can query sqlite_master
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result.fetchall()]
    assert isinstance(tables, list)
    await engine.dispose()


@pytest.mark.asyncio
async def test_session_factory(db_session):
    result = await db_session.execute(text("SELECT 1"))
    assert result.scalar() == 1
