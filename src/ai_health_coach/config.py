from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./coach.db"
    OPENROUTER_API_KEY: str = "sk-or-placeholder"
    MODEL_NAME: str = "openai/gpt-4o"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    APP_TITLE: str = "AI Health Coach"
    APP_URL: str = "http://localhost:8000"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001", "https://frontend-production-6acc.up.railway.app"]
    JWT_SECRET: str = "dev-jwt-secret-change-in-production"
    JWT_EXPIRATION_HOURS: int = 24

    model_config = {"env_prefix": "", "env_file": ".env", "extra": "ignore"}


def get_settings() -> Settings:
    return Settings()
