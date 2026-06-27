import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App Settings
    ENV: str = "development"
    PORT: int = 8000
    DEBUG: bool = True

    # OpenAI-compatible LLM (required for agent pipeline)
    LLM_BASE_URL: Optional[str] = None
    LLM_MODEL: Optional[str] = None
    LLM_API_KEY: Optional[str] = None
    LLM_MAX_TOKENS: int = 40000
    LLM_TEMPERATURE: float = 0.2

    # MySQL database (optional — app runs without DB when unset)
    DATABASE_URL: Optional[str] = None
    # One-time ETL source (SQL Server) — used by migrate_mssql_to_mysql.py only
    SOURCE_DATABASE_URL: Optional[str] = None
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_ECHO: bool = False

    # JWT Authentication
    JWT_SECRET_KEY: str = "CHANGE_THIS_TO_RANDOM_SECRET_KEY_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_HOURS: int = 24

    # Azure Communication Services Email (optional)
    AZURE_COMMUNICATION_CONNECTION_STRING: Optional[str] = None
    AZURE_COMMUNICATION_EMAIL_FROM: Optional[str] = None
    AZURE_COMMUNICATION_EMAIL_REPLY_TO: Optional[str] = None

    # Intelligence report emails
    REPORT_EMAIL_ENABLED: bool = False
    FRONTEND_BASE_URL: str = "http://localhost:5173"
    REPORT_EMAIL_RATE_LIMIT_MINUTES: int = 60

    # Project chat assistant
    CHAT_MAX_MESSAGE_LENGTH: int = 2000
    CHAT_RATE_LIMIT_MESSAGES: int = 30
    CHAT_RATE_LIMIT_WINDOW_SECONDS: int = 300

    model_config = SettingsConfigDict(
        env_file=os.path.join(Path(__file__).resolve().parent.parent.parent, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
