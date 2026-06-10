import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Tuple

from app.config.settings import settings
from app.services.logging_service import get_logger

logger = get_logger("BlobStorageService")

try:
    from azure.storage.blob import BlobSasPermissions, ContentSettings, generate_blob_sas
    from azure.storage.blob.aio import BlobServiceClient
    HAS_BLOB_SDK = True
except ImportError:
    HAS_BLOB_SDK = False
    logger.warning("azure-storage-blob not installed. Blob storage is disabled.")


@dataclass(frozen=True)
class BlobUploadResult:
    blob_path: str
    blob_url_with_sas: str


def _sanitize_project_name(project_name: str) -> str:
    sanitized = re.sub(r"[^\w\-]", "-", project_name.lower().strip())
    sanitized = re.sub(r"-+", "-", sanitized).strip("-")
    return sanitized or "project"


def _parse_connection_string(connection_string: str) -> Tuple[str, str]:
    parts = {}
    for item in connection_string.split(";"):
        if "=" in item:
            key, value = item.split("=", 1)
            parts[key] = value
    return parts.get("AccountName", ""), parts.get("AccountKey", "")


class BlobStorageService:
    def __init__(self):
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.container_name = settings.AZURE_STORAGE_CONTAINER_NAME
        self.sas_expiry_minutes = settings.AZURE_STORAGE_SAS_EXPIRY_MINUTES
        self._account_name, self._account_key = (
            _parse_connection_string(self.connection_string)
            if self.connection_string
            else ("", "")
        )

    @property
    def is_enabled(self) -> bool:
        return (
            settings.use_blob_storage
            and HAS_BLOB_SDK
            and bool(self._account_name)
            and bool(self._account_key)
        )

    def _build_blob_path(self, project_name: str, filename: str) -> str:
        safe_project = _sanitize_project_name(project_name)
        safe_filename = re.sub(r"[^\w.\-]", "-", filename.strip()) or "document.pdf"
        return f"{safe_project}/{uuid.uuid4()}/{safe_filename}"

    def generate_blob_sas_url(self, blob_path: str) -> str:
        if not self.is_enabled:
            raise RuntimeError("Blob storage is not configured.")

        sas_token = generate_blob_sas(
            account_name=self._account_name,
            container_name=self.container_name,
            blob_name=blob_path,
            account_key=self._account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.now(timezone.utc) + timedelta(minutes=self.sas_expiry_minutes),
        )
        blob_url = (
            f"https://{self._account_name}.blob.core.windows.net/"
            f"{self.container_name}/{blob_path}"
        )
        return f"{blob_url}?{sas_token}"

    async def upload_document(
        self,
        project_name: str,
        filename: str,
        file_bytes: bytes,
    ) -> BlobUploadResult:
        if not self.is_enabled:
            raise RuntimeError("Blob storage is not configured.")

        blob_path = self._build_blob_path(project_name, filename)
        logger.info(f"Uploading document to blob path: {blob_path}")

        async with BlobServiceClient.from_connection_string(self.connection_string) as client:
            blob_client = client.get_blob_client(
                container=self.container_name,
                blob=blob_path,
            )
            await blob_client.upload_blob(
                file_bytes,
                overwrite=True,
                content_settings=ContentSettings(content_type="application/pdf"),
            )

        blob_url_with_sas = self.generate_blob_sas_url(blob_path)
        logger.info(f"Upload completed for blob path: {blob_path}")
        return BlobUploadResult(blob_path=blob_path, blob_url_with_sas=blob_url_with_sas)


blob_storage_service = BlobStorageService()
