from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from app.db.models.agent_execution import AgentExecution
from app.services.response_mapper import _extract_recommendations, _parse_json_field


AGENT_PIPELINE_ORDER = [
    "ContractAgent",
    "BlueprintAgent",
    "PermitAgent",
    "ScheduleAgent",
    "SupplierAgent",
    "CrewAgent",
]


@dataclass
class AgentReportSection:
    agent_name: str
    highlights: list[tuple[str, str]] = field(default_factory=list)


@dataclass
class ProjectIntelligenceReport:
    project_name: str
    generated_at: datetime
    executive_summary: str
    kpis: dict[str, Any]
    agent_sections: list[AgentReportSection]
    recommendations: list[dict[str, Any]]
    deep_link_url: str


def _as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _field(record: dict[str, Any], keys: list[str]) -> str:
    for key in keys:
        val = record.get(key)
        if val is not None and str(val).strip():
            return str(val).strip()
    return ""


def _format_value(value: Any, max_len: int = 120) -> str:
    if value is None:
        return ""
    if isinstance(value, (int, float, bool)):
        return str(value)
    if isinstance(value, str):
        text = value.strip()
        return text if len(text) <= max_len else f"{text[: max_len - 1]}…"
    if isinstance(value, list):
        if not value:
            return "0 items"
        return f"{len(value)} items"
    if isinstance(value, dict):
        keys = list(value.keys())
        return f"{len(keys)} fields"
    return str(value)


def _rows_from_fields(
    output: dict[str, Any],
    fields: list[tuple[str, list[str]]],
) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    for label, keys in fields:
        val = _field(output, keys) or _format_value(output.get(keys[0]))
        if val:
            rows.append((label, val))
    return rows


def _agent_highlights(agent_name: str, output: dict[str, Any]) -> list[tuple[str, str]]:
    if agent_name == "ContractAgent":
        source = output.get("projectSummary") or output.get("project_summary")
        if isinstance(source, dict):
            output = source
        return _rows_from_fields(
            output,
            [
                ("Project", ["project_name", "projectName"]),
                ("Client", ["client_name", "clientName"]),
                ("Budget", ["budget", "contract_value", "contractValue"]),
                ("Location", ["location"]),
                ("Duration", ["duration_months", "durationMonths"]),
                ("Scope", ["scope"]),
            ],
        )

    if agent_name == "BlueprintAgent":
        rows = _rows_from_fields(
            output,
            [
                ("Construction type", ["construction_type", "constructionType"]),
                ("Stories", ["stories_above_grade", "storiesAboveGrade", "floor_count"]),
                ("Structural steel (tons)", ["structural_steel_tons", "structuralSteelTons"]),
                ("Concrete (CY)", ["concrete_cy", "concreteCy"]),
                ("Curtain wall (SF)", ["curtain_wall_sf", "curtainWallSf"]),
                ("Lateral system", ["lateral_system", "lateralSystem"]),
            ],
        )
        return rows

    if agent_name == "PermitAgent":
        permits = _as_list(
            output.get("required_permits") or output.get("requiredPermits") or output.get("permits")
        )
        risks = _as_list(output.get("compliance_risks") or output.get("complianceRisks"))
        rows: list[tuple[str, str]] = []
        approval = _field(output, ["approval_days", "approvalDays", "estimated_approval_days"])
        if approval:
            rows.append(("Approval timeline", f"{approval} days"))
        rows.append(("Required permits", str(len(permits))))
        rows.append(("Compliance risks", str(len(risks))))
        return rows

    if agent_name == "ScheduleAgent":
        plan = output.get("project_plan") or output.get("projectPlan") or output
        if not isinstance(plan, dict):
            plan = output
        phases = _as_list(plan.get("project_phases") or plan.get("projectPhases") or plan.get("phases"))
        materials = _as_list(plan.get("materials") or output.get("materials"))
        rows = []
        days = _field(plan, ["estimated_duration_days", "estimatedDurationDays", "duration_days"])
        if days:
            rows.append(("Estimated duration", f"{days} days"))
        rows.append(("Project phases", str(len(phases))))
        rows.append(("Materials", str(len(materials))))
        return rows

    if agent_name == "SupplierAgent":
        risks = _as_list(output.get("supply_chain_risks") or output.get("supplyChainRisks"))
        recs = _as_list(output.get("recommendations") or output.get("procurement_recommendations"))
        rows = []
        rows.append(("Supply chain risks", str(len(risks))))
        rows.append(("Recommendations", str(len(recs))))
        procurement = _as_list(output.get("procurement_plan") or output.get("procurementPlan"))
        if procurement:
            rows.append(("Procurement items", str(len(procurement))))
        return rows

    if agent_name == "CrewAgent":
        allocations = _as_list(output.get("crew_allocations") or output.get("crewAllocations"))
        gaps = _as_list(output.get("workforce_gaps") or output.get("workforceGaps"))
        rows = []
        rows.append(("Crew allocations", str(len(allocations))))
        rows.append(("Workforce gaps", str(len(gaps))))
        recs = _as_list(output.get("recommendations") or output.get("crew_recommendations"))
        if recs:
            rows.append(("Recommendations", str(len(recs))))
        return rows

    return [
        (key.replace("_", " ").title(), _format_value(val))
        for key, val in list(output.items())[:6]
        if val is not None
    ]


