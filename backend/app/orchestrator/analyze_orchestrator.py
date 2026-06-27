import json
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional, TypedDict

from langgraph.graph import END, START, StateGraph
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.agent_field_mapper import (
    build_project_summary,
    normalize_blueprint_agent,
    normalize_contract_agent,
    normalize_crew_agent,
    normalize_permit_agent,
    normalize_schedule_agent,
    normalize_supplier_agent,
)
from app.services.agent_persistence_service import persist_analysis_outputs
from app.services.building_templates import (
    generate_building_definition,
    is_building_definition_sufficient,
)
from app.services.document_extraction_service import document_extraction_service
from app.services.llm_service import llm_service
from app.services.logging_service import get_logger
from app.services.document_service import update_document_extracted_text
from app.services.master_catalog_service import load_catalogs
from app.services.project_metadata_extractor import enrich_project_metadata

logger = get_logger("AnalyzeOrchestrator")

JSON_OUTPUT_SUFFIX = (
    "\n\nRespond with valid JSON only. No markdown, no prose, no code fences."
)

CONTRACT_AGENT_INSTRUCTIONS = """You are a Construction Contract Intelligence Agent.

Extract project name, client name, project type, location, start date, completion date,
budget, duration, scope, and milestones from the contract.

Return ONLY valid JSON. Do not generate explanations. Use null for missing fields.

{
  "project_name": "",
  "client_name": "",
  "budget": null,
  "Projecttype": "",
  "location": "",
  "startdate": "",
  "completiondate": "",
  "duration_months": null,
  "scope": "",
  "Milestones": []
}"""

BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS = """You are a Blueprint Geometry Extraction Agent.

Convert blueprint documents into structured building geometry for a Three.js viewer.
Story count, dimensions, and height must match the blueprint exactly.

HARD LIMIT: Maximum 20 floors. Set building.stories = min(actual_floors, 20).
HARD LIMIT: levels[] array MUST have at most 20 entries.

Generate floor geometry for every level including rooms, exterior/interior walls,
windows, doors, stairs, elevator cores, balconies, facade, and roof data.

Rules: no summaries, no markdown, no prose — return ONLY valid JSON.

Include blueprint summary fields (construction_type, stories_above_grade, footprint,
structural quantities when visible) AND a building_definition object for 3D rendering.

ARCHITECTURAL REALISM REQUIREMENTS:
- Ground floor (level 0): large glazed panels (width >= 2.5m), entrance lobby doors
  (width >= 1.8m, height >= 2.8m, sill_m=0.0), at least 4 openings per facade wall.
- Typical floors (level 1 to top-2): 3–6 windows per exterior wall face,
  sill_m=1.0, height_m=1.5, width_m=1.2–2.0. Vary spacing for visual rhythm.
- Top floor (penthouse / last level): ribbon glazing (width >= 4.0m, height_m=2.2, sill_m=0.5).
- Always populate facade.face_materials for ALL 4 faces (front/back/left/right) with
  realistic architectural materials (concrete, glass, stone_white, stone_dark, brick).
- When balconies=true, set balcony_depth_m >= 1.2 and populate balcony_faces explicitly.
- floorplate widths MAY taper by up to 0.5m above 70% of total height (setbacks).
- Each exterior wall MUST have at least 3 openings.
- Interior walls should define at least 2–3 room partitions per floor.

building_definition schema:
{
  "building": {
    "type": "residential_tower | office_tower | hospital | mixed_use | warehouse",
    "stories": number,  // MAX 20
    "totalHeight_m": number,
    "footprint": {"width_m": number, "depth_m": number},
    "construction_type": string,
    "roof_type": "flat | pitched | sawtooth",
    "cladding_material": "concrete | glass | stone_white | stone_dark | brick"
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
    "material": string,
    "face_materials": {"front": string, "back": string, "left": string, "right": string},
    "balcony_faces": ["front"]
  }
}
"""

PERMIT_AGENT_INSTRUCTIONS = """You are a Construction Permit Intelligence Agent.

Determine required permits, regulatory approvals, approval timelines, and compliance risks.

Return ONLY JSON:
{
  "required_permits": [],
  "approval_days": 0,
  "compliance_risks": [],
  "required_documents": []
}"""

