from __future__ import annotations

import json
from datetime import date
from decimal import Decimal
from typing import Any

from app.db.models.crew_plan import CrewPlan
from app.db.models.permit import Permit
from app.db.models.project import Project
from app.db.models.schedule import Schedule
from app.services.analyze_job_service import AnalyzeJob


def _format_currency(value: Decimal | None) -> str:
    if value is None:
        return "N/A"
    return f"${value:,.0f}"


def _format_date(value: date | None) -> str:
    if value is None:
        return ""
    return value.isoformat()


def _parse_json_field(value: str | None) -> Any:
    if not value:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


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
) -> dict[str, Any]:
    phases_raw: list[Any] = []
    if schedules:
        phases_raw = _parse_json_field(schedules[0].phase_breakdown) or []

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
    if isinstance(phases_raw, list):
        for item in phases_raw:
            if isinstance(item, dict):
                phases.append(
                    {
                        "name": item.get("name") or item.get("phase_name") or "Phase",
                        "status": item.get("status") or "pending",
                        "startDate": item.get("start_date") or item.get("startDate") or "",
                        "endDate": item.get("end_date") or item.get("endDate") or "",
                        "progress": item.get("progress") or 0,
                    }
                )
            elif isinstance(item, str):
                phases.append(
                    {
                        "name": item,
                        "status": "pending",
                        "startDate": "",
                        "endDate": "",
                        "progress": 0,
                    }
                )

    duration = (
        f"{project.duration_months} months"
        if project.duration_months
        else (
            f"{schedules[0].total_duration_days} days"
            if schedules and schedules[0].total_duration_days
            else "N/A"
        )
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
        "squareFootage": str(project.square_footage or "N/A"),
        "requiredPermits": required_permits,
        "crewRequirements": crew_requirements,
        "phases": phases,
    }


def map_upload_session(job: AnalyzeJob) -> dict[str, Any]:
    return {
        "sessionId": job.job_id,
        "projectId": str(job.project_id),
        "status": job.frontend_status,
        "agentSteps": job.agent_steps,
        "overallPct": job.overall_pct,
    }
