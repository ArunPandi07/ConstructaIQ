from __future__ import annotations

import json
from datetime import date
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.agent_execution import AgentExecution
from app.db.repositories.agent_execution_repository import AgentExecutionRepository
from app.db.repositories.crew_plan_repository import CrewPlanRepository
from app.db.repositories.document_repository import DocumentRepository
from app.db.repositories.permit_repository import PermitRepository
from app.db.repositories.project_repository import ProjectRepository
from app.db.repositories.project_supplier_repository import ProjectSupplierRepository
from app.db.repositories.schedule_repository import ScheduleRepository
from app.schemas.document import DocumentCreate
from app.schemas.project import ProjectCreate, ProjectRead
from app.schemas.project_responses import (
    DashboardActivityItem,
    DashboardKPI,
    DashboardRecommendationItem,
    DashboardResponse,
    ProjectListItem,
)
from app.services.analyze_job_service import AnalyzeJob, analyze_job_service
from app.services.blob_storage_service import blob_storage_service
from app.services.logging_service import get_logger
from app.services.response_mapper import map_permit_status, map_project_intelligence

logger = get_logger("ProjectService")

_ACTIVE_STATUSES = frozenset({"active", "live"})
_COMPLETE_STATUSES = frozenset({"complete", "completed", "success"})


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


def _count_agent_completed(executions: list[AgentExecution]) -> int:
    latest_by_agent: dict[str, AgentExecution] = {}
    for ex in executions:
        name = ex.agent_name
        if not name:
            continue
        prev = latest_by_agent.get(name)
        if prev is None or (ex.execution_id or 0) > (prev.execution_id or 0):
            latest_by_agent[name] = ex
    completed = 0
    for ex in latest_by_agent.values():
        status_val = (ex.status or "").strip().lower()
        if status_val in _COMPLETE_STATUSES:
            completed += 1
    return completed


def _avg_phase_progress(schedules: list[Any]) -> int | None:
    if not schedules:
        return None
    raw = schedules[0].phase_breakdown
    if not raw:
        return None
    try:
        phases_raw = json.loads(raw) if isinstance(raw, str) else raw
    except json.JSONDecodeError:
        return None
    if not isinstance(phases_raw, list):
        return None
    progresses: list[int] = []
    for item in phases_raw:
        if isinstance(item, dict) and item.get("progress") is not None:
            try:
                progresses.append(int(item["progress"]))
            except (TypeError, ValueError):
                continue
    if not progresses:
        return None
    return round(sum(progresses) / len(progresses))


def _format_budget_total(value: Decimal) -> str:
    if value >= 1_000_000:
        return f"${value / 1_000_000:.1f}M"
    return f"${value:,.0f}"


async def list_projects(
    session: AsyncSession, *, skip: int = 0, limit: int = 100
) -> list[ProjectListItem]:
    repo = ProjectRepository(session)
    projects = await repo.list_desc(skip=skip, limit=limit)
    if not projects:
        return []

    project_ids = [p.project_id for p in projects]
    execution_repo = AgentExecutionRepository(session)
    supplier_repo = ProjectSupplierRepository(session)
    crew_repo = CrewPlanRepository(session)
    schedule_repo = ScheduleRepository(session)

    all_executions = await execution_repo.list_by_projects(project_ids)
    executions_by_project: dict[int, list[AgentExecution]] = {}
    for ex in all_executions:
        executions_by_project.setdefault(ex.project_id, []).append(ex)

    items: list[ProjectListItem] = []
    for project in projects:
        pid = project.project_id
        suppliers = await supplier_repo.list_by_project(pid, limit=1000)
        crew_plans = await crew_repo.list_by_project(pid, limit=1000)
        schedules = await schedule_repo.list_by_project(pid, limit=1)
        base = ProjectRead.model_validate(project)
        items.append(
            ProjectListItem(
                **base.model_dump(),
                agent_completed=_count_agent_completed(
                    executions_by_project.get(pid, [])
                ),
                supplier_count=len(suppliers),
                crew_count=len(crew_plans),
                phase_progress=_avg_phase_progress(schedules),
            )
        )
    return items


