from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional
from app.config.settings import settings
from app.services.logging_service import get_logger
from app.orchestrator.analyze_orchestrator import (
    run_pipeline_from_text,
    run_pipeline_from_documents,
)

logger = get_logger("AnalyzeRouter")
router = APIRouter(prefix="/analyze", tags=["Analyze"])


# ─────────────────────────────────────────────────────────────────────────────
# MODE 1 — Text Only: Project Name + Description
# React sends: { "project_name": "...", "description": "...", "agent_version": "1" }
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/text")
async def analyze_from_text(
    project_name: str = Form(..., description="Name of the project"),
    description: str = Form(..., description="Project description or scope of work"),
    agent_version: str = Form(default="1", description="Agent version to call in Azure AI Foundry"),
):
    """
    Mode 1: No documents needed.
    Takes project name and description, runs directly through all Foundry agents
    and returns the full risk + health + recovery analysis.
    """
    logger.info(f"[Mode 1 - Text] Received request for project: {project_name}")
    try:
        result = await run_pipeline_from_text(
            project_name=project_name,
            description=description,
            agent_version=agent_version,
        )
        return result
    except Exception as e:
        logger.error(f"[Mode 1] Pipeline failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline failed: {str(e)}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# MODE 2 — Document Upload: Project Name + Contract PDF + Blueprint PDF (optional)
# React sends: multipart/form-data with project_name, contract (file), blueprint (file)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/documents")
async def analyze_from_documents(
    project_name: str = Form(..., description="Name of the project"),
    agent_version: str = Form(default="1", description="Agent version to call in Azure AI Foundry"),
    contract: Optional[UploadFile] = File(default=None, description="Contract PDF (optional)"),
    blueprint: Optional[UploadFile] = File(default=None, description="Blueprint PDF (optional)"),
):
    """
    Mode 2: Document-based.
    Accepts an optional Contract PDF and optional Blueprint PDF.
    Extracts text using Azure Document Intelligence, then passes the extracted
    text to the full Foundry agent pipeline.
    At least one document must be provided.
    """
    if not contract and not blueprint:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one document (contract or blueprint) must be provided."
        )

    logger.info(f"[Mode 2 - Documents] Received request for project: {project_name}")

    # Validate file types
    for doc in [contract, blueprint]:
        if doc and not doc.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only PDF files are accepted. '{doc.filename}' is not a PDF."
            )

    # Read file bytes
    contract_bytes = await contract.read() if contract else None
    contract_filename = contract.filename if contract else None

    blueprint_bytes = await blueprint.read() if blueprint else None
    blueprint_filename = blueprint.filename if blueprint else None

    try:
        result = await run_pipeline_from_documents(
            project_name=project_name,
            contract_bytes=contract_bytes,
            contract_filename=contract_filename,
            blueprint_bytes=blueprint_bytes,
            blueprint_filename=blueprint_filename,
            agent_version=agent_version,
        )
        return result
    except Exception as e:
        logger.error(f"[Mode 2] Pipeline failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline failed: {str(e)}"
        )
