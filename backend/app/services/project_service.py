from __future__ import annotations

import asyncio
import json
from datetime import date
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.agent_execution import AgentExecution
from app.db.repositories.agent_execution_repository import AgentExecutionRepository
from app.db.repositories.budget_repository import BudgetRepository
from app.db.repositories.crew_plan_repository import CrewPlanRepository
from app.db.repositories.document_repository import DocumentRepository
from app.db.repositories.inspection_repository import InspectionRepository
from app.db.repositories.permit_repository import PermitRepository
from app.db.repositories.project_repository import ProjectRepository
from app.db.repositories.project_risk_repository import ProjectRiskRepository
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
_RELATED_ROW_LIMIT = 1000
_DASHBOARD_PROJECT_LIMIT = 100


async def _get_project_or_404(session: AsyncSession, project_id: int):
    repo = ProjectRepository(session)
    project = await repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found.",
        )
    return project


async def create_project(session: AsyncSession, payload: ProjectCreate, *, created_by_user_id: int | None = None):
    repo = ProjectRepository(session)
    data = payload.model_dump()
    if created_by_user_id is not None:
        data["created_by_user_id"] = created_by_user_id
    project = await repo.create(data)
    await session.commit()
    return project


async def upload_project_documents(
    session: AsyncSession,
    *,
    project_name: str,
    contract: UploadFile | None,
    blueprint: UploadFile | None,
    created_by_user_id: int | None = None,
) -> tuple[Any, list[Any]]:
    if not contract and not blueprint:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one of contract or blueprint PDF is required.",
        )

    project = await create_project(
        session,
        ProjectCreate(project_name=project_name, status="uploaded"),
        created_by_user_id=created_by_user_id,
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


def _count_on_track_projects(
    active_projects: list[Any],
    schedules_by_project: dict[int, list[Any]],
    today: date,
    *,
    min_progress: int = 45,
) -> int:
    """Active projects on schedule: future target date and healthy phase progress."""
    on_track = 0
    for project in active_projects:
        if (
            project.target_completion_date is not None
            and project.target_completion_date < today
        ):
            continue
        progress = _avg_phase_progress(
            schedules_by_project.get(project.project_id, [])
        )
        if progress is not None and progress >= min_progress:
            on_track += 1
    return on_track


def _format_budget_total(value: Decimal) -> str:
    if value >= 1_000_000:
        return f"${value / 1_000_000:.1f}M"
    return f"${value:,.0f}"


def _group_by_project_id(rows: list[Any]) -> dict[int, list[Any]]:
    grouped: dict[int, list[Any]] = {}
    for row in rows:
        grouped.setdefault(row.project_id, []).append(row)
    return grouped


async def _fetch_project_enrichment(
    session: AsyncSession,
    project_ids: list[int],
) -> tuple[
    dict[int, list[AgentExecution]],
    dict[int, list[Any]],
    dict[int, list[Any]],
    dict[int, list[Any]],
]:
    if not project_ids:
        return {}, {}, {}, {}

    execution_repo = AgentExecutionRepository(session)
    supplier_repo = ProjectSupplierRepository(session)
    crew_repo = CrewPlanRepository(session)
    schedule_repo = ScheduleRepository(session)

    (
        all_executions,
        suppliers_raw,
        crew_raw,
        schedules_raw,
    ) = await asyncio.gather(
        execution_repo.list_by_projects(project_ids),
        supplier_repo.list_by_projects(project_ids, limit=_RELATED_ROW_LIMIT),
        crew_repo.list_by_projects(project_ids, limit=_RELATED_ROW_LIMIT),
        schedule_repo.list_by_projects(project_ids, limit=_RELATED_ROW_LIMIT),
    )

    executions_by_project: dict[int, list[AgentExecution]] = {}
    for ex in all_executions:
        executions_by_project.setdefault(ex.project_id, []).append(ex)

    return (
        executions_by_project,
        _group_by_project_id(suppliers_raw),
        _group_by_project_id(crew_raw),
        _group_by_project_id(schedules_raw),
    )


def _project_list_items_from_enrichment(
    projects: list[Any],
    executions_by_project: dict[int, list[AgentExecution]],
    suppliers_by_project: dict[int, list[Any]],
    crew_by_project: dict[int, list[Any]],
    schedules_by_project: dict[int, list[Any]],
) -> list[ProjectListItem]:
    items: list[ProjectListItem] = []
    for project in projects:
        pid = project.project_id
        base = ProjectRead.model_validate(project)
        items.append(
            ProjectListItem(
                **base.model_dump(),
                agent_completed=_count_agent_completed(
                    executions_by_project.get(pid, [])
                ),
                supplier_count=len(suppliers_by_project.get(pid, [])),
                crew_count=len(crew_by_project.get(pid, [])),
                phase_progress=_avg_phase_progress(schedules_by_project.get(pid, [])),
            )
        )
    return items


def _build_health_trend_light(
    projects: list[Any],
    schedules_by_project: dict[int, list[Any]],
    open_risks: int,
    today: date,
) -> list[dict[str, Any]]:
    trend: list[dict[str, Any]] = []
    for project in projects[:10]:
        health = _avg_phase_progress(
            schedules_by_project.get(project.project_id, [])
        )
        trend.append(
            {
                "month": project.project_name[:20],
                "health": health,
                "risk": min(100, open_risks * 5),
                "onTime": 100
                if project.target_completion_date
                and project.target_completion_date >= today
                else 50,
            }
        )
    return trend


async def _build_project_list_items(
    session: AsyncSession,
    projects: list[Any],
) -> list[ProjectListItem]:
    if not projects:
        return []
    enrichment = await _fetch_project_enrichment(
        session, [p.project_id for p in projects]
    )
    return _project_list_items_from_enrichment(projects, *enrichment)


async def list_projects(
    session: AsyncSession, *, skip: int = 0, limit: int = 100
) -> list[ProjectListItem]:
    repo = ProjectRepository(session)
    projects = await repo.list_desc(skip=skip, limit=limit)
    return await _build_project_list_items(session, projects)


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


async def get_dashboard(
    session: AsyncSession,
    *,
    include_projects: bool = False,
) -> DashboardResponse:
    repo = ProjectRepository(session)
    risk_repo = ProjectRiskRepository(session)
    execution_repo = AgentExecutionRepository(session)
    permit_repo = PermitRepository(session)

    projects = await repo.list_desc(skip=0, limit=_DASHBOARD_PROJECT_LIMIT)

    today = date.today()
    active_projects = [
        p for p in projects if (p.status or "").lower() in _ACTIVE_STATUSES
    ]
    active_ids = [p.project_id for p in active_projects]
    total_budget_val = sum(
        (p.contract_value or Decimal(0)) for p in projects
    )

    rec_project_ids = [p.project_id for p in projects[:20]]
    enrichment_project_ids = (
        [p.project_id for p in projects]
        if include_projects
        else [p.project_id for p in projects[:10]]
    )

    schedule_repo = ScheduleRepository(session)

    async def _empty_schedules() -> list[Any]:
        return []

    gather_tasks: list[Any] = [
        asyncio.gather(
            risk_repo.count_open_global(),
            risk_repo.count_risk_projects_global(),
            risk_repo.count_recovery_plans_global(),
            risk_repo.count_by_category_global(),
        ),
        execution_repo.list_recent_global(limit=15),
        permit_repo.list_by_projects(rec_project_ids, limit=1000),
        schedule_repo.list_by_projects(active_ids, limit=_RELATED_ROW_LIMIT)
        if active_ids
        else _empty_schedules(),
    ]
    if enrichment_project_ids:
        gather_tasks.append(
            _fetch_project_enrichment(session, enrichment_project_ids)
        )

    gather_results = await asyncio.gather(*gather_tasks)
    (
        open_risks,
        risk_projects,
        recovery_plans,
        category_counts,
    ) = gather_results[0]
    recent_executions = gather_results[1]
    permits_raw = gather_results[2]
    schedules_active_raw = gather_results[3]
    enrichment = gather_results[4] if enrichment_project_ids else None

    schedules_by_active = _group_by_project_id(schedules_active_raw)
    on_time_projects = _count_on_track_projects(
        active_projects, schedules_by_active, today
    )

    project_names = {p.project_id: p.project_name for p in projects}
    permits_by_project = _group_by_project_id(permits_raw)

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
        permits = permits_by_project.get(project.project_id, [])
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

    risk_distribution = [
        {
            "name": "Supply Chain" if k == "supply_chain" else "Workforce" if k == "workforce" else k.title(),
            "value": count,
            "color": "#F5C518" if k == "supply_chain" else "#E2B30D",
        }
        for k, count in sorted(category_counts.items(), key=lambda x: -x[1])
    ]

    project_list_items: list[ProjectListItem] = []
    health_trend: list[dict[str, Any]] = []
    if enrichment is not None:
        exec_by, sup_by, crew_by, sch_by = enrichment
        if include_projects:
            project_list_items = _project_list_items_from_enrichment(
                projects, exec_by, sup_by, crew_by, sch_by
            )
        health_trend = _build_health_trend_light(
            projects, sch_by, open_risks, today
        )

    return DashboardResponse(
        kpi=DashboardKPI(
            active_projects=len(active_projects),
            risk_projects=risk_projects,
            on_time_projects=on_time_projects,
            total_budget=_format_budget_total(total_budget_val),
            open_risks=open_risks,
            recovery_plans=recovery_plans,
        ),
        health_trend=health_trend,
        risk_distribution=risk_distribution,
        recent_activities=recent_activities,
        recent_recommendations=recommendations[:10],
        total_tokens_recent=total_tokens_recent,
        projects=project_list_items,
    )


async def get_project_summary(session: AsyncSession, project_id: int) -> dict[str, Any]:
    project = await _get_project_or_404(session, project_id)
    permits = await PermitRepository(session).list_by_project(project_id)
    schedules = await ScheduleRepository(session).list_by_project(project_id)
    crew_plans = await CrewPlanRepository(session).list_by_project(project_id)
    budgets = await BudgetRepository(session).list_by_project(project_id)
    inspections = await InspectionRepository(session).list_by_project(project_id)
    risks = await ProjectRiskRepository(session).list_by_project(project_id)
    exec_repo = AgentExecutionRepository(session)
    executions = await exec_repo.list_by_project_full(project_id)
    blueprint_execution = await exec_repo.get_latest_by_agent(
        project_id, "BlueprintAgent"
    )
    suppliers = await ProjectSupplierRepository(session).list_by_project(project_id)
    intelligence = map_project_intelligence(
        project,
        permits,
        schedules,
        crew_plans,
        budgets=budgets,
        inspections=inspections,
        risks=risks,
        executions=executions,
        suppliers=suppliers,
        blueprint_execution=blueprint_execution,
    )
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
    triggering_user_id: int | None = None,
    send_report_email: bool = False,
) -> AnalyzeJob:
    project = await _get_project_or_404(session, project_id)
    documents = await DocumentRepository(session).list_by_project(project_id)

    contract_bytes = None
    contract_filename = None
    blueprint_bytes = None
    blueprint_filename = None
    existing_blob_paths: dict[str, str] = {}
    skip_blob_upload = False

    if blob_storage_service.is_enabled:
        for doc in documents:
            if doc.document_type == "contract" and doc.blob_url:
                contract_bytes, contract_filename = (
                    await blob_storage_service.download_document(doc.blob_url),
                    doc.file_name,
                )
                existing_blob_paths["contract"] = doc.blob_url
                skip_blob_upload = True
            elif doc.document_type == "blueprint" and doc.blob_url:
                blueprint_bytes, blueprint_filename = (
                    await blob_storage_service.download_document(doc.blob_url),
                    doc.file_name,
                )
                existing_blob_paths["blueprint"] = doc.blob_url
                skip_blob_upload = True

    job = analyze_job_service.create_job(
        project_id,
        triggering_user_id=triggering_user_id,
        send_report_email=send_report_email,
    )
    analyze_job_service.enqueue(
        job,
        project_name=project.project_name,
        description=description or project.scope,
        contract_bytes=contract_bytes,
        contract_filename=contract_filename,
        blueprint_bytes=blueprint_bytes,
        blueprint_filename=blueprint_filename,
        skip_blob_upload=skip_blob_upload,
        existing_blob_paths=existing_blob_paths or None,
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
