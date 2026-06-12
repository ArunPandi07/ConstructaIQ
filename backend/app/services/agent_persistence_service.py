from __future__ import annotations

import json
import re
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.agent_execution_repository import AgentExecutionRepository
from app.db.repositories.budget_repository import BudgetRepository
from app.db.repositories.crew_plan_repository import CrewPlanRepository
from app.db.repositories.inspection_repository import InspectionRepository
from app.db.repositories.permit_repository import PermitRepository
from app.db.repositories.project_repository import ProjectRepository
from app.db.repositories.project_supplier_repository import ProjectSupplierRepository
from app.db.repositories.schedule_repository import ScheduleRepository
from app.schemas.agent_execution import AgentExecutionCreate
from app.schemas.budget import BudgetCreate
from app.schemas.crew_plan import CrewPlanCreate
from app.schemas.inspection import InspectionCreate
from app.schemas.permit import PermitCreate
from app.schemas.project import ProjectUpdate
from app.schemas.project_supplier import ProjectSupplierCreate
from app.schemas.schedule import ScheduleCreate
from app.services.agent_field_mapper import normalize_permit_agent
from app.services.logging_service import get_logger

logger = get_logger("AgentPersistenceService")

_MONTH_PATTERN = re.compile(r"month\s*(\d+)", re.IGNORECASE)


def _add_months(start: date, months: int) -> date:
    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    days_in_month = [
        31,
        29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ][month - 1]
    day = min(start.day, days_in_month)
    return date(year, month, day)


def _parse_date(value: Any, *, project_start: date | None = None) -> date | None:
    if value is None or value == "":
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        month_match = _MONTH_PATTERN.search(text)
        if month_match and project_start is not None:
            month_num = int(month_match.group(1))
            return _add_months(project_start, max(month_num - 1, 0))
        try:
            return date.fromisoformat(text[:10])
        except ValueError:
            pass
        for fmt in ("%d %B %Y", "%d %b %Y", "%B %d, %Y", "%b %d, %Y"):
            try:
                return datetime.strptime(text, fmt).date()
            except ValueError:
                continue
        logger.warning("Skipping row with invalid date: %s", value)
        return None
    return None


def _parse_int(value: Any) -> int | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        try:
            return int(float(text))
        except ValueError:
            logger.warning("Skipping row with invalid integer: %s", value)
            return None
    try:
        return int(value)
    except (TypeError, ValueError):
        logger.warning("Skipping row with invalid integer: %s", value)
        return None


def _parse_decimal(value: Any) -> Decimal | None:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float, Decimal)):
        return Decimal(str(value))
    if isinstance(value, str):
        cleaned = value.strip().replace(",", "").replace("$", "").replace("₹", "").strip()
        lower = cleaned.lower()
        word_multipliers = {
            "crores": Decimal("10000000"),
            "crore": Decimal("10000000"),
            "lakhs": Decimal("100000"),
            "lakh": Decimal("100000"),
            "lacs": Decimal("100000"),
            "lac": Decimal("100000"),
        }
        for word, multiplier in sorted(word_multipliers.items(), key=lambda x: -len(x[0])):
            if word in lower:
                number_part = re.sub(rf"\b{word}\b", "", lower, flags=re.IGNORECASE).strip()
                try:
                    return Decimal(number_part) * multiplier
                except (InvalidOperation, ValueError):
                    continue
        suffix_multipliers = {"k": 1_000, "m": 1_000_000, "b": 1_000_000_000}
        if cleaned and cleaned[-1].lower() in suffix_multipliers:
            try:
                return Decimal(cleaned[:-1]) * suffix_multipliers[cleaned[-1].lower()]
            except (InvalidOperation, ValueError):
                pass
        try:
            return Decimal(cleaned)
        except (InvalidOperation, ValueError):
            logger.warning("Skipping row with invalid decimal: %s", value)
            return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        logger.warning("Skipping row with invalid decimal: %s", value)
        return None


