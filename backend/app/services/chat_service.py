from __future__ import annotations

import json
import time
from typing import Any

from fastapi import WebSocket
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.db.repositories.chat_message_repository import ChatMessageRepository
from app.db.repositories.user_repository import UserRepository
from app.orchestrator.analyze_orchestrator import (
    AGENT_BUDGET,
    AGENT_CONTRACT,
    AGENT_CREW,
    AGENT_PERMIT,
    AGENT_PLANNING,
    AGENT_SAFETY,
    AGENT_SUPPLIER,
    AGENT_ZONING,
    BUDGET_AGENT_INSTRUCTIONS,
    CONTRACT_AGENT_INSTRUCTIONS,
    CREW_AGENT_INSTRUCTIONS,
    PERMIT_AGENT_INSTRUCTIONS,
    SAFETY_AGENT_INSTRUCTIONS,
    SCHEDULE_AGENT_INSTRUCTIONS,
    SUPPLIER_AGENT_INSTRUCTIONS,
    ZONING_AGENT_INSTRUCTIONS,
)
from app.services.llm_service import llm_service
from app.services.logging_service import get_logger
from app.services.project_service import get_project_agents, get_project_summary
from app.services.response_mapper import _extract_recommendations

logger = get_logger("ChatService")

MAX_HISTORY_MESSAGES = 20
MAX_PROMPT_CHARS = 6000

_sessions: dict[str, list[dict[str, str]]] = {}
_rate_buckets: dict[int, list[float]] = {}

AGENT_INSTRUCTIONS: dict[str, str] = {
    AGENT_CONTRACT: CONTRACT_AGENT_INSTRUCTIONS,
    AGENT_PERMIT: PERMIT_AGENT_INSTRUCTIONS,
    AGENT_PLANNING: SCHEDULE_AGENT_INSTRUCTIONS,
    AGENT_SUPPLIER: SUPPLIER_AGENT_INSTRUCTIONS,
    AGENT_CREW: CREW_AGENT_INSTRUCTIONS,
    AGENT_ZONING: ZONING_AGENT_INSTRUCTIONS,
    AGENT_BUDGET: BUDGET_AGENT_INSTRUCTIONS,
    AGENT_SAFETY: SAFETY_AGENT_INSTRUCTIONS,
}


def _session_key(user_id: int, project_id: int, session_id: str) -> str:
    return f"{user_id}:{project_id}:{session_id}"


async def _send(websocket: WebSocket, msg_type: str, **payload: Any) -> None:
    await websocket.send_text(json.dumps({"type": msg_type, **payload}))


def _risk_label(risk: dict[str, Any], index: int) -> str:
    title = risk.get("title") or risk.get("risk") or risk.get("description") or "Risk"
    severity = risk.get("severity") or risk.get("level") or ""
    if severity:
        return f"{index}. {title} ({severity})"
    return f"{index}. {title}"


def _next_milestone(phases: list[dict[str, Any]]) -> str:
    if not phases:
        return "No milestones on file"

    pending = [
        p
        for p in phases
        if str(p.get("status", "")).lower() not in {"complete", "completed", "done"}
    ]
    if not pending:
        return "All tracked phases complete"

    candidate = pending[0]
    name = candidate.get("name") or "Milestone"
    due = candidate.get("endDate") or candidate.get("startDate") or "TBD"
    return f'"{name}" due {due}'


def _pending_phases_summary(phases: list[dict[str, Any]], limit: int = 3) -> str:
    pending = [
        p
        for p in phases
        if str(p.get("status", "")).lower() not in {"complete", "completed", "done"}
    ]
    if not pending:
        return "No pending phases"

    lines: list[str] = []
    for phase in pending[:limit]:
        name = phase.get("name") or "Phase"
        due = phase.get("endDate") or phase.get("startDate") or "TBD"
        progress = phase.get("progress")
        critical = " [critical path]" if phase.get("isCritical") else ""
        progress_text = f", {progress}% done" if progress is not None else ""
        lines.append(f"- {name} due {due}{progress_text}{critical}")
    return "\n".join(lines)


def _critical_path_summary(phases: list[dict[str, Any]], critical_names: list[str]) -> str:
    if critical_names:
        return ", ".join(critical_names[:8])
    critical = [p.get("name") for p in phases if p.get("isCritical") and p.get("name")]
    if critical:
        return ", ".join(str(name) for name in critical[:8])
    return "Not identified"


def _crew_summary(crew_requirements: list[dict[str, Any]]) -> str:
    if not crew_requirements:
        return "No crew assignments on file"
    parts = [
        f"{item.get('role', 'Role')} ({item.get('count', 0)})"
        for item in crew_requirements[:6]
    ]
    return ", ".join(parts)


