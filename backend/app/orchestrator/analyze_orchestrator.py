import json
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.agent_field_mapper import (
    build_project_summary,
    normalize_blueprint_agent,
    normalize_contract_agent,
    normalize_permit_agent,
    normalize_supplier_agent,
)
from app.services.agent_persistence_service import persist_analysis_outputs
from app.services.blob_storage_service import blob_storage_service
from app.services.building_templates import (
    generate_building_definition,
    is_building_definition_sufficient,
)
from app.services.document_intelligence import document_intelligence_service
from app.services.foundry_service import foundry_service
from app.services.logging_service import get_logger
from app.services.master_catalog_service import load_catalogs
from app.services.project_metadata_extractor import enrich_project_metadata

logger = get_logger("AnalyzeOrchestrator")

JSON_OUTPUT_SUFFIX = (
    "\n\nRespond with valid JSON only. No markdown, no prose, no code fences."
)

BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS = """

Also include a key named building_definition. It must be a structured JSON object
for a lightweight 3D architectural viewer. Use metric units and derive values
from drawing notes, dimensions, elevations, room labels, schedules, and sheet text.
If exact geometry is not visible, provide architecturally plausible approximate
coordinates that preserve the footprint, floor count, room types, cores, doors,
windows, stairs, and facade pattern from the source drawings.

building_definition schema:
{
  "building": {
    "type": "residential_tower | office_tower | hospital | mixed_use | warehouse",
    "stories": number,
    "totalHeight_m": number,
    "footprint": {"width_m": number, "depth_m": number},
    "construction_type": string,
    "roof_type": "flat | pitched | sawtooth"
  },
  "levels": [
    {
      "level": number,
      "name": string,
      "height_m": number,
      "floorplate": {"width_m": number, "depth_m": number},
      "rooms": [
        {
          "id": string,
          "name": string,
          "type": string,
          "height_m": number,
          "polygon": [{"x": number, "y": number}]
        }
      ],
      "walls": [
        {
          "id": string,
          "start": {"x": number, "y": number},
          "end": {"x": number, "y": number},
          "thickness_m": number,
          "type": "exterior | interior | core | partition",
          "material": string,
          "openings": [
            {
              "id": string,
              "type": "door | window | loading_bay",
              "offset_m": number,
              "width_m": number,
              "height_m": number,
              "sill_m": number
            }
          ]
        }
      ],
      "stairs": [
        {
          "id": string,
          "position": {"x": number, "y": number},
          "width_m": number,
          "depth_m": number,
          "direction": "up | down | both"
        }
      ]
    }
  ],
  "facade": {
    "balconies": boolean,
    "balcony_depth_m": number,
    "railing_height_m": number,
    "window_pattern": "grid | strip | punched | industrial",
    "material": string
  }
}
"""

AGENT_CONTRACT = "ContractAgent"
AGENT_BLUEPRINT = "BlueprintAgent"
AGENT_PERMIT = "PermitAgent"
AGENT_PLANNING = "ScheduleAgent"
AGENT_SUPPLIER = "SupplierAgent"
AGENT_CREW = "CrewAgent"

CONTRACT_VERSION = "4"
BLUEPRINT_VERSION = "5"
PERMIT_VERSION = "3"
SCHEDULE_VERSION = "2"
SUPPLIER_VERSION = "3"
CREW_VERSION = "2"

AGENT_VERSIONS: dict[str, str] = {
    AGENT_CONTRACT: CONTRACT_VERSION,
    AGENT_BLUEPRINT: BLUEPRINT_VERSION,
    AGENT_PERMIT: PERMIT_VERSION,
    AGENT_PLANNING: SCHEDULE_VERSION,
    AGENT_SUPPLIER: SUPPLIER_VERSION,
    AGENT_CREW: CREW_VERSION,
}

PIPELINE_AGENTS = frozenset(AGENT_VERSIONS.keys())

ProgressCallback = Callable[[str], None]


def _resolve_version(agent_name: str) -> str:
    try:
        return AGENT_VERSIONS[agent_name]
    except KeyError as exc:
        raise ValueError(f"Unknown pipeline agent: {agent_name}") from exc


def resolve_call_agent_version(agent_name: str, version: str | None) -> str:
    """Resolve version for call-agent; use pipeline map when omitted or 'default'."""
    if agent_name not in PIPELINE_AGENTS:
        raise ValueError(f"Agent '{agent_name}' is not in the active pipeline.")
    if not version or version == "default":
        return _resolve_version(agent_name)
    return version


