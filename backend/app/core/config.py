"""
Application configuration.

DATABASE_URL controls which DB is used:
- Local dev (free, zero setup):  sqlite:///./tablereserve.db   (default)
- Production (free tier):        postgresql://... (Supabase connection string)
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "TableReserve API"
    ENV: str = "development"

    DATABASE_URL: str = "sqlite:///./tablereserve.db"

    JWT_SECRET_KEY: str = "CHANGE_ME_dev_only_insecure_secret_key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Comma-separated list of allowed origins for CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Supabase (used only when DATABASE_URL points to Supabase Postgres, and
    # for file storage / optional server-side Supabase calls). Safe to leave
    # blank for local SQLite development.
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
