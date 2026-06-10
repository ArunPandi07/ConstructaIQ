import json
from typing import Dict, Any, Optional

from app.services.logging_service import get_logger
from app.services.foundry_service import foundry_service
from app.services.document_intelligence import document_intelligence_service

logger = get_logger("AnalyzeOrchestrator")


# ─────────────────────────────────────────────────────────────────────────────
# Agent Name Constants
# ─────────────────────────────────────────────────────────────────────────────
AGENT_CONTRACT  = "ContractAgent"
AGENT_BLUEPRINT = "BlueprintAgent"
AGENT_PERMIT    = "PermitAgent"
AGENT_PLANNING  = "PlanningAgent"
AGENT_KNOWLEDGE = "ConstructionKnowledgeAgent"
AGENT_RISK      = "RiskAgent"
AGENT_RECOVERY  = "RecoveryAgent"
AGENT_DOCTOR    = "DoctorAgent"


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _parse_json_safe(text: str) -> Dict[str, Any]:
    """Strip markdown fences and parse JSON. Returns empty dict on failure."""
    clean = text.strip()
    if clean.startswith("```"):
        lines = clean.splitlines()
        clean = "\n".join(lines[1:-1])
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        logger.warning(f"Could not parse agent JSON. Raw text: {text[:300]}")
        return {}


