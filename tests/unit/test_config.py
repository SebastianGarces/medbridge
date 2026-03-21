import os

from ai_health_coach.config import Settings


def test_config_loads_defaults():
    settings = Settings()
    assert settings.DATABASE_URL == "sqlite+aiosqlite:///./coach.db"
    assert settings.MODEL_NAME == "gpt-4o"
    assert settings.SECRET_KEY == "dev-secret-key-change-in-production"


def test_config_from_env(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    monkeypatch.setenv("MODEL_NAME", "gpt-3.5-turbo")
    settings = Settings()
    assert settings.DATABASE_URL == "sqlite+aiosqlite:///./test.db"
    assert settings.MODEL_NAME == "gpt-3.5-turbo"
