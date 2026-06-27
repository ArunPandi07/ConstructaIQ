from app.services.logging_service import get_logger

logger = get_logger("DocumentExtractionService")

MOCK_CONTRACT_TEXT = (
    "Mock contract document.\n"
    "Project: Sample Tower Construction\n"
    "Client: Example Corp\n"
    "Budget: $12,500,000\n"
    "Duration: 18 months\n"
    "Scope: Commercial high-rise structural and MEP works."
)

MOCK_BLUEPRINT_TEXT = (
    "Mock blueprint document.\n"
    "Building type: Commercial tower\n"
    "Floors: 24\n"
    "Structural system: Reinforced concrete core with steel frame\n"
    "Foundation: Deep pile system."
)

try:
    from pypdf import PdfReader

    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False


class DocumentExtractionService:
    def __init__(self):
        if HAS_PYPDF:
            logger.info("Initialized DocumentExtractionService with PyPDF.")
        else:
            logger.info("Initialized DocumentExtractionService in mock mode (pypdf not installed).")

    def _mock_text(self, filename: str) -> str:
        logger.info("[MOCK] Extracting text from document: %s", filename)
        lower_name = filename.lower()
        if "contract" in lower_name:
            return MOCK_CONTRACT_TEXT
        if "blueprint" in lower_name or "drawings" in lower_name or "plan" in lower_name:
            return MOCK_BLUEPRINT_TEXT
        return f"Mock extracted text for file: {filename}\nGenerated content context details."

    async def _extract_text_from_pdf_bytes(self, file_bytes: bytes, filename: str) -> str:
        if not HAS_PYPDF:
            return self._mock_text(filename)
        logger.info("Extracting text locally from %s using pypdf...", filename)
        try:
            import io

            reader = PdfReader(io.BytesIO(file_bytes))
            chunks: list[str] = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    chunks.append(page_text)
            text = "\n".join(chunks)
            logger.info(
                "Local extraction completed for %s. Extracted %d characters.",
                filename,
                len(text),
            )
            return text or self._mock_text(filename)
        except Exception as exc:
            logger.error("Failed to extract text from %s: %s", filename, exc)
            return self._mock_text(filename)

    async def extract_text_from_bytes(self, file_bytes: bytes, filename: str) -> str:
        if not filename.lower().endswith(".pdf"):
            try:
                return file_bytes.decode("utf-8")
            except Exception:
                pass

        return await self._extract_text_from_pdf_bytes(file_bytes, filename)


document_extraction_service = DocumentExtractionService()
