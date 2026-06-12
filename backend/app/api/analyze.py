from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_optional
from app.orchestrator.analyze_orchestrator import (
    run_pipeline_from_documents,
    run_pipeline_from_text,
)
from app.services.logging_service import get_logger

logger = get_logger("AnalyzeRouter")
router = APIRouter(prefix="/analyze", tags=["Analyze"])


@router.post("/text")
async def analyze_from_text(
    project_name: str = Form(..., description="Name of the project"),
    description: str = Form(..., description="Project description or scope of work"),
    project_id: Optional[int] = Form(default=None, description="Optional project ID for persistence"),
    session: Optional[AsyncSession] = Depends(get_db_optional),
):
    """
    Mode 1: No documents needed.
    Runs the 6-agent pipeline (Contract → Blueprint → Permit → Schedule → Supplier → Crew).
    """
    logger.info(f"[Mode 1 - Text] Received request for project: {project_name}")
    try:
        result = await run_pipeline_from_text(
            project_name=project_name,
            description=description,
            project_id=project_id,
            session=session,
        )
        if session is not None:
            await session.commit()
        return result
    except HTTPException:
        if session is not None:
            await session.rollback()
        raise
    except Exception as e:
        if session is not None:
            await session.rollback()
        logger.error(f"[Mode 1] Pipeline failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline failed: {str(e)}",
        )


@router.post("/documents")
async def analyze_from_documents(
    project_name: str = Form(..., description="Name of the project"),
    project_id: Optional[int] = Form(default=None, description="Optional project ID for persistence"),
    contract: Optional[UploadFile] = File(default=None, description="Contract PDF (optional)"),
    blueprint: Optional[UploadFile] = File(default=None, description="Blueprint PDF (optional)"),
    session: Optional[AsyncSession] = Depends(get_db_optional),
):
    """
    Mode 2: Document-based.
    Accepts an optional Contract PDF and optional Blueprint PDF.
    Extracts text using Azure Document Intelligence, then runs the 6-agent pipeline.
    At least one document must be provided.
    """
    if not contract and not blueprint:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one document (contract or blueprint) must be provided.",
        )

    logger.info(f"[Mode 2 - Documents] Received request for project: {project_name}")

    for doc in [contract, blueprint]:
        if doc and not doc.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only PDF files are accepted. '{doc.filename}' is not a PDF.",
            )

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
            project_id=project_id,
            session=session,
        )
        if session is not None:
            await session.commit()
        return result
    except HTTPException:
        if session is not None:
            await session.rollback()
        raise
    except Exception as e:
        if session is not None:
            await session.rollback()
        logger.error(f"[Mode 2] Pipeline failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline failed: {str(e)}",
        )