def _json_dumps(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return json.dumps(value)


def _extract_permits(permit_data: dict[str, Any]) -> list[dict[str, Any]]:
    normalized = normalize_permit_agent(permit_data)
    items = normalized.get("required_permits")
    if isinstance(items, list):
        return [i for i in items if isinstance(i, dict)]
    return []


async def persist_supplier_and_crew_outputs(
    session: AsyncSession,
    project_id: int,
    supplier_data: dict[str, Any],
    crew_data: dict[str, Any],
    *,
    project_start: date | None = None,
) -> dict[str, int]:
    project_repo = ProjectRepository(session)
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found.",
        )

    start = project_start or project.start_date
    supplier_repo = ProjectSupplierRepository(session)
    crew_repo = CrewPlanRepository(session)

    deleted_suppliers = await supplier_repo.delete_by_project(project_id)
    deleted_crew = await crew_repo.delete_by_project(project_id)

    created_suppliers = 0
    for row in supplier_data.get("procurement_plan", []) or []:
        if not isinstance(row, dict):
            continue
        material_name = row.get("material_name")
        supplier_name = row.get("supplier_name")
        if not material_name and not supplier_name:
            logger.warning("Skipping procurement row with no material or supplier name")
            continue

        await supplier_repo.create(
            ProjectSupplierCreate(
                project_id=project_id,
                material_name=material_name,
                supplier_name=supplier_name,
                quantity=_parse_decimal(row.get("quantity")),
                unit_price=_parse_decimal(row.get("unit_price")),
                delivery_date=_parse_date(row.get("delivery_date"), project_start=start),
                total_cost=_parse_decimal(row.get("total_cost")),
            )
        )
        created_suppliers += 1

    created_crew = 0
    for row in crew_data.get("crew_allocations", []) or []:
        if not isinstance(row, dict):
            continue
        phase_name = row.get("phase_name")
        crew_name = row.get("crew_name") or row.get("employee_name")
        if not phase_name and not crew_name:
            logger.warning("Skipping crew allocation row with no phase or crew name")
            continue

        await crew_repo.create(
            CrewPlanCreate(
                project_id=project_id,
                phase_name=phase_name,
                crew_name=crew_name,
                labor_cost=_parse_decimal(row.get("labor_cost")),
                start_date=_parse_date(row.get("start_date"), project_start=start),
                end_date=_parse_date(row.get("end_date"), project_start=start),
            )
        )
        created_crew += 1

    return {
        "project_suppliers_created": created_suppliers,
        "crew_plans_created": created_crew,
        "project_suppliers_deleted": deleted_suppliers,
        "crew_plans_deleted": deleted_crew,
    }


