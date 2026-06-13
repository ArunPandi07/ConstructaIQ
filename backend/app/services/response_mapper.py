from __future__ import annotations

import json
from datetime import date
from decimal import Decimal
from typing import Any

from app.db.models.agent_execution import AgentExecution
from app.db.models.budget import Budget
from app.db.models.crew_plan import CrewPlan
from app.db.models.inspection import Inspection
from app.db.models.permit import Permit
from app.db.models.project import Project
from app.db.models.project_risk import ProjectRisk
from app.db.models.schedule import Schedule
from app.services.building_templates import (
    generate_building_definition,
    is_building_definition_sufficient,
    patch_building_definition_footprint,
)
from app.services.project_metadata_extractor import enrich_project_metadata
from app.services.analyze_job_service import AnalyzeJob
from app.services.critical_path_service import (
    compute_critical_path_phases,
    mark_critical_phases,
)
from app.services.material_matcher import best_material_match, normalize_material_label
from app.services.readiness_service import compute_readiness
from app.services.work_packages_parser import parse_work_packages


def _format_currency(value: Decimal | None) -> str:
    if value is None:
        return "N/A"
    return f"${value:,.0f}"


def _format_square_footage(value: Decimal | int | float | None) -> str:
    if value is None:
        return "N/A"
    try:
        return f"{int(value):,}"
    except (TypeError, ValueError):
        return str(value)


def _format_date(value: date | None) -> str:
    if value is None:
        return ""
    return value.isoformat()


def _to_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(str(value).replace("$", "").replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def _parse_json_field(value: str | None) -> Any:
    if not value:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


def _phase_date(item: dict[str, Any], *keys: str) -> str:
    for key in keys:
        val = item.get(key)
        if val is not None and str(val).strip():
            return str(val)
    return ""


def _extract_blueprint_summary(execution: AgentExecution | None) -> dict[str, Any] | None:
    if execution is None or not execution.output_json:
        return None
    raw = _parse_json_field(execution.output_json)
    if not isinstance(raw, dict):
        return None
    keys = (
        "construction_type",
        "stories_above_grade",
        "structural_steel_tons",
        "concrete_cy",
        "curtain_wall_sf",
        "lateral_system",
        "mep_highlights",
        "building_features",
        "likely_structural_details",
    )
    summary = {k: raw[k] for k in keys if k in raw}
    return summary or raw


def _extract_building_definition(
    execution: AgentExecution | None,
    project: Project,
) -> dict[str, Any] | None:
    raw: dict[str, Any] = {}
    existing: dict[str, Any] | None = None
    if execution is not None and execution.output_json:
        parsed = _parse_json_field(execution.output_json)
        if isinstance(parsed, dict):
            raw = parsed
            candidate = parsed.get("building_definition") or parsed.get("buildingDefinition")
            if is_building_definition_sufficient(candidate):
                existing = candidate

    project_summary = {
        "project_name": project.project_name,
        "project_type": project.project_type,
        "scope": project.scope,
        "square_footage": project.square_footage,
        "floor_count": project.floor_count,
        "complexity_level": project.complexity_level,
    }
    enriched_contract, enriched_blueprint = enrich_project_metadata(
        project_summary,
        raw,
    )
    merged_footprint = enriched_contract.get("footprint")
    if isinstance(merged_footprint, dict) and existing is not None:
        patched = patch_building_definition_footprint(existing, merged_footprint)
        return patched

    generated = generate_building_definition(enriched_blueprint, enriched_contract)
    return generated if generated.get("building") else None


def _map_risk_item(risk: ProjectRisk) -> dict[str, Any]:
    return {
        "id": risk.risk_id,
        "title": risk.title or "Unknown",
        "severity": (risk.severity or "medium").title(),
        "detail": risk.detail or "",
        "status": risk.status or "open",
        "sourceAgent": risk.source_agent or "",
        "category": risk.category or "",
    }


def _as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _recommendation_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float, bool)):
        return str(value)
    try:
        return json.dumps(value, default=str)
    except TypeError:
        return str(value)


