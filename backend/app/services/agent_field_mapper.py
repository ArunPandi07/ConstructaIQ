from __future__ import annotations

from typing import Any

AGENT_CONTRACT = "ContractAgent"
AGENT_BLUEPRINT = "BlueprintAgent"
AGENT_PERMIT = "PermitAgent"
AGENT_PLANNING = "ScheduleAgent"
AGENT_SUPPLIER = "SupplierAgent"
AGENT_CREW = "CrewAgent"

PROCUREMENT_ROW_ALIASES: dict[str, tuple[str, ...]] = {
    "material_name": (
        "material_name",
        "MaterialName",
        "material",
        "item_name",
        "name",
    ),
    "supplier_name": (
        "supplier_name",
        "SupplierName",
        "vendor",
        "supplier",
        "Vendor",
    ),
    "quantity": ("quantity", "Quantity", "qty", "Qty"),
    "unit_price": ("unit_price", "UnitPrice", "unit_cost", "UnitCost", "price"),
    "delivery_date": (
        "delivery_date",
        "DeliveryDate",
        "delivery",
        "expected_delivery",
    ),
    "total_cost": ("total_cost", "TotalCost", "cost", "total"),
}

CONTRACT_FIELD_ALIASES: dict[str, tuple[str, ...]] = {
    "project_name": ("project_name", "ProjectName"),
    "client_name": ("client_name", "ClientName", "client", "Client"),
    "budget": ("budget", "Budget", "budget_usd", "BudgetUSD"),
    "project_type": (
        "project_type",
        "Projecttype",
        "ProjectType",
        "projecttype",
        "building_type",
        "BuildingType",
        "type",
    ),
    "location": ("location", "Location"),
    "start_date": ("start_date", "startdate", "StartDate", "startDate"),
    "target_completion_date": (
        "target_completion_date",
        "targetCompletionDate",
        "completiondate",
        "CompletionDate",
        "completion_date",
        "Completiondate",
    ),
    "duration_months": (
        "duration_months",
        "DurationMonths",
        "durationMonths",
        "schedule_months",
        "schedule_duration_months",
        "ScheduleMonths",
    ),
    "scope": ("scope", "Scope"),
    "milestones": ("milestones", "Milestones"),
    "square_footage": (
        "square_footage",
        "SquareFootage",
        "squarefootage",
        "gross_square_feet",
        "gross_square_footage",
        "GrossSquareFeet",
    ),
    "floor_count": (
        "floor_count",
        "floors",
        "Floors",
        "FloorCount",
        "number_of_floors",
        "NumberOfFloors",
    ),
    "complexity_level": ("complexity_level", "complexity", "Complexity", "ComplexityLevel"),
}

BLUEPRINT_PRESERVED_KEYS: tuple[str, ...] = (
    "building_definition",
    "buildingDefinition",
    "facade",
    "stories_above_grade",
    "construction_type",
    "structural_steel_tons",
    "concrete_cy",
    "curtain_wall_sf",
    "lateral_system",
    "mep_highlights",
    "building_features",
    "likely_structural_details",
)

BLUEPRINT_FIELD_ALIASES: dict[str, tuple[str, ...]] = {
    "project_name": ("project_name", "ProjectName"),
    "client_name": ("client_name", "ClientName", "client", "Client"),
    "budget": ("budget", "Budget", "budget_usd", "BudgetUSD"),
    "project_type": ("project_type", "type", "building_type", "BuildingType"),
    "location": ("location", "Location"),
    "duration_months": ("duration_months", "schedule_months", "ScheduleMonths"),
    "square_footage": (
        "square_footage",
        "gross_square_footage",
        "gross_square_feet",
        "GrossSquareFeet",
    ),
    "floor_count": ("floor_count", "floors", "Floors", "number_of_floors"),
}

PROJECT_SUMMARY_FIELDS = (
    "project_name",
    "client_name",
    "budget",
    "duration_months",
    "scope",
    "milestones",
    "location",
    "project_type",
    "start_date",
    "target_completion_date",
    "square_footage",
    "floor_count",
    "complexity_level",
)

NESTED_PAYLOAD_KEYS: tuple[str, ...] = (
    "project_summary",
    "extracted_parameters",
    "extracted_fields",
    "extracted_data",
    "contract_details",
    "project_details",
    "parameters",
    "fields",
    "data",
    "result",
    "output",
    "response",
    "supplier_analysis",
    "supplierAnalysis",
    "crew_analysis",
    "crewAnalysis",
)

