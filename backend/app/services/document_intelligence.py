import os
from typing import Optional
from app.config.settings import settings
from app.services.logging_service import get_logger

logger = get_logger("DocumentIntelligenceService")

# Try to import Azure Document Intelligence SDK
try:
    from azure.ai.documentintelligence.aio import DocumentIntelligenceClient
    from azure.ai.documentintelligence.models import AnalyzeDocumentRequest
    from azure.core.credentials import AzureKeyCredential
    HAS_DOC_INTEL = True
except ImportError:
    HAS_DOC_INTEL = False
    logger.warning("azure-ai-documentintelligence not fully installed/imported. Falling back to Mock Document Intelligence.")

class DocumentIntelligenceService:
    def __init__(self):
        self.endpoint = settings.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT
        self.key = settings.AZURE_DOCUMENT_INTELLIGENCE_KEY
        self.use_mock = not self.endpoint or not self.key or not HAS_DOC_INTEL

        if self.use_mock:
            logger.info("Initialized DocumentIntelligenceService in Mock mode.")
        else:
            self.client = DocumentIntelligenceClient(
                endpoint=self.endpoint,
                credential=AzureKeyCredential(self.key)
            )

    async def extract_text_from_bytes(self, file_bytes: bytes, filename: str) -> str:
        """
        Extracts text directly from raw PDF bytes.
        Used by Mode 2 (document upload) without needing a Blob URL.
        """
        if self.use_mock:
            logger.info(f"[MOCK] Extracting text from bytes for: {filename}")
            lower_name = filename.lower()
            if "contract" in lower_name:
                return MOCK_CONTRACT_TEXT
            elif "blueprint" in lower_name or "drawings" in lower_name or "plan" in lower_name:
                return MOCK_BLUEPRINT_TEXT
            else:
                return f"Mock extracted text for file: {filename}\nGenerated content context details."

        logger.info(f"Submitting document bytes for {filename} to Azure Document Intelligence...")
        async with self.client:
            poller = await self.client.begin_analyze_document(
                "prebuilt-layout",
                AnalyzeDocumentRequest(bytes_source=file_bytes),
            )
            result = await poller.result()

            extracted_lines = []
            if result.paragraphs:
                for paragraph in result.paragraphs:
                    extracted_lines.append(paragraph.content)

            extracted_text = "\n".join(extracted_lines)
            logger.info(f"Extraction from bytes completed for {filename}. Extracted {len(extracted_text)} chars.")
            return extracted_text

    async def extract_text_from_blob(self, blob_url: str, filename: str) -> str:
        """
        Extracts text from the uploaded document.
        """
        if self.use_mock:
            logger.info(f"[MOCK] Extracting text from document: {filename}")
            # Intelligent fallback text based on filename keyword
            lower_name = filename.lower()
            if "contract" in lower_name:
                return MOCK_CONTRACT_TEXT
            elif "blueprint" in lower_name or "drawings" in lower_name or "plan" in lower_name:
                return MOCK_BLUEPRINT_TEXT
            else:
                return f"Mock extracted text for file: {filename}\nGenerated content context details."

        logger.info(f"Submitting document {filename} to Azure Document Intelligence...")
        async with self.client:
            # We start the analysis (using prebuilt-layout model)
            poller = await self.client.begin_analyze_document(
                "prebuilt-layout",
                AnalyzeDocumentRequest(url_source=blob_url),
            )
            result = await poller.result()
            
            # Aggregate all pages' lines
            extracted_lines = []
            if result.paragraphs:
                for paragraph in result.paragraphs:
                    extracted_lines.append(paragraph.content)
            
            extracted_text = "\n".join(extracted_lines)
            logger.info(f"Extraction completed for {filename}. Extracted {len(extracted_text)} characters.")
            return extracted_text

document_intelligence_service = DocumentIntelligenceService()