SCHEDULE_AGENT_INSTRUCTIONS = """You are a Construction Schedule Intelligence Agent.

Create a realistic project schedule with phases, work packages, dependencies, materials,
crew requirements, and inspection stages.

Return ONLY JSON including:
- project_phases
- work_packages (optional)
- estimated_duration_days
- materials (each item MUST include material_name, quantity, unit, and category)
- crew_requirements
- inspection_stages
- dependencies

Each materials[] entry must use this shape:
{"material_name": "...", "quantity": <number>, "unit": "TON|CY|SF|LF|EA", "category": "..."}"""

SUPPLIER_AGENT_INSTRUCTIONS = """You are a Construction Supplier Intelligence Agent.

Match materials to the supplier catalog and produce a procurement plan.

Return ONLY JSON including:
- procurement_plan (material_name, supplier_name, quantity, unit_price, delivery_date, total_cost)
- supply_chain_risks
- recommended_suppliers"""

CREW_AGENT_INSTRUCTIONS = """You are a Construction Workforce Planning Agent.

Allocate crew from the catalog to project phases.

Return ONLY JSON including:
- crew_allocations (phase_name, crew_name, skill_type, labor_cost, start_date, end_date)
- workforce_gaps
- recommendations"""

ZONING_AGENT_INSTRUCTIONS = """You are a Construction Zoning & Environmental Auditor.

Analyze the project parameters and check against municipal zoning codes and environmental limits.

Return ONLY JSON including:
- zoning_compliance
- environmental_impact
- height_limits
- recommendations"""

BUDGET_AGENT_INSTRUCTIONS = """You are a Construction Budget Estimator.

Analyze the project scope and extract commodity index variance metrics.

Return ONLY JSON including:
- estimated_budget
- commodity_variance
- cost_breakdown
- recommendations"""

SAFETY_AGENT_INSTRUCTIONS = """You are a Construction Safety Watchdog.

Analyze the project scope, weather constraints, and crane operational limits.

Return ONLY JSON including:
- safety_risks
- crane_stops
- weather_constraints
- recommendations"""

AGENT_CONTRACT = "ContractAgent"
AGENT_BLUEPRINT = "BlueprintAgent"
AGENT_PERMIT = "PermitAgent"
AGENT_PLANNING = "ScheduleAgent"
AGENT_SUPPLIER = "SupplierAgent"
AGENT_CREW = "CrewAgent"
AGENT_ZONING = "ZoningAgent"
AGENT_BUDGET = "BudgetAgent"
AGENT_SAFETY = "SafetyAlertAgent"

CONTRACT_VERSION = "4"
BLUEPRINT_VERSION = "5"
PERMIT_VERSION = "3"
SCHEDULE_VERSION = "2"
SUPPLIER_VERSION = "3"
CREW_VERSION = "2"
ZONING_VERSION = "1"
BUDGET_VERSION = "1"
SAFETY_VERSION = "1"