SUPPLY_RISK_TITLE_KEYS: tuple[str, ...] = (
    "risk",
    "title",
    "name",
    "description",
    "issue",
    "material",
    "risk_name",
    "risk_description",
    "supplier_name",
)

SUPPLY_RISK_DETAIL_KEYS: tuple[str, ...] = (
    "mitigation",
    "detail",
    "impact",
    "rationale",
    "recommendation",
    "notes",
)

WORKFORCE_ROLE_KEYS: tuple[str, ...] = (
    "role",
    "title",
    "trade",
    "skill",
    "position",
    "skill_type",
    "crew_role",
    "job_title",
    "name",
)

WORKFORCE_SHORTAGE_KEYS: tuple[str, ...] = (
    "shortage",
    "gap",
    "detail",
    "description",
    "impact",
    "count_needed",
    "headcount_gap",
    "workers_needed",
)


def _is_empty(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and not value.strip():
        return True
    if isinstance(value, (list, dict)) and len(value) == 0:
        return True
    return False


def _build_key_index(data: dict[str, Any]) -> dict[str, Any]:
    return {str(k).lower(): v for k, v in data.items()}


def _first_present(data: dict[str, Any], *keys: str) -> Any:
    """Return the first non-empty value for any alias (case-insensitive)."""
    index = _build_key_index(data)
    for key in keys:
        value = index.get(key.lower())
        if not _is_empty(value):
            return value
    return None


def _flatten_agent_payload(data: dict[str, Any]) -> dict[str, Any]:
    """Promote fields from common nested agent wrapper objects to the top level."""
    flat: dict[str, Any] = dict(data)
    index = _build_key_index(data)

    for wrapper_key in NESTED_PAYLOAD_KEYS:
        nested = index.get(wrapper_key.lower())
        if not isinstance(nested, dict):
            continue
        for key, value in nested.items():
            existing = index.get(str(key).lower())
            if existing is None or _is_empty(existing):
                flat[key] = value

    return flat


def _normalize_fields(
    data: dict[str, Any],
    aliases: dict[str, tuple[str, ...]],
) -> dict[str, Any]:
    if not isinstance(data, dict):
        return {}

    data = _flatten_agent_payload(data)
    result: dict[str, Any] = {}
    for canonical, field_aliases in aliases.items():
        if canonical == "milestones":
            raw = _first_present(data, *field_aliases)
            milestones = _normalize_milestones(raw)
            if milestones:
                result["milestones"] = milestones
            continue

        value = _first_present(data, *field_aliases)
        if _is_empty(value):
            continue
        if isinstance(value, str):
            value = value.strip()
        result[canonical] = value

    return result


def _normalize_milestone_item(item: Any) -> dict[str, Any] | None:
    if isinstance(item, str):
        text = item.strip()
        return {"name": text, "duration": ""} if text else None
    if not isinstance(item, dict):
        return None
    name = _first_present(item, "name", "Milestone", "milestone", "title")
    duration = _first_present(item, "duration", "Duration", "timeline", "Timeline")
    if _is_empty(name) and _is_empty(duration):
        return None
    return {
        "name": name or "",
        "duration": duration or "",
        **{k: v for k, v in item.items() if k not in ("name", "duration")},
    }


def _normalize_milestones(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    normalized: list[dict[str, Any]] = []
    for item in value:
        row = _normalize_milestone_item(item)
        if row:
            normalized.append(row)
    return normalized


def _merge_normalized_fields(
    primary: dict[str, Any],
    fallback: dict[str, Any],
) -> dict[str, Any]:
    merged = dict(fallback)
    for key, value in primary.items():
        if not _is_empty(value):
            merged[key] = value
    return merged


def normalize_contract_agent(data: dict[str, Any]) -> dict[str, Any]:
    """Map ContractAgent output keys to canonical snake_case."""
    return _normalize_fields(data, CONTRACT_FIELD_ALIASES)


def normalize_blueprint_agent(data: dict[str, Any]) -> dict[str, Any]:
    """Map BlueprintAgent output keys to canonical snake_case."""
    flat = _flatten_agent_payload(data)
    result = _normalize_fields(data, BLUEPRINT_FIELD_ALIASES)

    for key in BLUEPRINT_PRESERVED_KEYS:
        value = _first_present(flat, key)
        if not _is_empty(value):
            result[key] = value

    building_definition = result.get("building_definition") or result.get("buildingDefinition")
    if isinstance(building_definition, dict):
        result["building_definition"] = building_definition
        result.pop("buildingDefinition", None)

    return result


def _normalize_permit_item(
    item: Any,
    *,
    default_approval_days: Any = None,
    default_documents: Any = None,
) -> dict[str, Any] | None:
    if isinstance(item, str):
        text = item.strip()
        if not text:
            return None
        row: dict[str, Any] = {"name": text, "status": "required"}
        if default_approval_days is not None:
            row["estimated_approval_days"] = default_approval_days
        if default_documents is not None:
            row["required_documents"] = default_documents
        return row

    if not isinstance(item, dict):
        return None

    name = _first_present(item, "name", "permit_name", "permitName", "title")
    if _is_empty(name):
        return None

    row = {
        "name": name,
        "status": _first_present(item, "status") or "required",
        "category": _first_present(item, "category", "permit_category", "permitCategory"),
        "estimated_approval_days": _first_present(
            item,
            "estimated_approval_days",
            "estimated_days",
            "approval_days",
            "estimatedApprovalDays",
        )
        or default_approval_days,
        "critical_path_impact": _first_present(
            item, "critical_path_impact", "criticalPathImpact"
        ),
        "required_documents": _first_present(
            item, "required_documents", "documents", "requiredDocuments"
        )
        or default_documents,
    }
    return {k: v for k, v in row.items() if not _is_empty(v)}


def _normalize_risk_severity(value: Any, *, default: str = "medium") -> str:
    if isinstance(value, str) and value.strip():
        return value.strip().lower()
    return default


def normalize_supply_chain_risk_rows(items: Any) -> list[dict[str, Any]]:
    """Coerce SupplierAgent risk items to {title, detail, severity}."""
    if items is None:
        return []
    if not isinstance(items, list):
        items = [items]

    rows: list[dict[str, Any]] = []
    for item in items:
        if isinstance(item, str):
            text = item.strip()
            if text:
                rows.append({"title": text, "detail": None, "severity": "medium"})
            continue
        if not isinstance(item, dict):
            continue

        title = _first_present(item, *SUPPLY_RISK_TITLE_KEYS)
        detail = _first_present(item, *SUPPLY_RISK_DETAIL_KEYS)
        if _is_empty(title):
            continue
        title_str = str(title).strip()
        if detail and str(detail).strip() == title_str:
            detail = None
        rows.append(
            {
                "title": title_str,
                "detail": str(detail).strip() if detail else None,
                "severity": _normalize_risk_severity(item.get("severity")),
            }
        )
    return rows


def normalize_workforce_gap_rows(items: Any) -> list[dict[str, Any]]:
    """Coerce CrewAgent gap items to {role, shortage, severity}."""
    if items is None:
        return []
    if not isinstance(items, list):
        items = [items]

    rows: list[dict[str, Any]] = []
    for item in items:
        if isinstance(item, str):
            text = item.strip()
            if text:
                rows.append({"role": text, "shortage": None, "severity": "medium"})
            continue
        if not isinstance(item, dict):
            continue

        role = _first_present(item, *WORKFORCE_ROLE_KEYS)
        if _is_empty(role):
            continue
        shortage = _first_present(item, *WORKFORCE_SHORTAGE_KEYS)
        severity = _normalize_risk_severity(item.get("severity"))
        if shortage and "critical" in str(shortage).lower() and severity == "medium":
            severity = "high"
        rows.append(
            {
                "role": str(role).strip(),
                "shortage": str(shortage).strip() if shortage else None,
                "severity": severity,
            }
        )
    return rows


def _normalize_procurement_row(row: Any) -> dict[str, Any] | None:
    if isinstance(row, str):
        text = row.strip()
        return {"material_name": text} if text else None
    if not isinstance(row, dict):
        return None

    normalized: dict[str, Any] = {}
    for canonical, aliases in PROCUREMENT_ROW_ALIASES.items():
        value = _first_present(row, *aliases)
        if not _is_empty(value):
            normalized[canonical] = value

    if not normalized.get("material_name") and not normalized.get("supplier_name"):
        return None
    return normalized


def normalize_supplier_agent(data: dict[str, Any]) -> dict[str, Any]:
    """Normalize SupplierAgent output; map procurement_plan field aliases."""
    if not isinstance(data, dict):
        return {}

    flat = _flatten_agent_payload(data)
    result: dict[str, Any] = {}

    procurement_raw = _first_present(
        flat,
        "procurement_plan",
        "ProcurementPlan",
        "procurement",
        "procurement_items",
    )
    if isinstance(procurement_raw, list):
        normalized_rows: list[dict[str, Any]] = []
        for item in procurement_raw:
            row = _normalize_procurement_row(item)
            if row:
                normalized_rows.append(row)
        if normalized_rows:
            result["procurement_plan"] = normalized_rows

    # supply_chain_risks — use _first_present for case-insensitive camelCase matching
    supply_risks = _first_present(
        flat,
        "supply_chain_risks",
        "supplyChainRisks",
        "supply_risks",
        "supplyRisks",
        "chain_risks",
        "risks",
        "procurement_risks",
        "procurementRisks",
    )
    if not _is_empty(supply_risks):
        normalized_risks = normalize_supply_chain_risk_rows(supply_risks)
        if normalized_risks:
            result["supply_chain_risks"] = normalized_risks

    for key in (
        "recommended_suppliers",
        "supply_chain_recommendations",
        "procurement_recommendations",
    ):
        value = _first_present(flat, key, "".join(w.capitalize() if i else w for i, w in enumerate(key.split("_"))))
        if not _is_empty(value):
            result[key] = value

    return result


def normalize_permit_agent(data: dict[str, Any]) -> dict[str, Any]:
    """Normalize PermitAgent output; coerce string permits to dict rows."""
    if not isinstance(data, dict):
        return {}

    flat = _flatten_agent_payload(data)
    approval_days = _first_present(
        flat, "approval_days", "estimated_approval_days", "total_approval_days"
    )
    default_documents = flat.get("required_documents")

    permits_raw = None
    for key in ("required_permits", "permits", "permit_list"):
        value = flat.get(key)
        if isinstance(value, list) and value:
            permits_raw = value
            break

    normalized_permits: list[dict[str, Any]] = []
    if permits_raw:
        for item in permits_raw:
            row = _normalize_permit_item(
                item,
                default_approval_days=approval_days,
                default_documents=default_documents,
            )
            if row:
                normalized_permits.append(row)

    result: dict[str, Any] = {}
    if normalized_permits:
        result["required_permits"] = normalized_permits
    if approval_days is not None:
        result["approval_days"] = approval_days
    for key in ("compliance_risks", "required_documents"):
        value = flat.get(key)
        if not _is_empty(value):
            result[key] = value

    return result


SCHEDULE_MATERIAL_ROW_ALIASES: dict[str, tuple[str, ...]] = {
    "material_name": PROCUREMENT_ROW_ALIASES["material_name"],
    "quantity": PROCUREMENT_ROW_ALIASES["quantity"],
    "unit": ("unit", "Unit", "uom", "UOM"),
    "unit_price": PROCUREMENT_ROW_ALIASES["unit_price"],
    "total_cost": PROCUREMENT_ROW_ALIASES["total_cost"],
    "category": ("category", "material_category", "type", "Category"),
}


def normalize_schedule_material_row(row: Any) -> dict[str, Any] | None:
    if isinstance(row, str):
        text = row.strip()
        return {"material_name": text, "name": text} if text else None
    if not isinstance(row, dict):
        return None

    normalized: dict[str, Any] = {}
    for canonical, aliases in SCHEDULE_MATERIAL_ROW_ALIASES.items():
        value = _first_present(row, *aliases)
        if not _is_empty(value):
            normalized[canonical] = value

    material_name = normalized.get("material_name")
    if _is_empty(material_name):
        return None

    normalized["name"] = material_name
    return normalized


def normalize_schedule_agent(data: dict[str, Any]) -> dict[str, Any]:
    """Normalize ScheduleAgent output keys to canonical snake_case."""
    if not isinstance(data, dict):
        return {}

    flat = _flatten_agent_payload(data)
    result = dict(flat)

    # Phases — accept project_phases, projectPhases, schedule_phases, schedulePhases
    if _is_empty(result.get("phases")) and _is_empty(result.get("project_phases")):
        phases = _first_present(result, "projectPhases", "schedule_phases", "schedulePhases")
        if phases:
            result["phases"] = phases

    # Duration — accept camelCase and various names
    if _is_empty(result.get("estimated_duration_days")):
        dur = _first_present(
            result,
            "total_duration_days",
            "total_estimated_duration_days",
            "totalDurationDays",
            "duration_days",
            "durationDays",
            "estimated_duration",
            "estimatedDuration",
            "project_duration_days",
        )
        if dur is not None:
            result["estimated_duration_days"] = dur

    # Resolve phases list to extract nested materials, inspections, and dependencies
    phases_list = result.get("project_phases") or result.get("phases") or []
    wp_id_to_name = {}
    if isinstance(phases_list, list):
        for phase in phases_list:
            if isinstance(phase, dict):
                wps = phase.get("work_packages") or phase.get("workPackages") or []
                if isinstance(wps, list):
                    for wp in wps:
                        if isinstance(wp, dict) and wp.get("id") and wp.get("name"):
                            wp_id_to_name[wp["id"]] = wp["name"]

    # Extract materials
    top_materials = result.get("materials") or []
    if not isinstance(top_materials, list):
        top_materials = []
    if isinstance(phases_list, list):
        for phase in phases_list:
            if isinstance(phase, dict):
                phase_name = phase.get("phase_name") or phase.get("name") or "General"
                wps = phase.get("work_packages") or phase.get("workPackages") or []
                if isinstance(wps, list):
                    for wp in wps:
                        if isinstance(wp, dict):
                            wp_mats = wp.get("materials") or wp.get("material_list") or []
                            if isinstance(wp_mats, list):
                                wp_name = wp.get("name") or phase_name
                                for m in wp_mats:
                                    if isinstance(m, str) and m.strip():
                                        if not any(x.get("name") == m.strip() for x in top_materials if isinstance(x, dict)):
                                            normalized = normalize_schedule_material_row(m.strip())
                                            if normalized:
                                                normalized.setdefault("category", wp_name)
                                                top_materials.append(normalized)
                                    elif isinstance(m, dict):
                                        normalized = normalize_schedule_material_row(m)
                                        if normalized:
                                            normalized.setdefault("category", wp_name)
                                            top_materials.append(normalized)
                direct_mats = phase.get("materials") or []
                if isinstance(direct_mats, list):
                    for m in direct_mats:
                        if isinstance(m, str) and m.strip():
                            if not any(x.get("name") == m.strip() for x in top_materials if isinstance(x, dict)):
                                normalized = normalize_schedule_material_row(m.strip())
                                if normalized:
                                    normalized.setdefault("category", phase_name)
                                    top_materials.append(normalized)
                        elif isinstance(m, dict):
                            normalized = normalize_schedule_material_row(m)
                            if normalized:
                                normalized.setdefault("category", phase_name)
                                top_materials.append(normalized)
    normalized_top: list[dict[str, Any]] = []
    for item in top_materials:
        if isinstance(item, dict):
            row = normalize_schedule_material_row(item)
            if row:
                if not row.get("category"):
                    row.setdefault("category", "General")
                normalized_top.append(row)
        elif isinstance(item, str):
            row = normalize_schedule_material_row(item)
            if row:
                row.setdefault("category", "General")
                normalized_top.append(row)
    result["materials"] = normalized_top

    # Extract inspections
    top_inspections = result.get("inspection_stages") or result.get("inspections") or []
    if not isinstance(top_inspections, list):
        top_inspections = []
    if isinstance(phases_list, list):
        for phase in phases_list:
            if isinstance(phase, dict):
                phase_name = phase.get("phase_name") or phase.get("name") or "General"
                wps = phase.get("work_packages") or phase.get("workPackages") or []
                if isinstance(wps, list):
                    for wp in wps:
                        if isinstance(wp, dict):
                            wp_insps = wp.get("inspection_stages") or wp.get("inspections") or []
                            if isinstance(wp_insps, list):
                                wp_name = wp.get("name") or phase_name
                                for insp in wp_insps:
                                    if isinstance(insp, str) and insp.strip():
                                        if not any(x.get("name") == insp.strip() for x in top_inspections if isinstance(x, dict)):
                                            top_inspections.append({"name": insp.strip(), "phase_name": wp_name})
                                    elif isinstance(insp, dict):
                                        top_inspections.append(insp)
                direct_insps = phase.get("inspections") or []
                if isinstance(direct_insps, list):
                    for insp in direct_insps:
                        if isinstance(insp, str) and insp.strip():
                            if not any(x.get("name") == insp.strip() for x in top_inspections if isinstance(x, dict)):
                                top_inspections.append({"name": insp.strip(), "phase_name": phase_name})
                        elif isinstance(insp, dict):
                            top_inspections.append(insp)
    result["inspection_stages"] = top_inspections

    # Extract dependency graph
    structured_deps = []
    if isinstance(phases_list, list):
        for phase in phases_list:
            if isinstance(phase, dict):
                wps = phase.get("work_packages") or phase.get("workPackages") or []
                if isinstance(wps, list):
                    for wp in wps:
                        if isinstance(wp, dict) and wp.get("id") and wp.get("dependencies"):
                            successor_name = wp.get("name")
                            for pred_id in wp["dependencies"]:
                                pred_name = wp_id_to_name.get(pred_id)
                                if pred_name and successor_name:
                                    structured_deps.append({
                                        "predecessor": pred_name,
                                        "successor": successor_name
                                    })

    # Parse textual top-level dependencies if structured list is empty
    raw_deps = result.get("dependencies")
    if isinstance(raw_deps, list):
        for dep in raw_deps:
            if isinstance(dep, str):
                parsed = False
                for separator in (" must be complete before ", " must precede ", " must be approved before ", " before ", " precede ", " -> ", "->"):
                    if separator in dep:
                        parts = dep.split(separator, 1)
                        if len(parts) == 2:
                            structured_deps.append(
                                {
                                    "predecessor": parts[0].strip(),
                                    "successor": parts[1].strip(),
                                }
                            )
                            parsed = True
                            break
                if not parsed:
                    structured_deps.append({"predecessor": dep, "successor": ""})
            elif isinstance(dep, dict):
                structured_deps.append(dep)

    result["dependencies"] = structured_deps
    return result


def normalize_crew_agent(data: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(data, dict):
        return {}
    flat = _flatten_agent_payload(data)
    result = dict(flat)
    if _is_empty(result.get("crew_allocations")):
        allocs = _first_present(
            result,
            "crew_plan",
            "crewAllocations",
            "team_assignments",
            "teamAssignments",
            "allocations",
            "crew_assignments",
            "crewAssignments",
        )
        if allocs:
            result["crew_allocations"] = allocs
    if _is_empty(result.get("workforce_gaps")):
        gaps = _first_present(
            result,
            "workforceGaps",
            "workforce_gap",
            "workforceGap",
            "skill_gaps",
            "skillGaps",
            "staffing_gaps",
            "staffingGaps",
            "labor_gaps",
            "laborGaps",
        )
        if gaps:
            result["workforce_gaps"] = normalize_workforce_gap_rows(gaps)
    elif not _is_empty(result.get("workforce_gaps")):
        result["workforce_gaps"] = normalize_workforce_gap_rows(result["workforce_gaps"])
    return result


def build_project_summary(
    contract_data: dict[str, Any],
    *,
    blueprint_data: dict[str, Any] | None = None,
    fallback_project_name: str = "",
) -> dict[str, Any]:
    """Build projectSummary; contract wins, blueprint fills gaps."""
    contract = normalize_contract_agent(contract_data)
    blueprint = normalize_blueprint_agent(blueprint_data or {})
    normalized = _merge_normalized_fields(contract, blueprint)

    return {
        "project_name": normalized.get("project_name") or fallback_project_name,
        "client_name": normalized.get("client_name"),
        "budget": normalized.get("budget"),
        "duration_months": normalized.get("duration_months"),
        "scope": normalized.get("scope"),
        "milestones": normalized.get("milestones", []),
        "location": normalized.get("location"),
        "project_type": normalized.get("project_type"),
        "start_date": normalized.get("start_date"),
        "target_completion_date": normalized.get("target_completion_date"),
        "square_footage": normalized.get("square_footage"),
        "floor_count": normalized.get("floor_count"),
        "complexity_level": normalized.get("complexity_level"),
    }


def normalize_agent_output(agent_name: str, data: dict[str, Any]) -> dict[str, Any]:
    """Extensible entry point for per-agent field normalization."""
    if agent_name == AGENT_CONTRACT:
        return normalize_contract_agent(data)
    if agent_name == AGENT_BLUEPRINT:
        return normalize_blueprint_agent(data)
    if agent_name == AGENT_PERMIT:
        return normalize_permit_agent(data)
    if agent_name == AGENT_PLANNING:
        return normalize_schedule_agent(data)
    if agent_name == AGENT_SUPPLIER:
        return normalize_supplier_agent(data)
    if agent_name == AGENT_CREW:
        return normalize_crew_agent(data)
    return data if isinstance(data, dict) else {}
