import io
import httpx
from pypdf import PdfReader
from app.services.logging_service import get_logger

logger = get_logger("DocumentIntelligenceService")

class DocumentIntelligenceService:
    def __init__(self):
        logger.info("Initialized DocumentIntelligenceService using PyPDF.")

    async def _extract_text_from_pdf_bytes(self, file_bytes: bytes, filename: str) -> str:
        logger.info("Extracting text locally from %s using pypdf...", filename)
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            logger.info("Extraction completed for %s. Extracted %d characters.", filename, len(text))
            return text
        except Exception as e:
            logger.error("Failed to extract text from %s: %s", filename, e)
            return ""

    async def extract_text_from_bytes(self, file_bytes: bytes, filename: str) -> str:
        """Extract text directly from raw bytes."""
        if not filename.lower().endswith(".pdf"):
            try:
                return file_bytes.decode("utf-8")
            except Exception:
                pass
        return await self._extract_text_from_pdf_bytes(file_bytes, filename)

    async def extract_text_from_blob(self, blob_url: str, filename: str) -> str:
        """Extract text from a blob URL via HTTP download, then parse."""
        logger.info("Downloading blob from %s to extract text locally...", filename)
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(blob_url)
                response.raise_for_status()
                return await self.extract_text_from_bytes(response.content, filename)
        except Exception as e:
            logger.error("Failed to download or extract text from blob %s: %s", filename, e)
            return ""

document_intelligence_service = DocumentIntelligenceService()