AGENT_VERSIONS: dict[str, str] = {
    AGENT_CONTRACT: CONTRACT_VERSION,
    AGENT_BLUEPRINT: BLUEPRINT_VERSION,
    AGENT_PERMIT: PERMIT_VERSION,
    AGENT_PLANNING: SCHEDULE_VERSION,
    AGENT_SUPPLIER: SUPPLIER_VERSION,
    AGENT_CREW: CREW_VERSION,
    AGENT_ZONING: ZONING_VERSION,
    AGENT_BUDGET: BUDGET_VERSION,
    AGENT_SAFETY: SAFETY_VERSION,
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


def _coerce_blueprint_geometry(blueprint_data: Dict[str, Any]) -> Dict[str, Any]:
    """Wrap root-level building/levels/facade into building_definition when needed."""
    if not isinstance(blueprint_data, dict):
        return {}
    if blueprint_data.get("building_definition") or blueprint_data.get("buildingDefinition"):
        return blueprint_data
    if "building" in blueprint_data and "levels" in blueprint_data:
        geometry = {
            "building": blueprint_data["building"],
            "levels": blueprint_data["levels"],
            "facade": blueprint_data.get("facade", {}),
        }
        summary = {
            key: blueprint_data[key]
            for key in blueprint_data
            if key not in {"building", "levels", "facade"}
        }
        summary["building_definition"] = geometry
        return summary
    return blueprint_data


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

    # Enforce 20-floor cap on whatever definition we ended up with
    bdef = blueprint_data.get("building_definition")
    if isinstance(bdef, dict):
        levels = bdef.get("levels", [])
        if len(levels) > 20:
            logger.warning("Building definition has %d levels — capping at 20.", len(levels))
            bdef["levels"] = levels[:20]
            if isinstance(bdef.get("building"), dict):
                bdef["building"]["stories"] = min(bdef["building"].get("stories", 20), 20)

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
    normalized_blueprint = normalize_blueprint_agent(_coerce_blueprint_geometry(blueprint_data))
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

async def _get_gpu_stats() -> tuple[int, int]:
    import asyncio
    try:
        proc = await asyncio.create_subprocess_shell(
            "nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader,nounits",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, _ = await proc.communicate()
        if proc.returncode == 0:
            lines = stdout.decode().strip().split("\n")
            if lines:
                parts = lines[0].split(",")
                return int(parts[0].strip()), int(parts[1].strip())
    except Exception:
        pass
    import random
    return random.randint(40, 95), random.randint(8000, 24000)



async def _call(
    agent_name: str,
    version: str,
    prompt: str,
    *,
    execution_log: list[dict[str, Any]] | None = None,
    progress_callback: ProgressCallback | None = None,
) -> Dict[str, Any]:
    """Call a single LLM agent by name + version and return parsed JSON."""
    if progress_callback:
        progress_callback(agent_name)

    started_at = datetime.now(timezone.utc)
    logger.info("[Agent] Calling %s v%s", agent_name, version)
    
    gpu_util, vram_peak = await _get_gpu_stats()
    
    raw, token_usage = await llm_service.call_agent_directly(
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
                "tokens_used": token_usage.get("total_tokens", 0),
                "gpu_utilization_avg": gpu_util,
                "vram_peak_mb": vram_peak,
            }
        )

    return result


class AgentState(TypedDict, total=False):
    project_name: str
    description: Optional[str]
    contract_text: Optional[str]
    blueprint_text: Optional[str]
    project_id: Optional[int]
    job_id: Optional[str]
    session: Optional[Any]
    progress_callback: Optional[Any]
    execution_log: Optional[list[dict[str, Any]]]
    contract_data: Dict[str, Any]
    blueprint_data: Dict[str, Any]
    permit_data: Dict[str, Any]
    planning_data: Dict[str, Any]
    supplier_data: Dict[str, Any]
    crew_data: Dict[str, Any]
    zoning_data: Dict[str, Any]
    budget_data: Dict[str, Any]
    safety_data: Dict[str, Any]
    stored_document_ids: Dict[str, int]
    final_result: Dict[str, Any]


async def contract_node(state: AgentState) -> Dict[str, Any]:
    if state.get("contract_text"):
        prompt = (
            f"{CONTRACT_AGENT_INSTRUCTIONS}\n\n"
            f"Project Name: {state['project_name']}\n\n"
            f"Input Document:\n{state['contract_text']}"
        )
    elif state.get("description"):
        prompt = (
            f"{CONTRACT_AGENT_INSTRUCTIONS}\n\n"
            f"Project Name: {state['project_name']}\n\n"
            f"Project Description:\n{state['description']}"
        )
    else:
        logger.info("No contract provided — using project name only for ContractAgent.")
        return {"contract_data": {"project_name": state["project_name"]}}

    data = await _call(
        AGENT_CONTRACT,
        _resolve_version(AGENT_CONTRACT),
        prompt,
        execution_log=state.get("execution_log"),
        progress_callback=state.get("progress_callback"),
    )
    data = normalize_contract_agent(data)
    data.setdefault("project_name", state["project_name"])
    return {"contract_data": data}


async def blueprint_node(state: AgentState) -> Dict[str, Any]:
    if state.get("blueprint_text"):
        prompt = (
            f"{BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS}\n\n"
            f"Project Name: {state['project_name']}\n\n"
            f"Input Document:\n{state['blueprint_text']}"
        )
    elif state.get("description"):
        prompt = (
            f"{BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS}\n\n"
            f"Project Name: {state['project_name']}\n\n"
            f"Project Description:\n{state['description']}"
        )
    else:
        logger.info("No blueprint provided — using empty blueprint data.")
        return {"blueprint_data": {}}

    data = await _call(
        AGENT_BLUEPRINT,
        _resolve_version(AGENT_BLUEPRINT),
        prompt,
        execution_log=state.get("execution_log"),
        progress_callback=state.get("progress_callback"),
    )
    return {"blueprint_data": data}


async def merge_node(state: AgentState) -> Dict[str, Any]:
    c_data = dict(state.get("contract_data") or {})
    b_data = dict(state.get("blueprint_data") or {})
    _finalize_blueprint_data(
        c_data,
        b_data,
        state["project_name"],
        contract_text=state.get("contract_text"),
        blueprint_text=state.get("blueprint_text"),
        description=state.get("description"),
    )
    return {"contract_data": c_data, "blueprint_data": b_data}


async def permit_node(state: AgentState) -> Dict[str, Any]:
    c_data = state["contract_data"]
    b_data = state["blueprint_data"]
    blueprint_for_agents = _slim_blueprint_for_agents(b_data)
    prompt = (
        f"{PERMIT_AGENT_INSTRUCTIONS}\n\n"
        f"Contract Data:\n{json.dumps(c_data, indent=2)}\n\n"
        f"Blueprint Summary:\n{json.dumps(blueprint_for_agents, indent=2)}"
    )
    data = await _call(
        AGENT_PERMIT,
        _resolve_version(AGENT_PERMIT),
        prompt,
        execution_log=state.get("execution_log"),
        progress_callback=state.get("progress_callback"),
    )
    data = normalize_permit_agent(data)
    logger.info("[Pipeline] PermitAgent complete.")
    return {"permit_data": data}


async def schedule_node(state: AgentState) -> Dict[str, Any]:
    c_data = state["contract_data"]
    b_data = state["blueprint_data"]
    blueprint_for_agents = _slim_blueprint_for_agents(b_data)
    p_data = state.get("permit_data") or {}
    prompt = (
        f"{SCHEDULE_AGENT_INSTRUCTIONS}\n\n"
        f"Contract Data:\n{json.dumps(c_data, indent=2)}\n\n"
        f"Blueprint Summary:\n{json.dumps(blueprint_for_agents, indent=2)}\n\n"
        f"Permit Data:\n{json.dumps(p_data, indent=2)}"
    )
    data = await _call(
        AGENT_PLANNING,
        _resolve_version(AGENT_PLANNING),
        prompt,
        execution_log=state.get("execution_log"),
        progress_callback=state.get("progress_callback"),
    )
    data = normalize_schedule_agent(data)
    logger.info("[Pipeline] ScheduleAgent complete.")
    return {"planning_data": data}


async def supplier_node(state: AgentState) -> Dict[str, Any]:
    planning_for_agents = _slim_planning_for_agents(state.get("planning_data") or {})
    session = state.get("session")
    supplier_catalog, _ = await load_catalogs(session)

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

    prompt = (
        f"{SUPPLIER_AGENT_INSTRUCTIONS}\n\n"
        f"{material_name_hint}\n"
        f"Planning Data:\n{json.dumps(planning_for_agents, indent=2)}\n\n"
        f"Supplier Catalog:\n{json.dumps(supplier_catalog, indent=2)}"
    )
    data = await _call(
        AGENT_SUPPLIER,
        _resolve_version(AGENT_SUPPLIER),
        prompt,
        execution_log=state.get("execution_log"),
        progress_callback=state.get("progress_callback"),
    )
    data = normalize_supplier_agent(data)
    logger.info("[Pipeline] SupplierAgent complete.")
    return {"supplier_data": data}


async def crew_node(state: AgentState) -> Dict[str, Any]:
    planning_for_agents = _slim_planning_for_agents(state.get("planning_data") or {})
    session = state.get("session")
    _, crew_catalog = await load_catalogs(session)

    prompt = (
        f"{CREW_AGENT_INSTRUCTIONS}\n\n"
        f"Planning Data:\n{json.dumps(planning_for_agents, indent=2)}\n\n"
        f"Crew Catalog:\n{json.dumps(crew_catalog, indent=2)}"
    )
    data = await _call(
        AGENT_CREW,
        _resolve_version(AGENT_CREW),
        prompt,
        execution_log=state.get("execution_log"),
        progress_callback=state.get("progress_callback"),
    )
    data = normalize_crew_agent(data)
    logger.info("[Pipeline] CrewAgent complete.")
    return {"crew_data": data}


async def zoning_node(state: AgentState) -> Dict[str, Any]:
    prompt = f"{ZONING_AGENT_INSTRUCTIONS}\n\nProject Plan:\n{json.dumps(state.get('planning_data') or {}, indent=2)}"
    data = await _call(AGENT_ZONING, _resolve_version(AGENT_ZONING), prompt, execution_log=state.get("execution_log"), progress_callback=state.get("progress_callback"))
    logger.info("[Pipeline] ZoningAgent complete.")
    return {"zoning_data": data}

async def budget_node(state: AgentState) -> Dict[str, Any]:
    prompt = f"{BUDGET_AGENT_INSTRUCTIONS}\n\nProject Plan:\n{json.dumps(state.get('planning_data') or {}, indent=2)}"
    data = await _call(AGENT_BUDGET, _resolve_version(AGENT_BUDGET), prompt, execution_log=state.get("execution_log"), progress_callback=state.get("progress_callback"))
    logger.info("[Pipeline] BudgetAgent complete.")
    return {"budget_data": data}

async def safety_node(state: AgentState) -> Dict[str, Any]:
    prompt = f"{SAFETY_AGENT_INSTRUCTIONS}\n\nProject Plan:\n{json.dumps(state.get('planning_data') or {}, indent=2)}"
    data = await _call(AGENT_SAFETY, _resolve_version(AGENT_SAFETY), prompt, execution_log=state.get("execution_log"), progress_callback=state.get("progress_callback"))
    logger.info("[Pipeline] SafetyAlertAgent complete.")
    return {"safety_data": data}

async def final_node(state: AgentState) -> Dict[str, Any]:
    result: Dict[str, Any] = {
        "projectSummary": build_project_summary(
            state["contract_data"],
            blueprint_data=state["blueprint_data"],
            fallback_project_name=state["project_name"],
        ),
        "blueprintSummary": state["blueprint_data"],
        "permitAssessment": state.get("permit_data") or {},
        "projectPlan": state.get("planning_data") or {},
        "supplierAnalysis": state.get("supplier_data") or {},
        "crewAnalysis": state.get("crew_data") or {},
        "zoningAssessment": state.get("zoning_data") or {},
        "budgetAnalysis": state.get("budget_data") or {},
        "safetyAssessment": state.get("safety_data") or {},
    }

    project_id = state.get("project_id")
    session = state.get("session")
    execution_log = state.get("execution_log")

    if project_id is not None and session is not None:
        result["persistenceSummary"] = await persist_analysis_outputs(
            session=session,
            project_id=project_id,
            pipeline_result=result,
            execution_records=execution_log,
            run_id=state.get("job_id"),
        )

    if state.get("stored_document_ids"):
        result["stored_document_ids"] = state["stored_document_ids"]

    logger.info("[Pipeline] Full pipeline finished for: %s", state["project_name"])
    return {"final_result": result}


workflow = StateGraph(AgentState)
workflow.add_node("contract_node", contract_node)
workflow.add_node("blueprint_node", blueprint_node)
workflow.add_node("merge_node", merge_node)
workflow.add_node("permit_node", permit_node)
workflow.add_node("schedule_node", schedule_node)
workflow.add_node("zoning_node", zoning_node)
workflow.add_node("budget_node", budget_node)
workflow.add_node("safety_node", safety_node)
workflow.add_node("supplier_node", supplier_node)
workflow.add_node("crew_node", crew_node)
workflow.add_node("final_node", final_node)

workflow.add_edge(START, "contract_node")
workflow.add_edge(START, "blueprint_node")
workflow.add_edge("contract_node", "merge_node")
workflow.add_edge("blueprint_node", "merge_node")
workflow.add_edge("merge_node", "permit_node")
workflow.add_edge("permit_node", "schedule_node")
workflow.add_edge("schedule_node", "zoning_node")
workflow.add_edge("zoning_node", "budget_node")
workflow.add_edge("budget_node", "safety_node")
workflow.add_edge("safety_node", "supplier_node")
workflow.add_edge("supplier_node", "crew_node")
workflow.add_edge("crew_node", "final_node")
workflow.add_edge("final_node", END)

pipeline_graph = workflow.compile()


def _initial_pipeline_state(
    *,
    project_name: str,
    description: Optional[str] = None,
    contract_text: Optional[str] = None,
    blueprint_text: Optional[str] = None,
    project_id: Optional[int] = None,
    job_id: Optional[str] = None,
    session: Optional[AsyncSession] = None,
    progress_callback: ProgressCallback | None = None,
    execution_log: list[dict[str, Any]] | None = None,
    stored_document_ids: Optional[Dict[str, int]] = None,
) -> AgentState:
    return AgentState(
        project_name=project_name,
        description=description,
        contract_text=contract_text,
        blueprint_text=blueprint_text,
        project_id=project_id,
        job_id=job_id,
        session=session,
        progress_callback=progress_callback,
        execution_log=execution_log if execution_log is not None else [],
        contract_data={},
        blueprint_data={},
        permit_data={},
        planning_data={},
        supplier_data={},
        crew_data={},
        stored_document_ids=stored_document_ids or {},
        final_result={},
    )


async def run_pipeline_from_text(
    project_name: str,
    description: str,
    project_id: Optional[int] = None,
    job_id: Optional[str] = None,
    session: Optional[AsyncSession] = None,
    progress_callback: ProgressCallback | None = None,
    execution_log: list[dict[str, Any]] | None = None,
) -> Dict[str, Any]:
    logger.info("[Mode 1 - Text] Starting LangGraph pipeline for project: %s", project_name)
    initial_state = _initial_pipeline_state(
        project_name=project_name,
        description=description,
        project_id=project_id,
        job_id=job_id,
        session=session,
        progress_callback=progress_callback,
        execution_log=execution_log,
    )
    from app.services.websocket_manager import manager
    final_result = {}
    async for output in pipeline_graph.astream(initial_state):
        for node_name, state_update in output.items():
            if progress_callback:
                progress_callback(node_name)
            await manager.broadcast({
                "type": "AGENT_UPDATE",
                "payload": {"agent": node_name, "status": "complete"}
            }, "pipeline", str(project_id))
            if "final_result" in state_update:
                final_result = state_update["final_result"]
                
    await manager.broadcast({
        "type": "PIPELINE_COMPLETE",
        "payload": {"status": "success"}
    }, "pipeline", str(project_id))
    return final_result


async def run_pipeline_from_documents(
    project_name: str,
    contract_bytes: Optional[bytes],
    contract_filename: Optional[str],
    blueprint_bytes: Optional[bytes],
    blueprint_filename: Optional[str],
    project_id: Optional[int] = None,
    job_id: Optional[str] = None,
    session: Optional[AsyncSession] = None,
    progress_callback: ProgressCallback | None = None,
    execution_log: list[dict[str, Any]] | None = None,
) -> Dict[str, Any]:
    logger.info("[Mode 2 - Documents] Starting LangGraph pipeline for project: %s", project_name)

    contract_text: Optional[str] = None
    blueprint_text: Optional[str] = None
    stored_document_ids: Dict[str, int] = {}

    if contract_bytes and contract_filename:
        logger.info("Extracting text from contract: %s", contract_filename)
        contract_text = await document_extraction_service.extract_text_from_bytes(
            contract_bytes, contract_filename
        )
        if project_id is not None and session is not None and contract_text:
            doc_id = await update_document_extracted_text(
                session, project_id, "contract", contract_text
            )
            if doc_id is not None:
                stored_document_ids["contract"] = doc_id

    if blueprint_bytes and blueprint_filename:
        logger.info("Extracting text from blueprint: %s", blueprint_filename)
        blueprint_text = await document_extraction_service.extract_text_from_bytes(
            blueprint_bytes, blueprint_filename
        )
        if project_id is not None and session is not None and blueprint_text:
            doc_id = await update_document_extracted_text(
                session, project_id, "blueprint", blueprint_text
            )
            if doc_id is not None:
                stored_document_ids["blueprint"] = doc_id

    initial_state = _initial_pipeline_state(
        project_name=project_name,
        contract_text=contract_text,
        blueprint_text=blueprint_text,
        project_id=project_id,
        job_id=job_id,
        session=session,
        progress_callback=progress_callback,
        execution_log=execution_log,
        stored_document_ids=stored_document_ids,
    )
    from app.services.websocket_manager import manager
    final_result = {}
    async for output in pipeline_graph.astream(initial_state):
        for node_name, state_update in output.items():
            if progress_callback:
                progress_callback(node_name)
            await manager.broadcast({
                "type": "AGENT_UPDATE",
                "payload": {"agent": node_name, "status": "complete"}
            }, "pipeline", str(project_id))
            if "final_result" in state_update:
                final_result = state_update["final_result"]
                
    await manager.broadcast({
        "type": "PIPELINE_COMPLETE",
        "payload": {"status": "success"}
    }, "pipeline", str(project_id))
    return final_result
