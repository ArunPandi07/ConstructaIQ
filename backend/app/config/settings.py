import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App Settings
    ENV: str = "development"
    PORT: int = 8000
    DEBUG: bool = True

    # Azure Document Intelligence
    AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: Optional[str] = None
    AZURE_DOCUMENT_INTELLIGENCE_KEY: Optional[str] = None

    # Azure AI Foundry REST Endpoint
    AZURE_AIFOUNDRY_ENDPOINT: Optional[str] = None
    AZURE_AIFOUNDRY_KEY: Optional[str] = None

    # Azure SQL Database (optional — app runs without DB when unset)
    DATABASE_URL: Optional[str] = None
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_ECHO: bool = False

    model_config = SettingsConfigDict(
        env_file=os.path.join(Path(__file__).resolve().parent.parent.parent, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