def _safety_summary(safety: dict[str, Any] | None) -> str:
    if not safety:
        return "No safety assessment on file"

    highlights: list[str] = []
    for key in ("safety_risks", "crane_stops", "weather_constraints"):
        value = safety.get(key)
        if value:
            text = str(value).strip()
            if text:
                highlights.append(f"{key.replace('_', ' ')}: {text[:180]}")

    if not highlights:
        return "Safety assessment available (see project safety panel for details)"
    return "; ".join(highlights[:3])


def _budget_breakdown_summary(budget: dict[str, Any]) -> str:
    if not budget:
        return "No detailed breakdown on file"
    parts = []
    for key, label in (
        ("material", "Material"),
        ("labor", "Labor"),
        ("equipment", "Equipment"),
        ("contingency", "Contingency"),
    ):
        value = budget.get(key)
        if value:
            parts.append(f"{label}: {value}")
    return ", ".join(parts) if parts else "No detailed breakdown on file"


def _material_cost_value(material: dict[str, Any]) -> float:
    for key in ("totalCost", "total_cost", "cost", "unitCost", "unit_cost"):
        raw = material.get(key)
        if raw is None:
            continue
        try:
            return float(raw)
        except (TypeError, ValueError):
            continue
    return 0.0


def _materials_summary(materials: list[dict[str, Any]], limit: int = 8) -> str:
    if not materials:
        return "No materials on file"

    ranked = sorted(materials, key=_material_cost_value, reverse=True)
    lines: list[str] = []
    for item in ranked[:limit]:
        name = item.get("name") or item.get("material") or "Material"
        qty = item.get("quantity") or item.get("qty")
        unit = item.get("unit") or ""
        supplier = item.get("supplier") or item.get("supplierName") or "Unknown supplier"
        cost = item.get("totalCost") or item.get("unitCost") or item.get("cost")
        qty_text = f"{qty} {unit}".strip() if qty is not None else "qty unknown"
        cost_text = f", cost {cost}" if cost else ", pricing missing"
        lines.append(f"- {name}: {qty_text}, supplier {supplier}{cost_text}")
    return "\n".join(lines)


def _inspections_summary(inspections: list[dict[str, Any]], limit: int = 6) -> str:
    if not inspections:
        return "No inspections on file"

    pending = [
        i
        for i in inspections
        if str(i.get("status", "")).lower() not in {"complete", "completed", "passed", "done"}
    ]
    source = pending or inspections
    lines: list[str] = []
    for item in source[:limit]:
        name = item.get("name") or "Inspection"
        phase = item.get("phase") or "General"
        status = item.get("status") or "planned"
        date = item.get("date") or "TBD"
        lines.append(f"- {name} ({phase}) — {status}, {date}")
    return "\n".join(lines)


def _readiness_summary(readiness: dict[str, Any] | None) -> str:
    if not readiness:
        return "Readiness score not available"
    score = readiness.get("overallScore") or readiness.get("score")
    status = readiness.get("status") or readiness.get("label")
    if score is not None and status:
        return f"Overall {score}% ({status})"
    if score is not None:
        return f"Overall {score}%"
    if status:
        return str(status)
    return "Readiness score not available"


def _recommendations_summary(recommendations: list[dict[str, Any]], limit: int = 3) -> str:
    if not recommendations:
        return "No recommendations on file"
    lines: list[str] = []
    for item in recommendations[:limit]:
        title = item.get("title") or "Recommendation"
        category = item.get("category") or "General"
        description = (item.get("description") or "")[:120]
        suffix = f" — {description}" if description else ""
        lines.append(f"- [{category}] {title}{suffix}")
    return "\n".join(lines)


def _blueprint_summary_text(blueprint: dict[str, Any] | None) -> str:
    if not blueprint:
        return "No blueprint summary on file"
    if isinstance(blueprint, str):
        return blueprint[:400]
    highlights: list[str] = []
    for key in ("summary", "buildingType", "totalArea", "floors", "notes"):
        value = blueprint.get(key)
        if value:
            highlights.append(f"{key}: {value}")
    if highlights:
        return "; ".join(str(item) for item in highlights)[:400]
    return "Blueprint data available (see project documents)"


def _agent_persona(agent_name: str | None) -> str:
    if not agent_name:
        return ""
    instructions = AGENT_INSTRUCTIONS.get(agent_name)
    if not instructions:
        return (
            f"You are answering in the persona of pipeline agent '{agent_name}'. "
            "Stay focused on that agent's domain while using the project snapshot."
        )
    trimmed = instructions.strip().replace("\n", " ")
    if len(trimmed) > 500:
        trimmed = trimmed[:497] + "..."
    return trimmed