def _execution_activity(ex: AgentExecution, project_name: str) -> DashboardActivityItem:
    status_val = (ex.status or "unknown").lower()
    if status_val in _COMPLETE_STATUSES:
        action = f"completed run for {project_name}"
        severity = "info"
    elif status_val in {"error", "failed"}:
        action = f"failed: {ex.error_message or 'unknown error'}"
        severity = "high"
    elif status_val == "running":
        action = f"running for {project_name}"
        severity = "medium"
    else:
        action = f"status {ex.status or 'unknown'} for {project_name}"
        severity = "low"

    time_str = ""
    if ex.completed_at:
        time_str = ex.completed_at.isoformat()
    elif ex.started_at:
        time_str = ex.started_at.isoformat()

    return DashboardActivityItem(
        id=ex.execution_id or 0,
        agent=ex.agent_name or "UnknownAgent",
        action=action,
        time=time_str,
        severity=severity,
        project=project_name,
        project_id=ex.project_id,
    )


async def get_dashboard(session: AsyncSession) -> DashboardResponse:
    repo = ProjectRepository(session)
    projects = await repo.list_desc(skip=0, limit=500)
    today = date.today()

    active_projects = [
        p for p in projects if (p.status or "").lower() in _ACTIVE_STATUSES
    ]
    on_time = [
        p
        for p in projects
        if p.target_completion_date is not None
        and p.target_completion_date >= today
    ]
    total_budget_val = sum(
        (p.contract_value or Decimal(0)) for p in projects
    )

    execution_repo = AgentExecutionRepository(session)
    permit_repo = PermitRepository(session)
    recent_executions = await execution_repo.list_recent_global(limit=15)
    project_names = {p.project_id: p.project_name for p in projects}

    recent_activities = [
        _execution_activity(
            ex, project_names.get(ex.project_id, f"Project {ex.project_id}")
        )
        for ex in recent_executions
    ]
    total_tokens_recent = sum(
        (ex.tokens_used or 0) for ex in recent_executions
    )

    recommendations: list[DashboardRecommendationItem] = []
    rec_id = 1
    for project in projects[:20]:
        permits = await permit_repo.list_by_project(project.project_id, limit=50)
        pending = [
            p
            for p in permits
            if map_permit_status(p.status) not in ("Approved",)
        ]
        for permit in pending[:2]:
            recommendations.append(
                DashboardRecommendationItem(
                    id=rec_id,
                    project=project.project_name,
                    recommendation=(
                        f"Follow up on {permit.permit_name or 'permit'} "
                        f"({map_permit_status(permit.status)})"
                    ),
                    confidence=80,
                    impact="High" if map_permit_status(permit.status) == "Pending" else "Medium",
                    category="Permits",
                )
            )
            rec_id += 1

    permit_status_counts: dict[str, int] = {}
    for project in projects[:30]:
        for permit in await permit_repo.list_by_project(project.project_id, limit=50):
            label = map_permit_status(permit.status)
            permit_status_counts[label] = permit_status_counts.get(label, 0) + 1

    risk_distribution = [
        {"name": name, "value": count, "color": "#F5C518"}
        for name, count in sorted(
            permit_status_counts.items(), key=lambda x: -x[1]
        )
    ]

    return DashboardResponse(
        kpi=DashboardKPI(
            active_projects=len(active_projects),
            risk_projects=0,
            on_time_projects=len(on_time),
            total_budget=_format_budget_total(total_budget_val),
            open_risks=0,
            recovery_plans=0,
        ),
        health_trend=[],
        risk_distribution=risk_distribution,
        recent_activities=recent_activities,
        recent_recommendations=recommendations[:10],
        total_tokens_recent=total_tokens_recent,
    )


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