def _recommendation_priority(item: Any) -> str:
    if not isinstance(item, dict):
        return "Medium"
    raw = (
        item.get("priority")
        or item.get("severity")
        or item.get("impact")
        or item.get("risk_level")
    )
    normalized = str(raw or "").strip().lower()
    if normalized in {"critical", "very high", "high"}:
        return "High"
    if normalized in {"low", "minor"}:
        return "Low"
    return "Medium"


def _recommendation_title(item: Any, fallback: str) -> str:
    if isinstance(item, dict):
        for key in (
            "title",
            "recommendation",
            "risk",
            "role",
            "name",
            "supplier_name",
            "document",
            "permit_name",
        ):
            value = item.get(key)
            if value:
                return str(value)
    text = _recommendation_text(item)
    return text[:80] if text else fallback


def _recommendation_description(item: Any, title: str = "") -> str:
    if isinstance(item, dict):
        for key in (
            "description",
            "detail",
            "mitigation",
            "rationale",
            "shortage",
            "status",
        ):
            value = item.get(key)
            if value:
                return _recommendation_text(value)

        title_keys = (
            "title",
            "recommendation",
            "risk",
            "role",
            "name",
            "supplier_name",
            "document",
            "permit_name",
        )
        if title:
            sole_value = next(
                (str(item.get(k)) for k in title_keys if item.get(k)),
                "",
            )
            if sole_value == title and len(item) <= 2:
                return ""

        extra = {
            key: value
            for key, value in item.items()
            if value is not None
            and str(value).strip()
            and str(value) != title
            and key not in title_keys
        }
        if extra:
            return _recommendation_text(extra)
        return ""
    text = _recommendation_text(item)
    return "" if text == title else text


def _extract_recommendations(
    executions: list[AgentExecution] | None,
) -> list[dict[str, Any]]:
    key_categories = {
        "recommendations": "General",
        "recommended_actions": "General",
        "next_steps": "General",
        "recommended_suppliers": "Supply Chain",
        "supply_chain_recommendations": "Supply Chain",
        "procurement_recommendations": "Supply Chain",
        "supply_chain_risks": "Supply Chain",
        "crew_recommendations": "Workforce",
        "workforce_recommendations": "Workforce",
        "workforce_gaps": "Workforce",
        "compliance_recommendations": "Compliance",
        "compliance_risks": "Compliance",
        "required_documents": "Documents",
        "inspection_stages": "Inspection",
    }

    recommendations: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str, str]] = set()
    next_id = 1

    for execution in executions or []:
        raw = _parse_json_field(execution.output_json)
        if not isinstance(raw, dict):
            continue
        source_agent = execution.agent_name or "Agent"
        for key, category in key_categories.items():
            for item in _as_list(raw.get(key)):
                title = _recommendation_title(item, key.replace("_", " ").title())
                description = _recommendation_description(item, title)
                if not title and not description:
                    continue
                fingerprint = (source_agent, category, title, description)
                if fingerprint in seen:
                    continue
                seen.add(fingerprint)
                recommendations.append(
                    {
                        "id": next_id,
                        "sourceAgent": source_agent,
                        "agentVersion": execution.agent_version or "",
                        "category": category,
                        "title": title,
                        "description": description,
                        "priority": _recommendation_priority(item),
                        "status": "new",
                    }
                )
                next_id += 1

    return recommendations


def map_permit_status(status: str | None) -> str:
    if not status:
        return "Not Started"
    normalized = status.strip().lower().replace("_", " ")
    mapping = {
        "approved": "Approved",
        "pending": "Pending",
        "in review": "In Review",
        "not started": "Not Started",
    }
    return mapping.get(normalized, status)


