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
from app.db.repositories.project_risk_repository import ProjectRiskRepository
from app.db.repositories.project_supplier_repository import ProjectSupplierRepository
from app.db.repositories.schedule_repository import ScheduleRepository
from app.schemas.agent_execution import AgentExecutionCreate
from app.schemas.budget import BudgetCreate
from app.schemas.crew_plan import CrewPlanCreate
from app.schemas.inspection import InspectionCreate
from app.schemas.permit import PermitCreate
from app.schemas.project import ProjectUpdate
from app.schemas.project_risk import ProjectRiskCreate
from app.schemas.project_supplier import ProjectSupplierCreate
from app.schemas.schedule import ScheduleCreate
from app.services.agent_field_mapper import (
    normalize_crew_agent,
    normalize_permit_agent,
    normalize_supplier_agent,
    normalize_supply_chain_risk_rows,
    normalize_workforce_gap_rows,
)
from app.services.material_matcher import align_procurement_plan
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


def _to_int(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        try:
            return int(float(value))
        except (ValueError, TypeError):
            return None
    if isinstance(value, dict):
        nums = [v for v in value.values() if isinstance(v, (int, float))]
        return int(max(nums)) if nums else None
    return None


def _to_bool(value: Any) -> bool | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ("true", "yes", "1", "high", "critical")
    if isinstance(value, (int, float)):
        return bool(value)
    return None


def _normalize_severity(value: Any, *, default: str = "medium") -> str:
    if isinstance(value, str) and value.strip():
        return value.strip().lower()
    return default


async def _persist_project_risks(
    risk_repo: ProjectRiskRepository,
    project_id: int,
    supplier_data: dict[str, Any],
    crew_data: dict[str, Any],
    permit_data: dict[str, Any] | None = None,
) -> int:
    created = 0
    normalized_permit = normalize_permit_agent(permit_data or {})
    for item in normalized_permit.get("compliance_risks", []) or []:
        if isinstance(item, str):
            title = item.strip()
            detail = None
            severity = "medium"
        elif isinstance(item, dict):
            title = item.get("risk") or item.get("title") or item.get("name")
            detail = item.get("detail") or item.get("mitigation") or item.get("description")
            severity = _normalize_severity(item.get("severity"))
        else:
            continue
        if not title:
            continue
        await risk_repo.create(
            ProjectRiskCreate(
                project_id=project_id,
                source_agent="PermitAgent",
                category="compliance",
                title=str(title),
                severity=severity,
                detail=str(detail) if detail else None,
                status="open",
            )
        )
        created += 1

    for item in normalize_supply_chain_risk_rows(
        supplier_data.get("supply_chain_risks", []) or []
    ):
        title = item.get("title")
        if not title:
            continue
        await risk_repo.create(
            ProjectRiskCreate(
                project_id=project_id,
                source_agent="SupplierAgent",
                category="supply_chain",
                title=str(title),
                severity=_normalize_severity(item.get("severity")),
                detail=str(item["detail"]) if item.get("detail") else None,
                status="open",
            )
        )
        created += 1

    for item in normalize_workforce_gap_rows(crew_data.get("workforce_gaps", []) or []):
        role = item.get("role")
        if not role:
            continue
        await risk_repo.create(
            ProjectRiskCreate(
                project_id=project_id,
                source_agent="CrewAgent",
                category="workforce",
                title=str(role),
                severity=_normalize_severity(item.get("severity")),
                detail=str(item["shortage"]) if item.get("shortage") else None,
                status="open",
            )
        )
        created += 1

    return created


def _extract_permits(permit_data: dict[str, Any]) -> list[dict[str, Any]]:
    normalized = normalize_permit_agent(permit_data)
    items = normalized.get("required_permits")
    if isinstance(items, list):
        return [i for i in items if isinstance(i, dict)]
    return []


def _extract_schedule_material_names(plan_data: dict[str, Any]) -> list[str]:
    names: list[str] = []
    for material in plan_data.get("materials") or []:
        if isinstance(material, dict):
            name = material.get("material_name") or material.get("name")
            if name and str(name).strip():
                names.append(str(name).strip())
        elif isinstance(material, str) and material.strip():
            names.append(material.strip())
    return names


async def persist_supplier_and_crew_outputs(
    session: AsyncSession,
    project_id: int,
    supplier_data: dict[str, Any],
    crew_data: dict[str, Any],
    *,
    project_start: date | None = None,
    schedule_materials: list[str] | None = None,
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

    # Automatically synchronize crew allocations to ProjectCrewRoster
    from app.db.models.project_crew_roster import ProjectCrewRoster
    from app.db.models.crew_master import CrewMaster
    from sqlalchemy import select, delete
    await session.execute(delete(ProjectCrewRoster).where(ProjectCrewRoster.project_id == project_id))

    res_cm = await session.execute(select(CrewMaster))
    cm_list = res_cm.scalars().all()
    cm_map = {cm.employee_name.lower().strip(): cm for cm in cm_list if cm.employee_name}

    procurement_plan = supplier_data.get("procurement_plan", []) or []
    if schedule_materials:
        procurement_plan = align_procurement_plan(
            procurement_plan,
            schedule_materials,
        )
        supplier_data = dict(supplier_data)
        supplier_data["procurement_plan"] = procurement_plan

    created_suppliers = 0
    for row in procurement_plan:
        if not isinstance(row, dict):
            continue
        material_name = row.get("material_name") or row.get("material")
        supplier_name = row.get("supplier_name") or row.get("supplier")
        if not material_name and not supplier_name:
            logger.warning("Skipping procurement row with no material or supplier name")
            continue

        delivery_raw = row.get("delivery_date") or row.get("delivery_month")
        if isinstance(delivery_raw, int):
            delivery_raw = f"month {delivery_raw}"

        total_cost = row.get("total_cost")
        if total_cost is None:
            qty = row.get("quantity")
            up = row.get("unit_price")
            if qty is not None and up is not None:
                try:
                    total_cost = float(qty) * float(up)
                except (ValueError, TypeError):
                    total_cost = None

        await supplier_repo.create(
            ProjectSupplierCreate(
                project_id=project_id,
                material_name=material_name,
                supplier_name=supplier_name,
                quantity=_parse_decimal(row.get("quantity")),
                unit_price=_parse_decimal(row.get("unit_price")),
                delivery_date=_parse_date(delivery_raw, project_start=start),
                total_cost=_parse_decimal(total_cost),
            )
        )
        created_suppliers += 1

    created_crew = 0
    seen_workers = set()
    for row in crew_data.get("crew_allocations", []) or []:
        if not isinstance(row, dict):
            continue
        phase_name = row.get("phase_name") or row.get("phase")
        crew_name = row.get("crew_name") or row.get("employee_name") or row.get("crew")
        if not phase_name and not crew_name:
            logger.warning("Skipping crew allocation row with no phase or crew name")
            continue

        crew_name = str(crew_name).strip()

        start_raw = row.get("start_date") or row.get("start_month")
        end_raw = row.get("end_date") or row.get("end_month")
        if isinstance(start_raw, int):
            start_raw = f"month {start_raw}"
        if isinstance(end_raw, int):
            end_raw = f"month {end_raw}"

        labor_cost = row.get("labor_cost") or row.get("cost")

        await crew_repo.create(
            CrewPlanCreate(
                project_id=project_id,
                phase_name=phase_name,
                crew_name=crew_name,
                labor_cost=_parse_decimal(labor_cost),
                start_date=_parse_date(start_raw, project_start=start),
                end_date=_parse_date(end_raw, project_start=start),
                headcount=_parse_int(row.get("headcount")),
                skill_type=row.get("skill_type") or row.get("skill"),
            )
        )
        created_crew += 1

        # Roster synchronization
        if crew_name.lower() not in seen_workers:
            seen_workers.add(crew_name.lower())
            cm_obj = cm_map.get(crew_name.lower())
            osha_verified = False
            if cm_obj and cm_obj.certification and "osha" in cm_obj.certification.lower():
                osha_verified = True
            elif cm_obj:
                osha_verified = True
            
            subcontractor = "Apex Builders" if cm_obj else "ConstructaIQ Partners"
            title = row.get("skill_type") or row.get("skill") or (cm_obj.skill_type if cm_obj else "Journeyman")

            session.add(
                ProjectCrewRoster(
                    project_id=project_id,
                    worker_name=crew_name,
                    subcontractor=subcontractor,
                    title=title,
                    osha_verified=osha_verified,
                    is_mobilized=True
                )
            )

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
    run_id: str | None = None,
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
    supplier_data = normalize_supplier_agent(pipeline_result.get("supplierAnalysis") or {})
    crew_data = normalize_crew_agent(pipeline_result.get("crewAnalysis") or {})
    blueprint_summary = pipeline_result.get("blueprintSummary") or {}
    zoning_data = pipeline_result.get("zoningAssessment") or {}
    budget_data = pipeline_result.get("budgetAnalysis") or {}
    safety_data = pipeline_result.get("safetyAssessment") or {}

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

    building_def = blueprint_summary.get("building_definition") or blueprint_summary.get(
        "buildingDefinition"
    )
    if building_def:
        update_payload["building_definition_json"] = _json_dumps(building_def)
    if zoning_data:
        update_payload["zoning_data_json"] = _json_dumps(zoning_data)
    if budget_data:
        update_payload["budget_data_json"] = _json_dumps(budget_data)
    if safety_data:
        update_payload["safety_data_json"] = _json_dumps(safety_data)

    update_payload["status"] = "active"

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
                estimated_approval_days=_to_int(
                    item.get("estimated_days") or item.get("estimated_approval_days")
                ),
                required_documents=_json_dumps(
                    item.get("documents") or item.get("required_documents")
                ),
                critical_path_impact=_to_bool(item.get("critical_path_impact")),
            )
        )
        created_permits += 1

    created_schedules = 0
    duration_days = _to_int(
        plan_data.get("estimated_duration_days") or plan_data.get("total_duration_days")
    )
    phase_breakdown = plan_data.get("project_phases") or plan_data.get("phases")

    top_materials = plan_data.get("materials") or []
    if not top_materials and isinstance(phase_breakdown, list):
        for phase in phase_breakdown:
            if isinstance(phase, dict):
                phase_name = phase.get("phase_name") or phase.get("name") or ""
                wps = phase.get("work_packages") or phase.get("workPackages") or []
                if isinstance(wps, list):
                    for wp in wps:
                        if isinstance(wp, dict):
                            wp_mats = wp.get("materials") or wp.get("material_list") or []
                            if isinstance(wp_mats, list):
                                wp_name = wp.get("name") or phase_name
                                for m in wp_mats:
                                    if isinstance(m, str):
                                        top_materials.append(
                                            {"name": m, "category": wp_name}
                                        )
                                    elif isinstance(m, dict):
                                        top_materials.append(m)
                phase_mats = phase.get("materials", [])
                if isinstance(phase_mats, list):
                    for m in phase_mats:
                        if isinstance(m, str):
                            top_materials.append(
                                {"name": m, "category": phase_name}
                            )
                        elif isinstance(m, dict):
                            top_materials.append(m)

    work_packages = {
        "dependencies": plan_data.get("dependencies") or [],
        "materials": top_materials,
    }
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
            if cost is None:
                qty = _parse_decimal(row.get("quantity"))
                up = _parse_decimal(row.get("unit_price"))
                if qty is not None and up is not None:
                    cost = qty * up
            if cost is not None:
                material_cost += cost

    labor_cost = Decimal("0")
    for row in crew_data.get("crew_allocations", []) or []:
        if isinstance(row, dict):
            cost = _parse_decimal(row.get("labor_cost") or row.get("cost"))
            if cost is not None:
                labor_cost += cost

    cost_breakdown = budget_data.get("cost_breakdown") or {}
    equipment_cost = None
    contingency_cost = None
    if isinstance(cost_breakdown, dict):
        equipment_cost = _parse_decimal(cost_breakdown.get("equipment") or cost_breakdown.get("equipment_cost"))
        contingency_cost = _parse_decimal(cost_breakdown.get("contingency") or cost_breakdown.get("contingency_cost"))

    total_budget = _parse_decimal(summary.get("budget"))
    await budget_repo.create(
        BudgetCreate(
            project_id=project_id,
            total_budget=total_budget,
            material_cost=material_cost if material_cost else None,
            labor_cost=labor_cost if labor_cost else None,
            equipment_cost=equipment_cost if equipment_cost else None,
            contingency_cost=contingency_cost if contingency_cost else None,
        )
    )
    created_budgets = 1

    created_inspections = 0
    inspection_stages = plan_data.get("inspection_stages", []) or []
    if not inspection_stages and isinstance(phase_breakdown, list):
        for phase in phase_breakdown:
            if isinstance(phase, dict):
                phase_name = phase.get("phase_name") or phase.get("name") or ""
                phase_inspections = phase.get("inspections", [])
                if isinstance(phase_inspections, list):
                    for insp in phase_inspections:
                        if isinstance(insp, str):
                            inspection_stages.append(
                                {"name": insp, "phase_name": phase_name}
                            )
                        elif isinstance(insp, dict):
                            if "phase_name" not in insp:
                                insp["phase_name"] = phase_name
                            inspection_stages.append(insp)

    for stage in inspection_stages:
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
            inspection_date = _parse_date(
                stage.get("scheduled_date")
                or stage.get("inspection_date")
                or stage.get("date"),
                project_start=project.start_date,
            )
            await inspection_repo.create(
                InspectionCreate(
                    project_id=project_id,
                    inspection_name=stage.get("name") or stage.get("inspection_name"),
                    inspection_phase=stage.get("phase_name")
                    or stage.get("scheduled_phase")
                    or stage.get("phase"),
                    inspection_date=inspection_date,
                    status=stage.get("status") or "planned",
                )
            )
            created_inspections += 1

    risk_repo = ProjectRiskRepository(session)
    deleted_risks = await risk_repo.delete_by_project(project_id)
    created_risks = await _persist_project_risks(
        risk_repo, project_id, supplier_data, crew_data, permit_data
    )
    if created_risks == 0:
        raw_supplier = pipeline_result.get("supplierAnalysis") or {}
        raw_crew = pipeline_result.get("crewAnalysis") or {}
        has_risk_signals = any(
            raw_supplier.get(key)
            for key in (
                "supply_chain_risks",
                "supplyChainRisks",
                "risks",
                "procurement_risks",
            )
        ) or any(
            raw_crew.get(key)
            for key in (
                "workforce_gaps",
                "workforceGaps",
                "skill_gaps",
                "staffing_gaps",
            )
        )
        if has_risk_signals:
            logger.warning(
                "Project %s: agent output contained risk signals but risks_created=0",
                project_id,
            )

    supplier_crew_summary = await persist_supplier_and_crew_outputs(
        session,
        project_id,
        supplier_data,
        crew_data,
        project_start=project.start_date,
        schedule_materials=_extract_schedule_material_names(plan_data),
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
                run_id=run_id,
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
        "risks_created": created_risks,
        "risks_deleted": deleted_risks,
        "agent_executions_created": created_executions,
        **supplier_crew_summary,
    }
    logger.info("Persisted analysis outputs for project %s: %s", project_id, summary_counts)
    return summary_counts
