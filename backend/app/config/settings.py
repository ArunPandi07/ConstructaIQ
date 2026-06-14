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

    # Azure Blob Storage (optional — omit to use in-memory bytes for document extraction)
    AZURE_STORAGE_CONNECTION_STRING: Optional[str] = None
    AZURE_STORAGE_CONTAINER_NAME: str = "constructaiq-documents"
    AZURE_STORAGE_SAS_EXPIRY_MINUTES: int = 60

    # Azure SQL Database (optional — app runs without DB when unset)
    DATABASE_URL: Optional[str] = None
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

    model_config = SettingsConfigDict(
        env_file=os.path.join(Path(__file__).resolve().parent.parent.parent, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def use_blob_storage(self) -> bool:
        return bool(self.AZURE_STORAGE_CONNECTION_STRING and self.AZURE_STORAGE_CONTAINER_NAME)

settings = Settings()