def build_agent_sections(executions: list[AgentExecution]) -> list[AgentReportSection]:
    by_name: dict[str, AgentExecution] = {}
    for ex in executions:
        if ex.agent_name and ex.agent_name not in by_name:
            by_name[ex.agent_name] = ex

    sections: list[AgentReportSection] = []
    for agent_name in AGENT_PIPELINE_ORDER:
        execution = by_name.get(agent_name)
        if execution is None or not execution.output_json:
            continue
        raw = _parse_json_field(execution.output_json)
        if not isinstance(raw, dict):
            continue
        highlights = _agent_highlights(agent_name, raw)
        if highlights:
            sections.append(AgentReportSection(agent_name=agent_name, highlights=highlights))
    return sections


def build_executive_summary(project_name: str, intelligence: dict[str, Any]) -> str:
    floors = intelligence.get("floors") or "N/A"
    budget = intelligence.get("budget") or "N/A"
    complexity = intelligence.get("complexity") or "N/A"
    recommendations = intelligence.get("recommendations") or []
    readiness = intelligence.get("readiness") or {}
    readiness_pct = readiness.get("overallReadinessPct") if isinstance(readiness, dict) else None
    permits = intelligence.get("requiredPermits") or []
    risks_count = len(intelligence.get("supplyChainRisks") or []) + len(
        intelligence.get("workforceGaps") or []
    )

    parts = [
        f"ConstructaIQ consolidated intelligence for {project_name}.",
        f"Project scale: {floors} floors, budget {budget}, complexity {complexity}.",
        f"Permits tracked: {len(permits)}; open risk signals: {risks_count}.",
        f"Actionable recommendations: {len(recommendations)}.",
    ]
    if readiness_pct is not None:
        parts.append(f"Overall readiness: {readiness_pct}%.")
    return " ".join(parts)


def build_project_intelligence_report(
    project_name: str,
    intelligence: dict[str, Any],
    executions: list[AgentExecution],
    *,
    frontend_base_url: str,
    project_id: int,
) -> ProjectIntelligenceReport:
    recommendations = intelligence.get("recommendations") or []
    if not recommendations and executions:
        recommendations = _extract_recommendations(executions)

    readiness = intelligence.get("readiness") or {}
    kpis = {
        "budget": intelligence.get("budget"),
        "duration": intelligence.get("duration"),
        "floors": intelligence.get("floors"),
        "complexity": intelligence.get("complexity"),
        "squareFootage": intelligence.get("squareFootage"),
        "readinessPct": readiness.get("overallReadinessPct") if isinstance(readiness, dict) else None,
        "recommendationCount": len(recommendations),
        "permitCount": len(intelligence.get("requiredPermits") or []),
        "phaseCount": len(intelligence.get("phases") or []),
    }

    base = frontend_base_url.rstrip("/")
    deep_link = f"{base}/projects/{project_id}"

    return ProjectIntelligenceReport(
        project_name=project_name,
        generated_at=datetime.now(timezone.utc),
        executive_summary=build_executive_summary(project_name, intelligence),
        kpis=kpis,
        agent_sections=build_agent_sections(executions),
        recommendations=recommendations[:15],
        deep_link_url=deep_link,
    )


def report_snapshot(report: ProjectIntelligenceReport) -> str:
    payload = {
        "project_name": report.project_name,
        "generated_at": report.generated_at.isoformat(),
        "kpis": report.kpis,
        "recommendation_count": len(report.recommendations),
        "agent_count": len(report.agent_sections),
    }
    return json.dumps(payload)
