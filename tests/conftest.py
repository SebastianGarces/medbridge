import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from langchain_core.messages import AIMessage
from ai_health_coach.database import Base, reset_engine


@pytest.fixture
async def db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db_session(db_engine):
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest.fixture
def mock_llm():
    llm = MagicMock()
    llm.ainvoke = AsyncMock()
    llm.invoke = MagicMock()
    # Support bind_tools: returns a mock LLM that also has ainvoke
    mock_llm_with_tools = MagicMock()
    mock_llm_with_tools.ainvoke = AsyncMock(return_value=AIMessage(content="Mock response"))
    llm.bind_tools = MagicMock(return_value=mock_llm_with_tools)
    return llm


def make_auth_header(user_id: str, user_type: str = "patient") -> dict:
    """Create an Authorization header with a valid JWT token for testing."""
    from ai_health_coach.api.auth import create_jwt_token
    token = create_jwt_token(user_id, user_type)
    return {"Authorization": f"Bearer {token}"}
