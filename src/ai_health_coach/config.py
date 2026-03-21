from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./coach.db"
    OPENAI_API_KEY: str = "sk-placeholder"
    MODEL_NAME: str = "gpt-4o"
    SECRET_KEY: str = "dev-secret-key-change-in-production"

    model_config = {"env_prefix": "", "env_file": ".env", "extra": "ignore"}


def get_settings() -> Settings:
    return Settings()
