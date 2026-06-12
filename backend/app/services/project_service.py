from __future__ import annotations

from typing import Any

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.agent_execution_repository import AgentExecutionRepository
from app.db.repositories.crew_plan_repository import CrewPlanRepository
from app.db.repositories.document_repository import DocumentRepository
from app.db.repositories.permit_repository import PermitRepository
from app.db.repositories.project_repository import ProjectRepository
from app.db.repositories.project_supplier_repository import ProjectSupplierRepository
from app.db.repositories.schedule_repository import ScheduleRepository
from app.schemas.document import DocumentCreate
from app.schemas.project import ProjectCreate
from app.services.analyze_job_service import AnalyzeJob, analyze_job_service
from app.services.blob_storage_service import blob_storage_service
from app.services.logging_service import get_logger
from app.services.response_mapper import map_project_intelligence

logger = get_logger("ProjectService")


async def _get_project_or_404(session: AsyncSession, project_id: int):
    repo = ProjectRepository(session)
    project = await repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found.",
        )
    return project


async def create_project(session: AsyncSession, payload: ProjectCreate):
    repo = ProjectRepository(session)
    project = await repo.create(payload)
    await session.commit()
    return project


async def upload_project_documents(
    session: AsyncSession,
    *,
    project_name: str,
    contract: UploadFile | None,
    blueprint: UploadFile | None,
) -> tuple[Any, list[Any]]:
    if not contract and not blueprint:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one of contract or blueprint PDF is required.",
        )

    project = await create_project(
        session, ProjectCreate(project_name=project_name, status="uploaded")
    )
    doc_repo = DocumentRepository(session)
    documents = []

    async def _store(doc_type: str, upload: UploadFile) -> None:
        content = await upload.read()
        blob_url = None
        if blob_storage_service.is_enabled:
            blob_result = await blob_storage_service.upload_document(
                project_name, upload.filename or f"{doc_type}.pdf", content
            )
            blob_url = blob_result.blob_path

        document = await doc_repo.create(
            DocumentCreate(
                project_id=project.project_id,
                document_type=doc_type,
                file_name=upload.filename,
                blob_url=blob_url,
            )
        )
        documents.append(document)

    if contract:
        await _store("contract", contract)
    if blueprint:
        await _store("blueprint", blueprint)

    await session.commit()
    return project, documents


async def get_project(session: AsyncSession, project_id: int):
    return await _get_project_or_404(session, project_id)


async def get_project_summary(session: AsyncSession, project_id: int) -> dict[str, Any]:
    project = await _get_project_or_404(session, project_id)
    permits = await PermitRepository(session).list_by_project(project_id)
    schedules = await ScheduleRepository(session).list_by_project(project_id)
    crew_plans = await CrewPlanRepository(session).list_by_project(project_id)
    intelligence = map_project_intelligence(project, permits, schedules, crew_plans)
    return {"project": project, "intelligence": intelligence}


async def get_project_suppliers(session: AsyncSession, project_id: int):
    await _get_project_or_404(session, project_id)
    return await ProjectSupplierRepository(session).list_by_project(project_id)


async def get_project_crew(session: AsyncSession, project_id: int):
    await _get_project_or_404(session, project_id)
    return await CrewPlanRepository(session).list_by_project(project_id)


async def get_project_agents(session: AsyncSession, project_id: int):
    await _get_project_or_404(session, project_id)
    return await AgentExecutionRepository(session).list_by_project(project_id)


async def start_analyze_job(
    session: AsyncSession,
    project_id: int,
    *,
    description: str | None = None,
) -> AnalyzeJob:
    project = await _get_project_or_404(session, project_id)
    documents = await DocumentRepository(session).list_by_project(project_id)

    contract_bytes = None
    contract_filename = None
    blueprint_bytes = None
    blueprint_filename = None

    if blob_storage_service.is_enabled:
        for doc in documents:
            if doc.document_type == "contract" and doc.blob_url:
                contract_bytes, contract_filename = (
                    await blob_storage_service.download_document(doc.blob_url),
                    doc.file_name,
                )
            elif doc.document_type == "blueprint" and doc.blob_url:
                blueprint_bytes, blueprint_filename = (
                    await blob_storage_service.download_document(doc.blob_url),
                    doc.file_name,
                )

    job = analyze_job_service.create_job(project_id)
    analyze_job_service.enqueue(
        job,
        project_name=project.project_name,
        description=description or project.scope,
        contract_bytes=contract_bytes,
        contract_filename=contract_filename,
        blueprint_bytes=blueprint_bytes,
        blueprint_filename=blueprint_filename,
    )
    return job


def get_analyze_job_status(project_id: int, job_id: str | None = None) -> AnalyzeJob:
    job = (
        analyze_job_service.get_job(job_id)
        if job_id
        else analyze_job_service.get_latest_job_for_project(project_id)
    )
    if job is None or job.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analyze job not found for this project.",
        )
    return job
