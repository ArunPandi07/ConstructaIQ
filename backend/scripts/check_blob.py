"""Standalone Azure Blob Storage connectivity check."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config.settings import settings
from app.services.blob_storage_service import blob_storage_service


async def main() -> int:
    if not settings.use_blob_storage:
        print("AZURE_STORAGE_CONNECTION_STRING is not configured.")
        return 1

    if not blob_storage_service.is_enabled:
        print("Blob storage SDK or credentials are not available.")
        return 1

    test_bytes = b"%PDF-1.4 constructaiq-blob-check"
    test_filename = "connectivity-check.pdf"

    try:
        result = await blob_storage_service.upload_document(
            project_name="connectivity-check",
            filename=test_filename,
            file_bytes=test_bytes,
        )
        print(
            {
                "status": "healthy",
                "blob_path": result.blob_path,
                "sas_url_generated": bool(result.blob_url_with_sas),
            }
        )
        return 0
    except Exception as exc:
        print(f"Blob storage check failed: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