def _ensure_building_definition(
    blueprint_data: Dict[str, Any],
    project_summary: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """Regenerate building_definition when agent output is insufficient.

    ``project_summary`` should be a merged contract+blueprint summary
    (e.g. from ``build_project_summary`` after metadata enrichment).
    """
    if not isinstance(blueprint_data, dict):
        return {}

    if "buildingDefinition" in blueprint_data and "building_definition" not in blueprint_data:
        blueprint_data["building_definition"] = blueprint_data["buildingDefinition"]

    summary = project_summary or {}
    existing = blueprint_data.get("building_definition")

    if not is_building_definition_sufficient(existing):
        logger.info(
            "BlueprintAgent building_definition missing or insufficient — "
            "regenerating from project metadata."
        )
        blueprint_data["building_definition"] = generate_building_definition(
            blueprint_data,
            summary,
        )

    return blueprint_data


BLUEPRINT_SUMMARY_KEYS: tuple[str, ...] = (
    "construction_type",
    "stories_above_grade",
    "structural_steel_tons",
    "concrete_cy",
    "curtain_wall_sf",
    "lateral_system",
    "mep_highlights",
    "building_features",
    "likely_structural_details",
    "project_name",
    "floor_count",
    "square_footage",
    "footprint",
    "building_type",
    "budget",
)

BUILDING_METADATA_KEYS: tuple[str, ...] = (
    "type",
    "stories",
    "totalHeight_m",
    "footprint",
    "construction_type",
    "roof_type",
)

PLANNING_SUMMARY_KEYS: tuple[str, ...] = (
    "project_phases",
    "estimated_duration_days",
    "materials",
    "crew_requirements",
    "inspection_stages",
    "dependencies",
)


def _slim_building_metadata(building: Any) -> dict[str, Any] | None:
    if not isinstance(building, dict):
        return None
    slim = {
        key: building[key]
        for key in BUILDING_METADATA_KEYS
        if building.get(key) is not None
    }
    return slim or None


def _slim_blueprint_for_agents(blueprint_data: Dict[str, Any]) -> Dict[str, Any]:
    """Metadata-only blueprint payload for Permit/Schedule agents (no 3D geometry)."""
    if not isinstance(blueprint_data, dict):
        return {}

    slim: Dict[str, Any] = {}
    for key in BLUEPRINT_SUMMARY_KEYS:
        value = blueprint_data.get(key)
        if value is not None and value != "":
            slim[key] = value

    building = _slim_building_metadata(blueprint_data.get("building"))
    defn = blueprint_data.get("building_definition") or blueprint_data.get(
        "buildingDefinition"
    )
    if isinstance(defn, dict):
        levels = defn.get("levels")
        if isinstance(levels, list):
            slim["levels_modeled"] = len(levels)
        defn_building = _slim_building_metadata(defn.get("building"))
        if defn_building:
            building = {**(building or {}), **defn_building}

    if building:
        slim["building"] = building

    return slim


def _slim_planning_for_agents(planning_data: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(planning_data, dict):
        return {}
    return {
        key: planning_data[key]
        for key in PLANNING_SUMMARY_KEYS
        if key in planning_data
    }


def _finalize_blueprint_data(
    contract_data: Dict[str, Any],
    blueprint_data: Dict[str, Any],
    project_name: str,
    *,
    contract_text: str | None = None,
    blueprint_text: str | None = None,
    description: str | None = None,
) -> Dict[str, Any]:
    normalized_blueprint = normalize_blueprint_agent(blueprint_data)
    enriched_contract, enriched_blueprint = enrich_project_metadata(
        contract_data,
        normalized_blueprint,
        contract_text=contract_text or None,
        blueprint_text=blueprint_text or None,
    )
    if description and enriched_contract.get("scope") is None:
        enriched_contract["scope"] = description
        enriched_contract, enriched_blueprint = enrich_project_metadata(
            enriched_contract,
            enriched_blueprint,
            contract_text=contract_text or None,
            blueprint_text=blueprint_text or None,
        )

    contract_data.clear()
    contract_data.update(enriched_contract)
    blueprint_data.clear()
    blueprint_data.update(enriched_blueprint)

    merged_summary = build_project_summary(
        contract_data,
        blueprint_data=blueprint_data,
        fallback_project_name=project_name,
    )
    if merged_summary.get("footprint") is None and contract_data.get("footprint") is not None:
        merged_summary["footprint"] = contract_data["footprint"]
    return _ensure_building_definition(blueprint_data, merged_summary)


def _try_parse_json_blob(blob: str) -> Dict[str, Any] | None:
    clean = blob.strip()
    if clean.startswith("```"):
        lines = clean.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        clean = "\n".join(lines).strip()

    try:
        parsed = json.loads(clean)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    start = clean.find("{")
    end = clean.rfind("}")
    if start != -1 and end > start:
        try:
            parsed = json.loads(clean[start : end + 1])
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass

    return None


def _parse_json_safe(text: str, *, agent_name: str | None = None) -> Dict[str, Any]:
    """Strip markdown fences and parse JSON. Falls back to raw_response on failure."""
    parsed = _try_parse_json_blob(text)
    if parsed is not None:
        return parsed

    logger.warning(
        "Could not parse agent JSON%s. Raw text: %s",
        f" from {agent_name}" if agent_name else "",
        text[:300],
    )
    return {"raw_response": text}


async def _call(
    agent_name: str,
    version: str,
    prompt: str,
    *,
    execution_log: list[dict[str, Any]] | None = None,
    progress_callback: ProgressCallback | None = None,
) -> Dict[str, Any]:
    """Call a single Foundry agent by name + version and return parsed JSON."""
    if progress_callback:
        progress_callback(agent_name)

    started_at = datetime.now(timezone.utc)
    logger.info("[Agent] Calling %s v%s", agent_name, version)
    raw = await foundry_service.call_agent_directly(
        text=prompt + JSON_OUTPUT_SUFFIX,
        agent_name=agent_name,
        version=version,
    )
    completed_at = datetime.now(timezone.utc)
    result = _parse_json_safe(raw, agent_name=agent_name)
    if "raw_response" in result and len(result) == 1:
        retry = _try_parse_json_blob(result["raw_response"])
        if retry is not None:
            result = retry
    logger.info("[Agent] %s responded with %s top-level keys", agent_name, len(result))

    if execution_log is not None:
        execution_log.append(
            {
                "agent_name": agent_name,
                "agent_version": version,
                "started_at": started_at,
                "completed_at": completed_at,
                "status": "complete",
                "output": result,
            }
        )

    return result


async def run_pipeline_from_text(
    project_name: str,
    description: str,
    project_id: Optional[int] = None,
    session: Optional[AsyncSession] = None,
    progress_callback: ProgressCallback | None = None,
    execution_log: list[dict[str, Any]] | None = None,
) -> Dict[str, Any]:
    logger.info("[Mode 1 - Text] Starting pipeline for project: %s", project_name)

    base_context = f"Project Name: {project_name}\nDescription: {description}"

    contract_prompt = (
        f"Extract project parameters from the following project description.\n\n"
        f"{base_context}"
    )
    blueprint_prompt = (
        f"Infer building and structural details from the following project description.\n\n"
        f"{base_context}"
        f"{BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS}"
    )
    contract_data = await _call(
        AGENT_CONTRACT,
        _resolve_version(AGENT_CONTRACT),
        contract_prompt,
        execution_log=execution_log,
        progress_callback=progress_callback,
    )
    contract_data = normalize_contract_agent(contract_data)
    contract_data.setdefault("project_name", project_name)

    blueprint_data = await _call(
        AGENT_BLUEPRINT,
        _resolve_version(AGENT_BLUEPRINT),
        blueprint_prompt,
        execution_log=execution_log,
        progress_callback=progress_callback,
    )
    blueprint_data = _finalize_blueprint_data(
        contract_data,
        blueprint_data,
        project_name,
        description=description,
    )

    return await _run_downstream_agents(
        project_name=project_name,
        contract_data=contract_data,
        blueprint_data=blueprint_data,
        project_id=project_id,
        session=session,
        progress_callback=progress_callback,
        execution_log=execution_log,
    )


async def run_pipeline_from_documents(
    project_name: str,
    contract_bytes: Optional[bytes],
    contract_filename: Optional[str],
    blueprint_bytes: Optional[bytes],
    blueprint_filename: Optional[str],
    project_id: Optional[int] = None,
    session: Optional[AsyncSession] = None,
    progress_callback: ProgressCallback | None = None,
    execution_log: list[dict[str, Any]] | None = None,
    *,
    skip_blob_upload: bool = False,
    existing_blob_paths: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    logger.info("[Mode 2 - Documents] Starting pipeline for project: %s", project_name)

    contract_text = ""
    blueprint_text = ""
    stored_documents: Dict[str, str] = dict(existing_blob_paths or {})

    if contract_bytes and contract_filename:
        logger.info("Extracting text from contract: %s", contract_filename)
        if skip_blob_upload:
            contract_text = await document_intelligence_service.extract_text_from_bytes(
                contract_bytes, contract_filename
            )
        elif blob_storage_service.is_enabled:
            blob_result = await blob_storage_service.upload_document(
                project_name, contract_filename, contract_bytes
            )
            stored_documents["contract"] = blob_result.blob_path
            contract_text = await document_intelligence_service.extract_text_from_blob(
                blob_result.blob_url_with_sas, contract_filename
            )
        else:
            contract_text = await document_intelligence_service.extract_text_from_bytes(
                contract_bytes, contract_filename
            )

    if blueprint_bytes and blueprint_filename:
        logger.info("Extracting text from blueprint: %s", blueprint_filename)
        if skip_blob_upload:
            blueprint_text = await document_intelligence_service.extract_text_from_bytes(
                blueprint_bytes, blueprint_filename
            )
        elif blob_storage_service.is_enabled:
            blob_result = await blob_storage_service.upload_document(
                project_name, blueprint_filename, blueprint_bytes
            )
            stored_documents["blueprint"] = blob_result.blob_path
            blueprint_text = await document_intelligence_service.extract_text_from_blob(
                blob_result.blob_url_with_sas, blueprint_filename
            )
        else:
            blueprint_text = await document_intelligence_service.extract_text_from_bytes(
                blueprint_bytes, blueprint_filename
            )

    contract_call = None
    blueprint_call = None
    if contract_text:
        contract_prompt = (
            f"Project Name: {project_name}\n\n"
            f"Extract parameters from this contract document:\n\n{contract_text}"
        )
        contract_call = _call(
            AGENT_CONTRACT,
            _resolve_version(AGENT_CONTRACT),
            contract_prompt,
            execution_log=execution_log,
            progress_callback=progress_callback,
        )
    else:
        logger.info("No contract provided — using project name only for ContractAgent.")
        contract_data = {"project_name": project_name}

    if blueprint_text:
        blueprint_prompt = (
            f"Project Name: {project_name}\n\n"
            f"Analyze blueprint specifications from this document:\n\n{blueprint_text}"
            f"{BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS}"
        )
        blueprint_call = _call(
            AGENT_BLUEPRINT,
            _resolve_version(AGENT_BLUEPRINT),
            blueprint_prompt,
            execution_log=execution_log,
            progress_callback=progress_callback,
        )
    else:
        logger.info("No blueprint provided — using empty blueprint data.")
        blueprint_data = {}

    if contract_call and blueprint_call:
        contract_data = await contract_call
        contract_data = normalize_contract_agent(contract_data)
        contract_data.setdefault("project_name", project_name)
        blueprint_data = await blueprint_call
        blueprint_data = _finalize_blueprint_data(
            contract_data,
            blueprint_data,
            project_name,
            contract_text=contract_text,
            blueprint_text=blueprint_text,
        )
    elif contract_call:
        contract_data = await contract_call
        contract_data = normalize_contract_agent(contract_data)
        contract_data.setdefault("project_name", project_name)
        blueprint_data = _finalize_blueprint_data(
            contract_data,
            blueprint_data,
            project_name,
            contract_text=contract_text,
        )
    elif blueprint_call:
        blueprint_data = await blueprint_call
        contract_data = {"project_name": project_name}
        blueprint_data = _finalize_blueprint_data(
            contract_data,
            blueprint_data,
            project_name,
            blueprint_text=blueprint_text,
        )

    result = await _run_downstream_agents(
        project_name=project_name,
        contract_data=contract_data,
        blueprint_data=blueprint_data,
        project_id=project_id,
        session=session,
        progress_callback=progress_callback,
        execution_log=execution_log,
    )
    if stored_documents:
        result["stored_documents"] = stored_documents
    return result


async def _run_downstream_agents(
    project_name: str,
    contract_data: Dict[str, Any],
    blueprint_data: Dict[str, Any],
    project_id: Optional[int] = None,
    session: Optional[AsyncSession] = None,
    progress_callback: ProgressCallback | None = None,
    execution_log: list[dict[str, Any]] | None = None,
) -> Dict[str, Any]:
    blueprint_for_agents = _slim_blueprint_for_agents(blueprint_data)
    logger.info(
        "Downstream agent blueprint payload: %d chars (full blueprint: %d chars)",
        len(json.dumps(blueprint_for_agents)),
        len(json.dumps(blueprint_data)),
    )

    permit_prompt = (
        f"Assess permit and regulatory requirements for this construction project.\n\n"
        f"Contract Data:\n{json.dumps(contract_data, indent=2)}\n\n"
        f"Blueprint Summary:\n{json.dumps(blueprint_for_agents, indent=2)}"
    )
    permit_data = await _call(
        AGENT_PERMIT,
        _resolve_version(AGENT_PERMIT),
        permit_prompt,
        execution_log=execution_log,
        progress_callback=progress_callback,
    )
    permit_data = normalize_permit_agent(permit_data)
    logger.info("[Pipeline] PermitAgent complete.")

    schedule_prompt = (
        f"Generate a comprehensive project execution plan for this construction project.\n\n"
        f"Your output must include:\n"
        f"- project_phases: list of named phases with start/end timelines\n"
        f"- estimated_duration_days: total estimated project duration in days\n"
        f"- materials: list of required materials with quantities\n"
        f"- crew_requirements: workforce breakdown by trade/role\n"
        f"- inspection_stages: list of mandatory inspection checkpoints\n"
        f"- dependencies: task or phase dependencies\n\n"
        f"Contract Data:\n{json.dumps(contract_data, indent=2)}\n\n"
        f"Blueprint Summary:\n{json.dumps(blueprint_for_agents, indent=2)}\n\n"
        f"Permit Data:\n{json.dumps(permit_data, indent=2)}"
    )
    planning_data = await _call(
        AGENT_PLANNING,
        _resolve_version(AGENT_PLANNING),
        schedule_prompt,
        execution_log=execution_log,
        progress_callback=progress_callback,
    )
    logger.info("[Pipeline] ScheduleAgent complete.")

    planning_for_agents = _slim_planning_for_agents(planning_data)
    supplier_catalog, crew_catalog = await load_catalogs(session)

    schedule_material_names = [
        m.get("material_name") or m.get("name")
        for m in (planning_for_agents.get("materials") or [])
        if isinstance(m, dict)
    ]
    material_name_hint = ""
    if schedule_material_names:
        material_name_hint = (
            "\nUse these exact material_name strings in procurement_plan:\n"
            + json.dumps(schedule_material_names, indent=2)
            + "\n"
        )

    supplier_prompt = (
        f"Match project material requirements to the available supplier catalog and "
        f"produce a procurement plan.\n\n"
        f"Your output must be valid JSON and include:\n"
        f"- procurement_plan: list of objects with material_name, supplier_name, "
        f"quantity, unit_price, delivery_date, total_cost\n"
        f"- supply_chain_risks: list of supply chain risks with severity and mitigation\n"
        f"- recommended_suppliers: list of preferred suppliers with rationale\n"
        f"{material_name_hint}\n"
        f"Planning Data:\n{json.dumps(planning_for_agents, indent=2)}\n\n"
        f"Supplier Catalog:\n{json.dumps(supplier_catalog, indent=2)}"
    )
    crew_prompt = (
        f"Allocate crew members from the workforce catalog to project phases based on "
        f"crew requirements.\n\n"
        f"Your output must be valid JSON and include:\n"
        f"- crew_allocations: list of objects with phase_name, crew_name, skill_type, "
        f"labor_cost, start_date, end_date\n"
        f"- workforce_gaps: list of unfilled roles or shortages\n"
        f"- recommendations: actionable workforce recommendations\n\n"
        f"Planning Data:\n{json.dumps(planning_for_agents, indent=2)}\n\n"
        f"Crew Catalog:\n{json.dumps(crew_catalog, indent=2)}"
    )
    supplier_data = await _call(
        AGENT_SUPPLIER,
        _resolve_version(AGENT_SUPPLIER),
        supplier_prompt,
        execution_log=execution_log,
        progress_callback=progress_callback,
    )
    supplier_data = normalize_supplier_agent(supplier_data)
    logger.info("[Pipeline] SupplierAgent complete.")

    crew_data = await _call(
        AGENT_CREW,
        _resolve_version(AGENT_CREW),
        crew_prompt,
        execution_log=execution_log,
        progress_callback=progress_callback,
    )
    logger.info("[Pipeline] CrewAgent complete.")
    logger.info("[Pipeline] Full pipeline finished for: %s", project_name)

    result: Dict[str, Any] = {
        "projectSummary": build_project_summary(
            contract_data,
            blueprint_data=blueprint_data,
            fallback_project_name=project_name,
        ),
        "blueprintSummary": blueprint_data,
        "permitAssessment": permit_data,
        "projectPlan": planning_data,
        "supplierAnalysis": supplier_data,
        "crewAnalysis": crew_data,
    }

    if project_id is not None and session is not None:
        result["persistenceSummary"] = await persist_analysis_outputs(
            session=session,
            project_id=project_id,
            pipeline_result=result,
            execution_records=execution_log,
        )

    return result
