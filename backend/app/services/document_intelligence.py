import os
from typing import Optional
from app.config.settings import settings
from app.services.logging_service import get_logger

logger = get_logger("DocumentIntelligenceService")

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
    from azure.ai.documentintelligence.aio import DocumentIntelligenceClient
    from azure.ai.documentintelligence.models import AnalyzeDocumentRequest
    from azure.core.credentials import AzureKeyCredential
    HAS_DOC_INTEL = True
except ImportError:
    HAS_DOC_INTEL = False
    logger.warning(
        "azure-ai-documentintelligence not fully installed/imported. "
        "Falling back to Mock Document Intelligence."
    )


class DocumentIntelligenceService:
    def __init__(self):
        self.endpoint = settings.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT
        self.key = settings.AZURE_DOCUMENT_INTELLIGENCE_KEY
        self.use_mock = not self.endpoint or not self.key or not HAS_DOC_INTEL

        if self.use_mock:
            logger.info("Initialized DocumentIntelligenceService in Mock mode.")

    def _mock_text(self, filename: str) -> str:
        logger.info("[MOCK] Extracting text from document: %s", filename)
        lower_name = filename.lower()
        if "contract" in lower_name:
            return MOCK_CONTRACT_TEXT
        if "blueprint" in lower_name or "drawings" in lower_name or "plan" in lower_name:
            return MOCK_BLUEPRINT_TEXT
        return f"Mock extracted text for file: {filename}\nGenerated content context details."

    async def _analyze(self, request: AnalyzeDocumentRequest, filename: str) -> str:
        """Run DI analysis with a fresh client per call (client must not be reused after close)."""
        logger.info("Submitting document %s to Azure Document Intelligence...", filename)
        async with DocumentIntelligenceClient(
            endpoint=self.endpoint,
            credential=AzureKeyCredential(self.key),
        ) as client:
            poller = await client.begin_analyze_document(
                "prebuilt-layout",
                request,
            )
            result = await poller.result()

        extracted_lines = []
        if result.paragraphs:
            for paragraph in result.paragraphs:
                extracted_lines.append(paragraph.content)

        extracted_text = "\n".join(extracted_lines)
        logger.info(
            "Extraction completed for %s. Extracted %s characters.",
            filename,
            len(extracted_text),
        )
        return extracted_text

    async def extract_text_from_bytes(self, file_bytes: bytes, filename: str) -> str:
        """Extract text directly from raw PDF bytes (Mode 2 without blob)."""
        if self.use_mock:
            return self._mock_text(filename)

        return await self._analyze(
            AnalyzeDocumentRequest(bytes_source=file_bytes),
            filename,
        )

    async def extract_text_from_blob(self, blob_url: str, filename: str) -> str:
        """Extract text from a blob URL via SAS (Mode 2 with blob storage)."""
        if self.use_mock:
            return self._mock_text(filename)

        return await self._analyze(
            AnalyzeDocumentRequest(url_source=blob_url),
            filename,
        )


document_intelligence_service = DocumentIntelligenceService()