def map_project_intelligence(
    project: Project,
    permits: list[Permit],
    schedules: list[Schedule],
    crew_plans: list[CrewPlan],
    *,
    budgets: list[Budget] | None = None,
    inspections: list[Inspection] | None = None,
    risks: list[ProjectRisk] | None = None,
    executions: list[AgentExecution] | None = None,
    suppliers: list[Any] | None = None,
    blueprint_execution: AgentExecution | None = None,
) -> dict[str, Any]:
    phases_raw: list[Any] = []
    work_packages_raw: str | None = None
    if schedules:
        phases_raw = _parse_json_field(schedules[0].phase_breakdown) or []
        work_packages_raw = schedules[0].work_packages

    wp = parse_work_packages(work_packages_raw)
    dependencies = wp["dependencies"]
    materials = wp["materials"]

    required_permits = [
        {
            "name": p.permit_name or "Unknown",
            "status": map_permit_status(p.status),
            "date": "",
        }
        for p in permits
    ]

    crew_by_phase: dict[str, int] = {}
    for cp in crew_plans:
        phase = cp.phase_name or "General"
        crew_by_phase[phase] = crew_by_phase.get(phase, 0) + 1

    crew_requirements = [
        {"role": phase, "count": count, "status": "Assigned"}
        for phase, count in crew_by_phase.items()
    ]

    phases: list[dict[str, Any]] = []
    phase_names: list[str] = []
    if isinstance(phases_raw, list):
        for item in phases_raw:
            if isinstance(item, dict):
                name = item.get("name") or item.get("phase_name") or "Phase"
                phase_names.append(str(name))
                phases.append(
                    {
                        "name": name,
                        "status": item.get("status") or "pending",
                        "startDate": _phase_date(
                            item, "start_date", "startDate", "start"
                        ),
                        "endDate": _phase_date(item, "end_date", "endDate", "end"),
                        "progress": item.get("progress") or 0,
                        "isCritical": False,
                    }
                )
            elif isinstance(item, str):
                phase_names.append(item)
                phases.append(
                    {
                        "name": item,
                        "status": "pending",
                        "startDate": "",
                        "endDate": "",
                        "progress": 0,
                        "isCritical": False,
                    }
                )

    critical_path_phases = compute_critical_path_phases(dependencies, phase_names)
    phases = mark_critical_phases(phases, critical_path_phases)

    duration = (
        f"{project.duration_months} months"
        if project.duration_months
        else (
            f"{schedules[0].total_duration_days} days"
            if schedules and schedules[0].total_duration_days
            else "N/A"
        )
    )

    budget_breakdown: dict[str, Any] | None = None
    if budgets:
        latest = budgets[-1]
        budget_breakdown = {
            "total": _format_currency(latest.total_budget),
            "material": _format_currency(latest.material_cost),
            "labor": _format_currency(latest.labor_cost),
            "equipment": _format_currency(latest.equipment_cost),
            "contingency": _format_currency(latest.contingency_cost),
            "totalRaw": float(latest.total_budget or 0),
            "materialRaw": float(latest.material_cost or 0),
            "laborRaw": float(latest.labor_cost or 0),
            "equipmentRaw": float(latest.equipment_cost or 0),
            "contingencyRaw": float(latest.contingency_cost or 0),
        }

    inspection_items = [
        {
            "name": i.inspection_name or "Inspection",
            "phase": i.inspection_phase or "",
            "status": i.status or "planned",
            "date": _format_date(i.inspection_date),
        }
        for i in (inspections or [])
    ]

    risk_list = risks or []
    supply_chain_risks = [
        _map_risk_item(r) for r in risk_list if (r.category or "") == "supply_chain"
    ]
    workforce_gaps = [
        _map_risk_item(r) for r in risk_list if (r.category or "") == "workforce"
    ]

    blueprint_summary = _extract_blueprint_summary(blueprint_execution)
    building_definition = _extract_building_definition(blueprint_execution, project)

    readiness = compute_readiness(
        executions=executions or [],
        permits=permits,
        schedules=schedules,
        suppliers=suppliers or [],
        crew_plans=crew_plans,
        risks=risk_list,
        budgets=budgets,
    )

    mapped_dependencies = []
    for dep in dependencies:
        if isinstance(dep, dict):
            mapped_dependencies.append(
                {
                    "predecessor": dep.get("predecessor")
                    or dep.get("from")
                    or "",
                    "successor": dep.get("successor") or dep.get("to") or "",
                }
            )

    mapped_materials = []
    supplier_rows = suppliers or []
    supplier_candidates = [
        (
            getattr(row, "supplier_record_id", None) or getattr(row, "id", None),
            getattr(row, "material_name", None) or "",
        )
        for row in supplier_rows
    ]
    supplier_names = [
        name for _, name in supplier_candidates if name and str(name).strip()
    ]

    for mat in materials:
        if isinstance(mat, dict):
            unit_cost = (
                mat.get("unit_cost")
                or mat.get("unit_price")
                or mat.get("price")
            )
            total_cost = mat.get("total_cost")
            material_name = (
                mat.get("material_name") or mat.get("name") or "Material"
            )
            supplier_record_id = None
            norm_name = normalize_material_label(str(material_name))
            for record_id, supplier_material in supplier_candidates:
                if not supplier_material:
                    continue
                if normalize_material_label(str(supplier_material)) == norm_name:
                    supplier_record_id = record_id
                    break
            if supplier_record_id is None and supplier_names:
                match = best_material_match(str(material_name), supplier_names)
                if match:
                    for record_id, supplier_material in supplier_candidates:
                        if supplier_material == match[0]:
                            supplier_record_id = record_id
                            break

            row_payload: dict[str, Any] = {
                "name": material_name,
                "materialName": material_name,
                "category": mat.get("category")
                or mat.get("material_category")
                or mat.get("type")
                or "General",
                "quantity": mat.get("quantity"),
                "unit": mat.get("unit") or "",
                "unitCost": _to_float(unit_cost),
                "totalCost": _to_float(total_cost),
            }
            if supplier_record_id is not None:
                row_payload["supplierRecordId"] = supplier_record_id
            mapped_materials.append(row_payload)
        elif isinstance(mat, str):
            mapped_materials.append(
                {
                    "name": mat,
                    "materialName": mat,
                    "category": "General",
                    "quantity": None,
                    "unit": "",
                    "unitCost": None,
                    "totalCost": None,
                }
            )

    return {
        "name": project.project_name,
        "projectId": str(project.project_id),
        "client": project.client_name or "N/A",
        "location": project.location or "N/A",
        "budget": _format_currency(project.contract_value),
        "duration": duration,
        "startDate": _format_date(project.start_date),
        "endDate": _format_date(project.target_completion_date),
        "floors": project.floor_count or 0,
        "complexity": project.complexity_level or "Medium",
        "type": project.project_type or "Commercial",
        "squareFootage": _format_square_footage(project.square_footage),
        "requiredPermits": required_permits,
        "crewRequirements": crew_requirements,
        "phases": phases,
        "budgetBreakdown": budget_breakdown,
        "dependencies": mapped_dependencies,
        "materials": mapped_materials,
        "criticalPathPhases": critical_path_phases,
        "inspections": inspection_items,
        "supplyChainRisks": supply_chain_risks,
        "workforceGaps": workforce_gaps,
        "blueprintSummary": blueprint_summary,
        "buildingDefinition": building_definition,
        "readiness": readiness,
        "recommendations": _extract_recommendations(executions),
    }


def map_upload_session(job: AnalyzeJob) -> dict[str, Any]:
    return {
        "sessionId": job.job_id,
        "projectId": str(job.project_id),
        "status": job.frontend_status,
        "agentSteps": job.agent_steps,
        "overallPct": job.overall_pct,
    }