async def persist_analysis_outputs(
    session: AsyncSession,
    project_id: int,
    pipeline_result: dict[str, Any],
    *,
    execution_records: list[dict[str, Any]] | None = None,
) -> dict[str, int]:
    """Replace-on-rerun persistence for all pipeline-derived tables."""
    project_repo = ProjectRepository(session)
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found.",
        )

    summary = pipeline_result.get("projectSummary") or {}
    permit_data = pipeline_result.get("permitAssessment") or {}
    plan_data = pipeline_result.get("projectPlan") or {}
    supplier_data = pipeline_result.get("supplierAnalysis") or {}
    crew_data = pipeline_result.get("crewAnalysis") or {}

    def _non_empty_str(val: Any) -> str | None:
        if isinstance(val, str) and val.strip():
            return val.strip()
        return None

    update_payload: dict[str, Any] = {}
    if name := _non_empty_str(summary.get("project_name")):
        update_payload["project_name"] = name
    if client := _non_empty_str(summary.get("client_name")):
        update_payload["client_name"] = client
    if budget := _parse_decimal(summary.get("budget")):
        update_payload["contract_value"] = budget
    if months := _parse_int(summary.get("duration_months")):
        update_payload["duration_months"] = months
    if scope := _non_empty_str(summary.get("scope")):
        update_payload["scope"] = scope
    milestones = summary.get("milestones")
    if milestones:
        update_payload["milestones"] = _json_dumps(milestones)
    if location := _non_empty_str(summary.get("location")):
        update_payload["location"] = location
    if project_type := _non_empty_str(summary.get("project_type")):
        update_payload["project_type"] = project_type
    if start := _parse_date(summary.get("start_date")):
        update_payload["start_date"] = start
    if completion := _parse_date(summary.get("target_completion_date")):
        update_payload["target_completion_date"] = completion
    if sqft := _parse_decimal(summary.get("square_footage")):
        update_payload["square_footage"] = sqft
    if floors := _parse_int(summary.get("floor_count") or summary.get("floors")):
        update_payload["floor_count"] = floors
    if complexity := _non_empty_str(
        summary.get("complexity_level") or summary.get("complexity")
    ):
        update_payload["complexity_level"] = complexity

    if update_payload:
        await project_repo.update(project, ProjectUpdate(**update_payload))

    permit_repo = PermitRepository(session)
    schedule_repo = ScheduleRepository(session)
    budget_repo = BudgetRepository(session)
    inspection_repo = InspectionRepository(session)
    execution_repo = AgentExecutionRepository(session)

    deleted_permits = await permit_repo.delete_by_project(project_id)
    deleted_schedules = await schedule_repo.delete_by_project(project_id)
    deleted_budgets = await budget_repo.delete_by_project(project_id)
    deleted_inspections = await inspection_repo.delete_by_project(project_id)

    created_permits = 0
    for item in _extract_permits(permit_data):
        name = item.get("name") or item.get("permit_name")
        await permit_repo.create(
            PermitCreate(
                project_id=project_id,
                permit_name=name,
                permit_category=item.get("category") or item.get("permit_category"),
                status=item.get("status"),
                estimated_approval_days=item.get("estimated_days")
                or item.get("estimated_approval_days"),
                required_documents=_json_dumps(
                    item.get("documents") or item.get("required_documents")
                ),
                critical_path_impact=item.get("critical_path_impact"),
            )
        )
        created_permits += 1

    created_schedules = 0
    duration_days = plan_data.get("estimated_duration_days") or plan_data.get(
        "total_duration_days"
    )
    phase_breakdown = plan_data.get("project_phases") or plan_data.get("phases")
    work_packages = plan_data.get("dependencies") or plan_data.get("materials")
    await schedule_repo.create(
        ScheduleCreate(
            project_id=project_id,
            total_duration_days=duration_days,
            phase_breakdown=_json_dumps(phase_breakdown),
            work_packages=_json_dumps(work_packages),
        )
    )
    created_schedules = 1

    material_cost = Decimal("0")
    for row in supplier_data.get("procurement_plan", []) or []:
        if isinstance(row, dict):
            cost = _parse_decimal(row.get("total_cost"))
            if cost is not None:
                material_cost += cost

    labor_cost = Decimal("0")
    for row in crew_data.get("crew_allocations", []) or []:
        if isinstance(row, dict):
            cost = _parse_decimal(row.get("labor_cost"))
            if cost is not None:
                labor_cost += cost

    total_budget = _parse_decimal(summary.get("budget"))
    await budget_repo.create(
        BudgetCreate(
            project_id=project_id,
            total_budget=total_budget,
            material_cost=material_cost if material_cost else None,
            labor_cost=labor_cost if labor_cost else None,
        )
    )
    created_budgets = 1

    created_inspections = 0
    for stage in plan_data.get("inspection_stages", []) or []:
        if isinstance(stage, str):
            await inspection_repo.create(
                InspectionCreate(
                    project_id=project_id,
                    inspection_name=stage,
                    inspection_phase=stage,
                    status="planned",
                )
            )
            created_inspections += 1
        elif isinstance(stage, dict):
            await inspection_repo.create(
                InspectionCreate(
                    project_id=project_id,
                    inspection_name=stage.get("name") or stage.get("inspection_name"),
                    inspection_phase=stage.get("phase_name")
                    or stage.get("scheduled_phase")
                    or stage.get("phase"),
                    status=stage.get("status") or "planned",
                )
            )
            created_inspections += 1

    supplier_crew_summary = await persist_supplier_and_crew_outputs(
        session,
        project_id,
        supplier_data,
        crew_data,
        project_start=project.start_date,
    )

    created_executions = 0
    for record in execution_records or []:
        started = record.get("started_at")
        completed = record.get("completed_at")
        duration_seconds = None
        if isinstance(started, datetime) and isinstance(completed, datetime):
            duration_seconds = int((completed - started).total_seconds())

        await execution_repo.create(
            AgentExecutionCreate(
                project_id=project_id,
                agent_name=record.get("agent_name"),
                agent_version=record.get("agent_version"),
                status=record.get("status") or "complete",
                started_at=started,
                completed_at=completed,
                duration_seconds=duration_seconds,
                output_json=_json_dumps(record.get("output")),
            )
        )
        created_executions += 1

    await session.commit()

    summary_counts = {
        "permits_created": created_permits,
        "permits_deleted": deleted_permits,
        "schedules_created": created_schedules,
        "schedules_deleted": deleted_schedules,
        "budgets_created": created_budgets,
        "budgets_deleted": deleted_budgets,
        "inspections_created": created_inspections,
        "inspections_deleted": deleted_inspections,
        "agent_executions_created": created_executions,
        **supplier_crew_summary,
    }
    logger.info("Persisted analysis outputs for project %s: %s", project_id, summary_counts)
    return summary_counts