async def _call(agent_name: str, version: str, prompt: str) -> Dict[str, Any]:
    """Call a single Foundry agent by name + version and return parsed JSON."""
    logger.info(f"[Agent] Calling {agent_name} v{version}")
    raw = await foundry_service.call_agent_directly(
        text=prompt,
        agent_name=agent_name,
        version=version,
    )
    result = _parse_json_safe(raw)
    logger.info(f"[Agent] {agent_name} responded with {len(result)} top-level keys")
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Mode 1 — Text Only
# ─────────────────────────────────────────────────────────────────────────────
async def run_pipeline_from_text(
    project_name: str,
    description: str,
    agent_version: str,
) -> Dict[str, Any]:
    """
    MODE 1 — Text only (no documents).
    Uses project_name + description as input to ContractAgent and BlueprintAgent,
    then continues through the full downstream agent pipeline.
    """
    logger.info(f"[Mode 1 - Text] Starting pipeline for project: {project_name}")

    base_context = (
        f"Project Name: {project_name}\n"
        f"Description: {description}"
    )

    # Step 1: Contract Agent — extract project parameters from description
    contract_prompt = (
        f"Extract project parameters from the following project description.\n\n"
        f"{base_context}"
    )
    contract_data = await _call(AGENT_CONTRACT, agent_version, contract_prompt)
    contract_data.setdefault("project_name", project_name)

    # Step 2: Blueprint Agent — infer building details from description
    blueprint_prompt = (
        f"Infer building and structural details from the following project description.\n\n"
        f"{base_context}"
    )
    blueprint_data = await _call(AGENT_BLUEPRINT, agent_version, blueprint_prompt)

    return await _run_downstream_agents(
        project_name=project_name,
        contract_data=contract_data,
        blueprint_data=blueprint_data,
        agent_version=agent_version,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Mode 2 — Document Upload
# ─────────────────────────────────────────────────────────────────────────────
async def run_pipeline_from_documents(
    project_name: str,
    contract_bytes: Optional[bytes],
    contract_filename: Optional[str],
    blueprint_bytes: Optional[bytes],
    blueprint_filename: Optional[str],
    agent_version: str,
) -> Dict[str, Any]:
    """
    MODE 2 — Document-based.
    Extracts text from uploaded PDFs using Document Intelligence,
    then sends extracted text to the Foundry agent pipeline.
    At least one document (contract or blueprint) must be provided.
    """
    logger.info(f"[Mode 2 - Documents] Starting pipeline for project: {project_name}")

    contract_text = ""
    blueprint_text = ""

    # Extract contract text if provided
    if contract_bytes and contract_filename:
        logger.info(f"Extracting text from contract: {contract_filename}")
        contract_text = await document_intelligence_service.extract_text_from_bytes(
            contract_bytes, contract_filename
        )

    # Extract blueprint text if provided
    if blueprint_bytes and blueprint_filename:
        logger.info(f"Extracting text from blueprint: {blueprint_filename}")
        blueprint_text = await document_intelligence_service.extract_text_from_bytes(
            blueprint_bytes, blueprint_filename
        )

    # Step 1: Contract Agent
    if contract_text:
        contract_prompt = (
            f"Project Name: {project_name}\n\n"
            f"Extract parameters from this contract document:\n\n{contract_text}"
        )
        contract_data = await _call(AGENT_CONTRACT, agent_version, contract_prompt)
        contract_data.setdefault("project_name", project_name)
    else:
        logger.info("No contract provided — using project name only for ContractAgent.")
        contract_data = {"project_name": project_name}

    # Step 2: Blueprint Agent
    if blueprint_text:
        blueprint_prompt = (
            f"Project Name: {project_name}\n\n"
            f"Analyze blueprint specifications from this document:\n\n{blueprint_text}"
        )
        blueprint_data = await _call(AGENT_BLUEPRINT, agent_version, blueprint_prompt)
    else:
        logger.info("No blueprint provided — using empty blueprint data.")
        blueprint_data = {}

    return await _run_downstream_agents(
        project_name=project_name,
        contract_data=contract_data,
        blueprint_data=blueprint_data,
        agent_version=agent_version,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Downstream Agent Pipeline (shared by Mode 1 & Mode 2)
# ─────────────────────────────────────────────────────────────────────────────
async def _run_downstream_agents(
    project_name: str,
    contract_data: Dict[str, Any],
    blueprint_data: Dict[str, Any],
    agent_version: str,
) -> Dict[str, Any]:
    """
    Executes the downstream agent pipeline in sequence:
      PermitAgent → PlanningAgent → KnowledgeAgent →
      RiskAgent → RecoveryAgent → DoctorAgent

    Shared by both Mode 1 (text) and Mode 2 (documents).
    """

    # ── Step 3: Permit Agent ──────────────────────────────────────────────────
    permit_prompt = (
        f"Assess permit and regulatory requirements for this construction project.\n\n"
        f"Contract Data:\n{json.dumps(contract_data, indent=2)}\n\n"
        f"Blueprint Data:\n{json.dumps(blueprint_data, indent=2)}"
    )
    permit_data = await _call(AGENT_PERMIT, 3, permit_prompt)
    logger.info("[Pipeline] PermitAgent complete.")

    # ── Step 4: Planning Agent ────────────────────────────────────────────────
    planning_prompt = (
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
    planning_data = await _call(AGENT_PLANNING, agent_version, planning_prompt)
    logger.info("[Pipeline] PlanningAgent complete.")

    # ── Step 5: Knowledge Agent ───────────────────────────────────────────────
    knowledge_prompt = (
        f"Provide construction industry knowledge, historical risk data, and best practices "
        f"relevant to this project.\n\n"
        f"Your output must include:\n"
        f"- historical_risks: list of historically common risks for similar projects\n"
        f"- best_practices: recommended industry best practices\n"
        f"- failure_patterns: common failure patterns and their causes\n"
        f"- recommendations: actionable risk mitigation recommendations\n\n"
        f"Contract Data:\n{json.dumps(contract_data, indent=2)}\n\n"
        f"Blueprint Data:\n{json.dumps(blueprint_data, indent=2)}\n\n"
        f"Permit Data:\n{json.dumps(permit_data, indent=2)}\n\n"
        f"Planning Data:\n{json.dumps(planning_data, indent=2)}"
    )
    knowledge_data = await _call(AGENT_KNOWLEDGE, agent_version, knowledge_prompt)
    logger.info("[Pipeline] KnowledgeAgent complete.")

    # ── Step 6: Risk Agent ────────────────────────────────────────────────────
    risk_prompt = (
        f"Perform a comprehensive multi-step risk analysis for this construction project.\n\n"
        f"Your output must include:\n"
        f"- risk_score: overall risk score from 0–100\n"
        f"- delay_probability: probability of project delay (0.0–1.0)\n"
        f"- top_risks: list of identified risks with severity and category\n"
        f"- reasoning_chain: step-by-step reasoning used to derive the risk score\n"
        f"- root_causes: identified root causes of key risks\n\n"
        f"Analyze for: delay risk, budget risk, material risk, workforce risk, compliance risk.\n\n"
        f"Contract Data:\n{json.dumps(contract_data, indent=2)}\n\n"
        f"Blueprint Data:\n{json.dumps(blueprint_data, indent=2)}\n\n"
        f"Permit Data:\n{json.dumps(permit_data, indent=2)}\n\n"
        f"Planning Data:\n{json.dumps(planning_data, indent=2)}\n\n"
        f"Knowledge Data:\n{json.dumps(knowledge_data, indent=2)}"
    )
    risk_data = await _call(AGENT_RISK, agent_version, risk_prompt)
    logger.info("[Pipeline] RiskAgent complete.")

    # ── Step 7: Recovery Agent ────────────────────────────────────────────────
    recovery_prompt = (
        f"Create detailed recovery and mitigation plans based on the risk analysis below.\n\n"
        f"Risk Data:\n{json.dumps(risk_data, indent=2)}\n\n"
        f"Planning Data:\n{json.dumps(planning_data, indent=2)}"
    )
    recovery_data = await _call(AGENT_RECOVERY, agent_version, recovery_prompt)
    logger.info("[Pipeline] RecoveryAgent complete.")

    # ── Step 8: Doctor Agent — Final Diagnosis ────────────────────────────────
    doctor_prompt = (
        f"Provide a comprehensive Project Health diagnosis for this construction project.\n\n"
        f"Your output must include:\n"
        f"- health_score: overall project health score from 0–100\n"
        f"- failure_probability: probability of project failure (0.0–1.0)\n"
        f"- diagnosis: detailed narrative diagnosis of project health\n"
        f"- treatment_plan: concrete steps to improve project health\n"
        f"- critical_issues: list of critical issues requiring immediate attention\n\n"
        f"Contract Data:\n{json.dumps(contract_data, indent=2)}\n\n"
        f"Blueprint Data:\n{json.dumps(blueprint_data, indent=2)}\n\n"
        f"Permit Data:\n{json.dumps(permit_data, indent=2)}\n\n"
        f"Planning Data:\n{json.dumps(planning_data, indent=2)}\n\n"
        f"Knowledge Data:\n{json.dumps(knowledge_data, indent=2)}\n\n"
        f"Risk Data:\n{json.dumps(risk_data, indent=2)}\n\n"
        f"Recovery Data:\n{json.dumps(recovery_data, indent=2)}"
    )
    doctor_data = await _call(AGENT_DOCTOR, agent_version, doctor_prompt)
    logger.info(f"[Pipeline] DoctorAgent complete. Full pipeline finished for: {project_name}")

    # ── Final Response ────────────────────────────────────────────────────────
    return {
        "projectSummary": {
            "project_name": contract_data.get("project_name", project_name),
            "client_name": contract_data.get("client_name"),
            "budget": contract_data.get("budget"),
            "duration_months": contract_data.get("duration_months"),
            "scope": contract_data.get("scope"),
            "milestones": contract_data.get("milestones", []),
        },
        "blueprintSummary": blueprint_data,
        "permitAssessment": permit_data,
        "projectPlan": planning_data,
        "knowledgeInsights": knowledge_data,
        "riskAnalysis": risk_data,
        "recoveryPlan": recovery_data,
        "projectHealth": doctor_data,
    }
