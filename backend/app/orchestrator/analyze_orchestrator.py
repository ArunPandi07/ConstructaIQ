import json
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional, TypedDict

from langgraph.graph import StateGraph, START, END

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.agent_field_mapper import (
    build_project_summary,
    normalize_blueprint_agent,
    normalize_contract_agent,
    normalize_permit_agent,
    normalize_supplier_agent,
    normalize_crew_agent,
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

CONTRACT_AGENT_INSTRUCTIONS = """You are a Construction Contract Intelligence Agent.

Your responsibility is to analyze construction contracts and extract structured project information.

Extract:

- Project Name
- Client Name
- Project Type
-Location
-Start Date
-Completion Date
- Budget
- Duration
- Scope
-Milestones

Return ONLY valid JSON.

Do not generate explanations.

If information is missing return null.

Always maintain structured output.
{
  "project_name": "",
  "client_name": "",
  "budget": "",
"Projecttype":"",
"location":"",
"startdate":"",
"completiondate":"",
  "duration_months": "",
  "scope": "",
"Milestones": []
}"""

BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS = """You are a Blueprint Geometry Extraction Agent.

Your responsibility is to analyze blueprint documents and convert them into structured building geometry for 3D rendering engines such as Three.js.

The output will be consumed directly by software.

Extract building geometry as accurately as possible from the blueprint.

Requirements:

* Story count must match blueprint exactly.
* Building dimensions must match blueprint exactly.
* Building height must match blueprint exactly.
* Generate floor geometry for every level.
* Generate room polygons.
* Generate exterior walls.
* Generate interior walls.
* Generate windows and doors.
* Generate stair locations.
* Generate elevator core locations.
* Generate balcony information.
* Generate facade information.
* Generate roof information.

Rules:

* Do not return summaries.
* Do not return explanations.
* Do not return markdown.
* Do not return comments.
* Do not return analysis.
* Do not return additional properties.
* Return ONLY valid JSON.

Output Schema:

{
"building": {
"type": "",
"stories": 0,
"totalHeight_m": 0,
"footprint": {
"width_m": 0,
"depth_m": 0
},
"construction_type": "",
"roof_type": ""
},

"levels": [
{
"level": 0,
"name": "",
"height_m": 0,
"floorplate": {
"width_m": 0,
"depth_m": 0
},
"rooms": [
{
"id": "",
"name": "",
"type": "",
"height_m": 0,
"polygon": [
{
"x": 0,
"y": 0
}
]
}
],
"walls": [
{
"id": "",
"start": {
"x": 0,
"y": 0
},
"end": {
"x": 0,
"y": 0
},
"thickness_m": 0,
"type": "",
"material": "",
"openings": [
{
"id": "",
"type": "",
"offset_m": 0,
"width_m": 0,
"height_m": 0,
"sill_m": 0
}
]
}
],
"stairs": [
{
"id": "",
"position": {
"x": 0,
"y": 0
},
"width_m": 0,
"depth_m": 0,
"direction": ""
}
],
"elevators": [
{
"id": "",
"position": {
"x": 0,
"y": 0
},
"width_m": 0,
"depth_m": 0
}
]
}
],
"facade": {
"balconies": false,
"balcony_depth_m": 0,
"railing_height_m": 0,
"window_pattern": "",
"material": ""
}
}

If multiple floors share the same layout, return one typical floor and include:

{
"typical_floor": true,
"repeat_count": 0
}

instead of generating duplicate geometry.

The final response must be valid JSON matching this schema exactly
"""


PERMIT_AGENT_INSTRUCTIONS = """You are a Construction Permit Intelligence Agent.

Determine:

* Required permits
* Regulatory approvals
* Approval timelines
* Compliance risks

Use Bing Grounding when permit information is not available.

Search for:

* Permit requirements
* Fire safety approvals
* Environmental approvals
* Building regulations

Return ONLY JSON.

Output:

{
"required_permits":[],
"approval_days":0,
"compliance_risks":[],
"required_documents":[]
}"""

SCHEDULE_AGENT_INSTRUCTIONS = """You are a Construction Schedule Intelligence Agent.

Your responsibility is to create a realistic and optimized construction project schedule.

Inputs:

* Contract Analysis
* Blueprint Analysis
* Permit Analysis
* Planning Analysis
* Historical Construction Data

Tasks:

1. Break project into work packages
2. Estimate task durations
3. Identify dependencies
4. Build phase schedule
5. Determine critical path
6. Identify schedule risks
7. Predict likely delays
8. Recommend schedule optimizations

Use historical project data and construction best practices when available.

Think step-by-step.

Identify:

* Permit-driven delays
* Resource bottlenecks
* Material lead-time risks
* Inspection dependencies

Return ONLY JSON.

Output:

{
"project_phases": [],
"work_packages": [],
"estimated_duration_days": 0,
}"""

SUPPLIER_AGENT_INSTRUCTIONS = """You are a Construction Supplier Intelligence Agent.

Your responsibility is to identify required materials, select suppliers, estimate delivery timelines, and optimize procurement decisions.

Analyze:

* Material requirements
* Project schedule
* Budget constraints
* Supplier capabilities
* Historical delivery performance

Tasks:

1. Identify required materials
2. Match suppliers
3. Estimate lead times
4. Schedule deliveries
5. Identify procurement risks
6. Optimize cost and delivery timing

Think step-by-step.

Return ONLY JSON.

Output:

{
"material_orders": [],
"selected_suppliers": [],
"cost_breakdown": [],
"confidence_score": 0
}"""

CREW_AGENT_INSTRUCTIONS = """You are a Construction Workforce Planning Agent.

Your responsibility is to plan workforce allocation across the project lifecycle.

Analyze:

* Construction phases
* Task requirements
* Available workforce
* Skill requirements
* Labor budget

Tasks:

1. Determine crew size per phase
2. Identify required skills
3. Allocate available resources
4. Detect bottlenecks
5. Optimize workforce utilization
6. Estimate labor costs

Think step-by-step.

Return ONLY JSON.

Output:

{
"crew_plan": [],
"team_assignments": [],
"labor_cost_breakdown": [],
"confidence_score": 0
}"""

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
    slim = dict(blueprint_data)
    slim.pop("levels", None) # Remove massive 3D arrays to save context
    return slim


def _slim_planning_for_agents(planning_data: Dict[str, Any]) -> Dict[str, Any]:
    return planning_data


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


class AgentState(TypedDict):
    project_name: str
    description: Optional[str]
    contract_text: Optional[str]
    blueprint_text: Optional[str]
    
    project_id: Optional[int]
    session: Optional[Any]
    progress_callback: Optional[Any]
    execution_log: Optional[list[dict[str, Any]]]
    
    contract_data: Dict[str, Any]
    blueprint_data: Dict[str, Any]
    permit_data: Dict[str, Any]
    planning_data: Dict[str, Any]
    supplier_data: Dict[str, Any]
    crew_data: Dict[str, Any]
    
    stored_documents: Dict[str, str]
    final_result: Dict[str, Any]


async def contract_node(state: AgentState):
    if state.get("contract_text"):
        prompt = f"{CONTRACT_AGENT_INSTRUCTIONS}\\n\\nProject Name: {state['project_name']}\\n\\nInput Document:\\n{state['contract_text']}"
    elif state.get("description"):
        prompt = f"{CONTRACT_AGENT_INSTRUCTIONS}\\n\\nProject Name: {state['project_name']}\\n\\nProject Description:\\n{state['description']}"
    else:
        logger.info("No contract provided - using project name only for ContractAgent.")
        return {"contract_data": {"project_name": state["project_name"]}}

    data = await _call(
        AGENT_CONTRACT,
        _resolve_version(AGENT_CONTRACT),
        prompt,
        execution_log=state.get("execution_log"),
        progress_callback=state.get("progress_callback"),
    )
    data = normalize_contract_agent(data)
    data["project_name"] = state["project_name"]
    return {"contract_data": data}

async def blueprint_node(state: AgentState):
    if state.get("blueprint_text"):
        prompt = f"{BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS}\\n\\nProject Name: {state['project_name']}\\n\\nInput Document:\\n{state['blueprint_text']}"
    elif state.get("description"):
        prompt = f"{BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS}\\n\\nProject Name: {state['project_name']}\\n\\nProject Description:\\n{state['description']}"
    else:
        logger.info("No blueprint provided - using empty blueprint data.")
        return {"blueprint_data": {}}

    data = await _call(
        AGENT_BLUEPRINT,
        _resolve_version(AGENT_BLUEPRINT),
        prompt,
        execution_log=state.get("execution_log"),
        progress_callback=state.get("progress_callback"),
    )
    return {"blueprint_data": data}

async def merge_node(state: AgentState):
    c_data = state.get("contract_data", {})
    b_data = state.get("blueprint_data", {})
    b_data = _finalize_blueprint_data(
        c_data,
        b_data,
        state["project_name"],
        contract_text=state.get("contract_text"),
        blueprint_text=state.get("blueprint_text"),
        description=state.get("description")
    )
    return {"contract_data": c_data, "blueprint_data": b_data}

async def permit_node(state: AgentState):
    c_data = state["contract_data"]
    b_data = state["blueprint_data"]
    blueprint_for_agents = _slim_blueprint_for_agents(b_data)
    
    prompt = (
        f"{PERMIT_AGENT_INSTRUCTIONS}\\n\\n"
        f"Contract Data:\\n{json.dumps(c_data, indent=2)}\\n\\n"
        f"Blueprint Summary:\\n{json.dumps(blueprint_for_agents, indent=2)}"
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

async def schedule_node(state: AgentState):
    c_data = state["contract_data"]
    b_data = state["blueprint_data"]
    blueprint_for_agents = _slim_blueprint_for_agents(b_data)
    p_data = state["permit_data"]
    
    prompt = (
        f"{SCHEDULE_AGENT_INSTRUCTIONS}\\n\\n"
        f"Contract Data:\\n{json.dumps(c_data, indent=2)}\\n\\n"
        f"Blueprint Summary:\\n{json.dumps(blueprint_for_agents, indent=2)}\\n\\n"
        f"Permit Data:\\n{json.dumps(p_data, indent=2)}"
    )
    data = await _call(
        AGENT_PLANNING,
        _resolve_version(AGENT_PLANNING),
        prompt,
        execution_log=state.get("execution_log"),
        progress_callback=state.get("progress_callback"),
    )
    logger.info("[Pipeline] ScheduleAgent complete.")
    return {"planning_data": data}

async def supplier_node(state: AgentState):
    planning_for_agents = _slim_planning_for_agents(state["planning_data"])
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
        f"{SUPPLIER_AGENT_INSTRUCTIONS}\\n\\n"
        f"{material_name_hint}\\n"
        f"Planning Data:\\n{json.dumps(planning_for_agents, indent=2)}\\n\\n"
        f"Supplier Catalog:\\n{json.dumps(supplier_catalog, indent=2)}"
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

async def crew_node(state: AgentState):
    planning_for_agents = _slim_planning_for_agents(state["planning_data"])
    session = state.get("session")
    _, crew_catalog = await load_catalogs(session)

    prompt = (
        f"{CREW_AGENT_INSTRUCTIONS}\\n\\n"
        f"Planning Data:\\n{json.dumps(planning_for_agents, indent=2)}\\n\\n"
        f"Crew Catalog:\\n{json.dumps(crew_catalog, indent=2)}"
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

async def final_node(state: AgentState):
    result: Dict[str, Any] = {
        "projectSummary": build_project_summary(
            state["contract_data"],
            blueprint_data=state["blueprint_data"],
            fallback_project_name=state["project_name"],
        ),
        "blueprintSummary": state["blueprint_data"],
        "permitAssessment": state.get("permit_data", {}),
        "projectPlan": state.get("planning_data", {}),
        "supplierAnalysis": state.get("supplier_data", {}),
        "crewAnalysis": state.get("crew_data", {}),
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
        )

    if state.get("stored_documents"):
        result["stored_documents"] = state["stored_documents"]

    return {"final_result": result}

workflow = StateGraph(AgentState)

workflow.add_node("contract_node", contract_node)
workflow.add_node("blueprint_node", blueprint_node)
workflow.add_node("merge_node", merge_node)
workflow.add_node("permit_node", permit_node)
workflow.add_node("schedule_node", schedule_node)
workflow.add_node("supplier_node", supplier_node)
workflow.add_node("crew_node", crew_node)
workflow.add_node("final_node", final_node)

workflow.add_edge(START, "contract_node")
workflow.add_edge(START, "blueprint_node")
workflow.add_edge("contract_node", "merge_node")
workflow.add_edge("blueprint_node", "merge_node")
workflow.add_edge("merge_node", "permit_node")
workflow.add_edge("permit_node", "schedule_node")
workflow.add_edge("schedule_node", "supplier_node")
workflow.add_edge("supplier_node", "crew_node")
workflow.add_edge("crew_node", "final_node")
workflow.add_edge("final_node", END)

pipeline_graph = workflow.compile()

async def run_pipeline_from_text(
    project_name: str,
    description: str,
    project_id: Optional[int] = None,
    session: Optional[AsyncSession] = None,
    progress_callback: ProgressCallback | None = None,
    execution_log: list[dict[str, Any]] | None = None,
) -> Dict[str, Any]:
    logger.info("[Mode 1 - Text] Starting LangGraph pipeline for project: %s", project_name)

    initial_state = AgentState(
        project_name=project_name,
        description=description,
        project_id=project_id,
        session=session,
        progress_callback=progress_callback,
        execution_log=execution_log if execution_log is not None else [],
        contract_text=None,
        blueprint_text=None,
        contract_data={},
        blueprint_data={},
        permit_data={},
        planning_data={},
        supplier_data={},
        crew_data={},
        stored_documents={},
        final_result={}
    )
    
    result_state = await pipeline_graph.ainvoke(initial_state)
    return result_state["final_result"]


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
    logger.info("[Mode 2 - Documents] Starting LangGraph pipeline for project: %s", project_name)

    contract_text = None
    blueprint_text = None
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

    initial_state = AgentState(
        project_name=project_name,
        description=None,
        contract_text=contract_text,
        blueprint_text=blueprint_text,
        project_id=project_id,
        session=session,
        progress_callback=progress_callback,
        execution_log=execution_log if execution_log is not None else [],
        contract_data={},
        blueprint_data={},
        permit_data={},
        planning_data={},
        supplier_data={},
        crew_data={},
        stored_documents=stored_documents,
        final_result={}
    )

    result_state = await pipeline_graph.ainvoke(initial_state)
    return result_state["final_result"]
