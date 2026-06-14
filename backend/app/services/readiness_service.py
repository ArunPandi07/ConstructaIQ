from __future__ import annotations

from typing import Any

from app.db.models.agent_execution import AgentExecution
from app.db.models.budget import Budget
from app.db.models.crew_plan import CrewPlan
from app.db.models.permit import Permit
from app.db.models.project_risk import ProjectRisk
from app.db.models.project_supplier import ProjectSupplier
from app.db.models.schedule import Schedule
_COMPLETE_STATUSES = frozenset({"complete", "completed", "success"})


def _map_permit_status(status: str | None) -> str:
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


def _count_agent_completed(executions: list[AgentExecution]) -> int:
    latest_by_agent: dict[str, AgentExecution] = {}
    for ex in executions:
        name = ex.agent_name
        if not name:
            continue
        prev = latest_by_agent.get(name)
        if prev is None or (ex.execution_id or 0) > (prev.execution_id or 0):
            latest_by_agent[name] = ex
    completed = 0
    for ex in latest_by_agent.values():
        status_val = (ex.status or "").strip().lower()
        if status_val in _COMPLETE_STATUSES:
            completed += 1
    return completed


def _avg_phase_progress_from_schedules(schedules: list[Schedule]) -> int:
    if not schedules or not schedules[0].phase_breakdown:
        return 0
    import json

    try:
        phases_raw = json.loads(schedules[0].phase_breakdown)
    except json.JSONDecodeError:
        return 0
    if not isinstance(phases_raw, list):
        return 0
    progresses: list[int] = []
    for item in phases_raw:
        if isinstance(item, dict) and item.get("progress") is not None:
            try:
                progresses.append(int(item["progress"]))
            except (TypeError, ValueError):
                continue
    if not progresses:
        return 0
    return round(sum(progresses) / len(progresses))


def _permit_readiness(permits: list[Permit]) -> int:
    if not permits:
        return 0
    approved = sum(
        1 for p in permits if _map_permit_status(p.status) == "Approved"
    )
    return round(approved / len(permits) * 100)


def _has_high_severity_supply_risk(risks: list[ProjectRisk]) -> bool:
    for risk in risks:
        if (risk.category or "") != "supply_chain":
            continue
        if (risk.status or "").lower() != "open":
            continue
        sev = (risk.severity or "").lower()
        if sev in ("high", "critical", "very high"):
            return True
    return False


def _open_workforce_gaps(risks: list[ProjectRisk]) -> int:
    return sum(
        1
        for r in risks
        if (r.category or "") == "workforce" and (r.status or "").lower() == "open"
    )


def compute_readiness(
    *,
    executions: list[AgentExecution],
    permits: list[Permit],
    schedules: list[Schedule],
    suppliers: list[ProjectSupplier],
    crew_plans: list[CrewPlan],
    risks: list[ProjectRisk],
    budgets: list[Budget] | None = None,
) -> dict[str, Any]:
    agent_completed = _count_agent_completed(executions)
    agent_completion_pct = round(agent_completed / 6 * 100)
    permit_readiness_pct = _permit_readiness(permits)
    phase_progress_pct = _avg_phase_progress_from_schedules(schedules)

    has_suppliers = len(suppliers) > 0
    supply_risk_penalty = 40 if _has_high_severity_supply_risk(risks) else 0
    procurement_readiness_pct = (
        max(0, 100 - supply_risk_penalty) if has_suppliers else 0
    )

    has_crew = len(crew_plans) > 0
    gap_penalty = min(50, _open_workforce_gaps(risks) * 15)
    workforce_readiness_pct = max(0, 100 - gap_penalty) if has_crew else 0

    weights = [0.2, 0.2, 0.2, 0.2, 0.2]
    values = [
        agent_completion_pct,
        permit_readiness_pct,
        phase_progress_pct,
        procurement_readiness_pct,
        workforce_readiness_pct,
    ]
    overall = round(sum(w * v for w, v in zip(weights, values)))

    result: dict[str, Any] = {
        "agentCompletionPct": agent_completion_pct,
        "permitReadinessPct": permit_readiness_pct,
        "phaseProgressPct": phase_progress_pct,
        "procurementReadinessPct": procurement_readiness_pct,
        "workforceReadinessPct": workforce_readiness_pct,
        "overallReadinessPct": overall,
        "documentsPct": agent_completion_pct,
        "permitsPct": permit_readiness_pct,
        "crewPlanPct": workforce_readiness_pct,
    }

    if budgets:
        result["hasBudgetBreakdown"] = True

    return result