def _build_system_prompt(
    intelligence: dict[str, Any],
    *,
    agent_name: str | None = None,
    run_id: str | None = None,
) -> str:
    budget = intelligence.get("budgetBreakdown") or {}
    total_budget = budget.get("total") or intelligence.get("budget") or "N/A"
    total_raw = budget.get("totalRaw")
    spent_line = f"Total {total_budget}"
    if total_raw is not None:
        spent_line += f" (contract value baseline ${total_raw:,.0f})"

    risks = (intelligence.get("supplyChainRisks") or []) + (
        intelligence.get("workforceGaps") or []
    )
    top_risks = "\n".join(_risk_label(r, i + 1) for i, r in enumerate(risks[:5]))
    if not top_risks:
        top_risks = "No major risks recorded"

    permits = intelligence.get("requiredPermits") or []
    permit_summary = (
        ", ".join(
            f"{p.get('name', 'Permit')} ({p.get('status', 'unknown')})"
            for p in permits[:8]
        )
        or "None on file"
    )

    phases = intelligence.get("phases") or []
    crew_requirements = intelligence.get("crewRequirements") or []
    safety = intelligence.get("safetyAssessment")
    materials = intelligence.get("materials") or []
    inspections = intelligence.get("inspections") or []
    readiness = intelligence.get("readiness")
    recommendations = intelligence.get("recommendations") or []
    critical_names = intelligence.get("criticalPathPhases") or []
    blueprint = intelligence.get("blueprintSummary")

    run_note = f"\n- Pipeline run scope: {run_id}" if run_id else ""
    agent_note = ""
    persona = _agent_persona(agent_name)
    if persona:
        agent_note = f"\n\nAGENT PERSONA:\n{persona}\n"

    prompt = (
        f'You are ConstructaIQ, an AI assistant for the construction project '
        f'"{intelligence.get("name", "Unknown")}".\n\n'
        "PROJECT SNAPSHOT:\n"
        f"- Location: {intelligence.get('location', 'N/A')}, "
        f"Type: {intelligence.get('type', 'N/A')}\n"
        f"- Client: {intelligence.get('client', 'N/A')}\n"
        f"- Duration: {intelligence.get('duration', 'N/A')}, "
        f"Floors: {intelligence.get('floors', 0)}, "
        f"Square footage: {intelligence.get('squareFootage', 'N/A')}\n"
        f"- Budget: {spent_line}\n"
        f"- Budget breakdown: {_budget_breakdown_summary(budget)}\n"
        f"- Top Risks:\n{top_risks}\n"
        f"- Schedule: {len(phases)} phases tracked, next: {_next_milestone(phases)}\n"
        f"- Critical path: {_critical_path_summary(phases, critical_names)}\n"
        f"- Pending phases:\n{_pending_phases_summary(phases)}\n"
        f"- Permits: {permit_summary}\n"
        f"- Crew: {_crew_summary(crew_requirements)}\n"
        f"- Safety: {_safety_summary(safety if isinstance(safety, dict) else None)}\n"
        f"- Materials & suppliers:\n{_materials_summary(materials)}\n"
        f"- Inspections:\n{_inspections_summary(inspections)}\n"
        f"- Readiness: {_readiness_summary(readiness if isinstance(readiness, dict) else None)}\n"
        f"- Recommendations:\n{_recommendations_summary(recommendations)}\n"
        f"- Blueprint: {_blueprint_summary_text(blueprint if isinstance(blueprint, dict) else None)}"
        f"{run_note}"
        f"{agent_note}\n"
        "RULES:\n"
        "- Answer using ONLY the PROJECT SNAPSHOT above.\n"
        "- If data is missing, say it is not in the project data.\n"
        "- Use section labels (Budget, Schedule, Materials, etc.) for multi-part answers.\n"
        "- Prefer concise bullet lists when listing multiple items.\n"
        "- Be practical, professional, and concise."
    )

    if len(prompt) > MAX_PROMPT_CHARS:
        return prompt[: MAX_PROMPT_CHARS - 3] + "..."
    return prompt


async def get_project_context(
    session: AsyncSession,
    project_id: int,
    *,
    run_id: str | None = None,
    agent_name: str | None = None,
) -> str:
    data = await get_project_summary(session, project_id)
    intelligence = dict(data["intelligence"])
    if run_id:
        executions = await get_project_agents(session, project_id, run_id=run_id)
        intelligence["recommendations"] = _extract_recommendations(executions)
    return _build_system_prompt(
        intelligence,
        agent_name=agent_name,
        run_id=run_id,
    )


def _trim_history(history: list[dict[str, str]]) -> list[dict[str, str]]:
    if len(history) > MAX_HISTORY_MESSAGES:
        return history[-MAX_HISTORY_MESSAGES:]
    return history


def _to_langchain_messages(history: list[dict[str, str]]) -> list:
    messages: list = []
    for item in history:
        if item["role"] == "user":
            messages.append(HumanMessage(content=item["content"]))
        else:
            messages.append(AIMessage(content=item["content"]))
    return messages


