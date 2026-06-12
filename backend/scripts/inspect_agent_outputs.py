"""
Call each Foundry pipeline agent and report output format (keys, JSON vs prose).

Usage:
    python scripts/inspect_agent_outputs.py
    python scripts/inspect_agent_outputs.py --out reports/agent_formats.json
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config.settings import settings
from app.db.engine import dispose_db, init_db, is_db_configured
from app.orchestrator.analyze_orchestrator import (
    AGENT_BLUEPRINT,
    AGENT_CONTRACT,
    AGENT_CREW,
    AGENT_PERMIT,
    AGENT_PLANNING,
    AGENT_SUPPLIER,
    AGENT_VERSIONS,
    JSON_OUTPUT_SUFFIX,
    _parse_json_safe,
    _resolve_version,
)
from app.services.agent_field_mapper import normalize_contract_agent
from app.services.foundry_service import foundry_service
from app.services.master_catalog_service import load_catalogs

PROJECT_NAME = "Format Probe Tower"
DESCRIPTION = (
    "42-floor mixed-use commercial tower in downtown Chicago. "
    "Client: Lakefront Development Partners. Budget $186.5M, 28-month schedule. "
    "1,250,000 GSF. Structural steel framing, deep foundation, MEP fit-out."
)


def _describe_value(value: Any, *, depth: int = 0, max_depth: int = 2) -> Any:
    if depth >= max_depth:
        return type(value).__name__
    if isinstance(value, dict):
        return {k: _describe_value(v, depth=depth + 1, max_depth=max_depth) for k, v in value.items()}
    if isinstance(value, list):
        if not value:
            return []
        return {
            "_count": len(value),
            "_first_item": _describe_value(value[0], depth=depth + 1, max_depth=max_depth),
        }
    if isinstance(value, str):
        preview = value.replace("\n", " ")[:100]
        return f"str({len(value)}): {preview!r}"
    return value


def _classify_output(parsed: dict[str, Any]) -> str:
    if "raw_response" in parsed and len(parsed) == 1:
        text = parsed["raw_response"].strip()
        if text.startswith("{") or text.startswith("["):
            return "parse_failed_json_like"
        if text.startswith("```"):
            return "parse_failed_fenced"
        return "parse_failed_prose"
    return "structured_json"


async def _run_agent(
    agent_name: str,
    prompt: str,
) -> tuple[dict[str, Any], dict[str, Any]]:
    version = _resolve_version(agent_name)
    started = time.perf_counter()
    raw = await foundry_service.call_agent_directly(
        text=prompt + JSON_OUTPUT_SUFFIX,
        agent_name=agent_name,
        version=version,
    )
    parsed = _parse_json_safe(raw, agent_name=agent_name)
    elapsed = round(time.perf_counter() - started, 2)
    report = {
        "agent": agent_name,
        "version": version,
        "status": "ok",
        "elapsed_seconds": elapsed,
        "format": _classify_output(parsed),
        "top_level_keys": list(parsed.keys()),
        "key_count": len(parsed),
        "shape": _describe_value(parsed),
        "raw_preview": raw.strip().replace("\n", " ")[:500],
    }
    return parsed, report


async def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect Foundry agent output formats")
    parser.add_argument("--out", type=Path, help="Optional JSON report path")
    args = parser.parse_args()

    if not settings.AZURE_AIFOUNDRY_ENDPOINT or not settings.AZURE_AIFOUNDRY_KEY:
        print("AZURE_AIFOUNDRY_ENDPOINT / AZURE_AIFOUNDRY_KEY not configured.")
        return 1

    supplier_catalog: list[Any] = []
    crew_catalog: list[Any] = []
    if is_db_configured():
        await init_db()
        from app.db.session import _get_session_factory

        factory = _get_session_factory()
        async with factory() as session:
            supplier_catalog, crew_catalog = await load_catalogs(session)

    reports: list[dict[str, Any]] = []
    base_context = f"Project Name: {PROJECT_NAME}\nDescription: {DESCRIPTION}"

    contract_prompt = (
        f"Extract project parameters from the following project description.\n\n{base_context}"
    )
    contract_data, report = await _run_agent(AGENT_CONTRACT, contract_prompt)
    reports.append(report)
    contract_data = normalize_contract_agent(contract_data)
    contract_data.setdefault("project_name", PROJECT_NAME)

    blueprint_prompt = (
        f"Infer building and structural details from the following project description.\n\n"
        f"{base_context}"
    )
    blueprint_data, report = await _run_agent(AGENT_BLUEPRINT, blueprint_prompt)
    reports.append(report)

    permit_prompt = (
        f"Assess permit and regulatory requirements for this construction project.\n\n"
        f"Contract Data:\n{json.dumps(contract_data, indent=2)}\n\n"
        f"Blueprint Data:\n{json.dumps(blueprint_data, indent=2)}"
    )
    permit_data, report = await _run_agent(AGENT_PERMIT, permit_prompt)
    reports.append(report)

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
    planning_data, report = await _run_agent(AGENT_PLANNING, schedule_prompt)
    reports.append(report)

    supplier_prompt = (
        f"Match project material requirements to the available supplier catalog and "
        f"produce a procurement plan.\n\n"
        f"Planning Data:\n{json.dumps(planning_data, indent=2)}\n\n"
        f"Supplier Catalog:\n{json.dumps(supplier_catalog, indent=2)}"
    )
    supplier_data, report = await _run_agent(AGENT_SUPPLIER, supplier_prompt)
    reports.append(report)

    crew_prompt = (
        f"Allocate crew members from the workforce catalog to project phases.\n\n"
        f"Planning Data:\n{json.dumps(planning_data, indent=2)}\n\n"
        f"Crew Catalog:\n{json.dumps(crew_catalog, indent=2)}"
    )
    _, report = await _run_agent(AGENT_CREW, crew_prompt)
    reports.append(report)

    if is_db_configured():
        await dispose_db()

    print("=" * 72)
    print("AGENT OUTPUT FORMAT REPORT (6-agent pipeline)")
    print("Versions:", ", ".join(f"{k}=v{AGENT_VERSIONS[k]}" for k in AGENT_VERSIONS))
    print("=" * 72)
    for row in reports:
        print()
        print(f"## {row['agent']} v{row['version']}")
        print(f"   STATUS: ok ({row['elapsed_seconds']}s)")
        print(f"   FORMAT: {row['format']}")
        print(f"   KEYS ({row['key_count']}): {', '.join(row['top_level_keys'])}")

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(reports, indent=2, default=str), encoding="utf-8")
        print()
        print(f"Full report: {args.out}")

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
