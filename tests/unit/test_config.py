import os

from ai_health_coach.config import Settings


def test_config_loads_defaults():
    settings = Settings()
    assert settings.DATABASE_URL == "sqlite+aiosqlite:///./coach.db"
    assert settings.MODEL_NAME == "openai/gpt-4o"
    assert settings.SECRET_KEY == "dev-secret-key-change-in-production"
    assert settings.OPENROUTER_BASE_URL == "https://openrouter.ai/api/v1"
    assert settings.APP_TITLE == "AI Health Coach"
    assert settings.CORS_ORIGINS == ["http://localhost:3000", "http://localhost:3001"]
    assert settings.JWT_SECRET == "dev-jwt-secret-change-in-production"
    assert settings.JWT_EXPIRATION_HOURS == 24


def test_config_from_env(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    monkeypatch.setenv("MODEL_NAME", "anthropic/claude-sonnet-4")
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-or-test-key")
    settings = Settings()
    assert settings.DATABASE_URL == "sqlite+aiosqlite:///./test.db"
    assert settings.MODEL_NAME == "anthropic/claude-sonnet-4"
    assert settings.OPENROUTER_API_KEY == "sk-or-test-key"