async def _load_history(
    db: AsyncSession,
    user_id: int,
    project_id: int,
    session_id: str,
) -> list[dict[str, str]]:
    key = _session_key(user_id, project_id, session_id)
    cached = _sessions.get(key)
    if cached is not None:
        return cached

    repo = ChatMessageRepository(db)
    rows = await repo.list_recent(user_id, project_id, session_id, limit=MAX_HISTORY_MESSAGES)
    history = [{"role": row.role, "content": row.content} for row in rows]
    _sessions[key] = history
    return history


async def _persist_messages(
    db: AsyncSession,
    user_id: int,
    project_id: int,
    session_id: str,
    user_content: str,
    assistant_content: str,
) -> None:
    repo = ChatMessageRepository(db)
    await repo.create(
        {
            "user_id": user_id,
            "project_id": project_id,
            "session_id": session_id,
            "role": "user",
            "content": user_content,
        }
    )
    await repo.create(
        {
            "user_id": user_id,
            "project_id": project_id,
            "session_id": session_id,
            "role": "assistant",
            "content": assistant_content,
        }
    )
    await db.commit()


async def clear_chat_history(
    db: AsyncSession,
    user_id: int,
    project_id: int,
    session_id: str,
) -> None:
    key = _session_key(user_id, project_id, session_id)
    _sessions.pop(key, None)
    repo = ChatMessageRepository(db)
    await repo.delete_session(user_id, project_id, session_id)
    await db.commit()


def _check_rate_limit(user_id: int) -> bool:
    limit = settings.CHAT_RATE_LIMIT_MESSAGES
    window = settings.CHAT_RATE_LIMIT_WINDOW_SECONDS
    if limit <= 0 or window <= 0:
        return True

    now = time.time()
    bucket = [ts for ts in _rate_buckets.get(user_id, []) if now - ts < window]
    if len(bucket) >= limit:
        _rate_buckets[user_id] = bucket
        return False

    bucket.append(now)
    _rate_buckets[user_id] = bucket
    return True


async def stream_chat(
    websocket: WebSocket,
    project_id: int,
    session_id: str,
    user_message: str,
    db: AsyncSession,
    *,
    user_id: int,
    agent_name: str | None = None,
    run_id: str | None = None,
) -> None:
    key = _session_key(user_id, project_id, session_id)
    history = await _load_history(db, user_id, project_id, session_id)

    content = (user_message or "").strip()
    if not content:
        await _send(websocket, "CHAT_ERROR", message="Message cannot be empty.")
        return

    if len(content) > settings.CHAT_MAX_MESSAGE_LENGTH:
        await _send(
            websocket,
            "CHAT_ERROR",
            message=(
                f"Message too long. Maximum length is "
                f"{settings.CHAT_MAX_MESSAGE_LENGTH} characters."
            ),
        )
        return

    if not _check_rate_limit(user_id):
        await _send(
            websocket,
            "CHAT_ERROR",
            message="Rate limit exceeded. Please wait a few minutes and try again.",
        )
        return

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if user is None or not user.is_active:
        await _send(websocket, "CHAT_ERROR", message="User account is inactive.")
        return

    started = time.perf_counter()
    try:
        system_prompt = await get_project_context(
            db,
            project_id,
            run_id=run_id,
            agent_name=agent_name,
        )
    except Exception as exc:
        logger.exception("Failed to load project context for project_id=%s", project_id)
        await _send(
            websocket,
            "CHAT_ERROR",
            message=f"Could not load project context: {exc}",
        )
        return

    messages = [SystemMessage(content=system_prompt)]
    messages.extend(_to_langchain_messages(history))
    messages.append(HumanMessage(content=content))

    full_response: list[str] = []
    try:
        async for token in llm_service.astream_messages(messages):
            full_response.append(token)
            await _send(websocket, "CHAT_TOKEN", content=token)
        await _send(websocket, "CHAT_DONE")
    except Exception as exc:
        logger.exception("Chat stream failed for project_id=%s", project_id)
        await _send(websocket, "CHAT_ERROR", message=str(exc))
        return

    assistant_text = "".join(full_response)
    history.append({"role": "user", "content": content})
    history.append({"role": "assistant", "content": assistant_text})
    _sessions[key] = _trim_history(history)

    try:
        await _persist_messages(
            db,
            user_id,
            project_id,
            session_id,
            content,
            assistant_text,
        )
    except Exception:
        logger.exception(
            "Failed to persist chat history for project_id=%s user_id=%s",
            project_id,
            user_id,
        )

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    logger.info(
        "Chat completed project_id=%s user_id=%s prompt_chars=%s latency_ms=%s",
        project_id,
        user_id,
        len(system_prompt),
        elapsed_ms,
    )
