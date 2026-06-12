import json
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.agent_field_mapper import (
    build_project_summary,
    normalize_contract_agent,
    normalize_permit_agent,
)
from app.services.agent_persistence_service import persist_analysis_outputs
from app.services.blob_storage_service import blob_storage_service
from app.services.document_intelligence import document_intelligence_service
from app.services.foundry_service import foundry_service
from app.services.logging_service import get_logger
from app.services.master_catalog_service import load_catalogs

logger = get_logger("AnalyzeOrchestrator")

JSON_OUTPUT_SUFFIX = (
    "\n\nRespond with valid JSON only. No markdown, no prose, no code fences."
)

AGENT_CONTRACT = "ContractAgent"
AGENT_BLUEPRINT = "BlueprintAgent"
AGENT_PERMIT = "PermitAgent"
AGENT_PLANNING = "ScheduleAgent"
AGENT_SUPPLIER = "SupplierAgent"
AGENT_CREW = "CrewAgent"

CONTRACT_VERSION = "4"
BLUEPRINT_VERSION = "3"
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
    contract_data = await _call(
        AGENT_CONTRACT,
        _resolve_version(AGENT_CONTRACT),
        contract_prompt,
        execution_log=execution_log,
        progress_callback=progress_callback,
    )
    contract_data = normalize_contract_agent(contract_data)
    contract_data.setdefault("project_name", project_name)

    blueprint_prompt = (
        f"Infer building and structural details from the following project description.\n\n"
        f"{base_context}"
    )
    blueprint_data = await _call(
        AGENT_BLUEPRINT,
        _resolve_version(AGENT_BLUEPRINT),
        blueprint_prompt,
        execution_log=execution_log,
        progress_callback=progress_callback,
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
) -> Dict[str, Any]:
    logger.info("[Mode 2 - Documents] Starting pipeline for project: %s", project_name)

    contract_text = ""
    blueprint_text = ""
    stored_documents: Dict[str, str] = {}

    if contract_bytes and contract_filename:
        logger.info("Extracting text from contract: %s", contract_filename)
        if blob_storage_service.is_enabled:
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
        if blob_storage_service.is_enabled:
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

    if contract_text:
        contract_prompt = (
            f"Project Name: {project_name}\n\n"
            f"Extract parameters from this contract document:\n\n{contract_text}"
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
    else:
        logger.info("No contract provided — using project name only for ContractAgent.")
        contract_data = {"project_name": project_name}

    if blueprint_text:
        blueprint_prompt = (
            f"Project Name: {project_name}\n\n"
            f"Analyze blueprint specifications from this document:\n\n{blueprint_text}"
        )
        blueprint_data = await _call(
            AGENT_BLUEPRINT,
            _resolve_version(AGENT_BLUEPRINT),
            blueprint_prompt,
            execution_log=execution_log,
            progress_callback=progress_callback,
        )
    else:
        logger.info("No blueprint provided — using empty blueprint data.")
        blueprint_data = {}

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
    permit_prompt = (
        f"Assess permit and regulatory requirements for this construction project.\n\n"
        f"Contract Data:\n{json.dumps(contract_data, indent=2)}\n\n"
        f"Blueprint Data:\n{json.dumps(blueprint_data, indent=2)}"
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
        f"Blueprint Data:\n{json.dumps(blueprint_data, indent=2)}\n\n"
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

    supplier_catalog, crew_catalog = await load_catalogs(session)

    supplier_prompt = (
        f"Match project material requirements to the available supplier catalog and "
        f"produce a procurement plan.\n\n"
        f"Your output must be valid JSON and include:\n"
        f"- procurement_plan: list of objects with material_name, supplier_name, "
        f"quantity, unit_price, delivery_date, total_cost\n"
        f"- supply_chain_risks: list of supply chain risks with severity and mitigation\n"
        f"- recommended_suppliers: list of preferred suppliers with rationale\n\n"
        f"Planning Data:\n{json.dumps(planning_data, indent=2)}\n\n"
        f"Supplier Catalog:\n{json.dumps(supplier_catalog, indent=2)}"
    )
    supplier_data = await _call(
        AGENT_SUPPLIER,
        _resolve_version(AGENT_SUPPLIER),
        supplier_prompt,
        execution_log=execution_log,
        progress_callback=progress_callback,
    )
    logger.info("[Pipeline] SupplierAgent complete.")

    crew_prompt = (
        f"Allocate crew members from the workforce catalog to project phases based on "
        f"crew requirements.\n\n"
        f"Your output must be valid JSON and include:\n"
        f"- crew_allocations: list of objects with phase_name, crew_name, skill_type, "
        f"labor_cost, start_date, end_date\n"
        f"- workforce_gaps: list of unfilled roles or shortages\n"
        f"- recommendations: actionable workforce recommendations\n\n"
        f"Planning Data:\n{json.dumps(planning_data, indent=2)}\n\n"
        f"Crew Catalog:\n{json.dumps(crew_catalog, indent=2)}"
    )
    crew_data = await _call(
        AGENT_CREW,
        _resolve_version(AGENT_CREW),
        crew_prompt,
        execution_log=execution_log,
        progress_callback=progress_callback,
    )
    logger.info("[Pipeline] CrewAgent complete. Full pipeline finished for: %s", project_name)

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
