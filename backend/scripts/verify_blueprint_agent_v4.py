"""Quick verification: BlueprintAgent v4 + Oceana demo PDFs."""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.orchestrator.analyze_orchestrator import (
    AGENT_BLUEPRINT,
    AGENT_CONTRACT,
    BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS,
    _call,
    _ensure_building_definition,
    _resolve_version,
)
from app.services.agent_field_mapper import normalize_contract_agent
from app.services.building_templates import is_building_definition_sufficient
from app.services.document_intelligence import document_intelligence_service

DOCS = Path(__file__).resolve().parent.parent / "demo_documents"
CONTRACT = DOCS / "Oceana_Residences_Construction_Contract.pdf"
BLUEPRINT = DOCS / "Oceana_Residences_Architectural_Blueprint.pdf"


async def main() -> int:
    version = _resolve_version(AGENT_BLUEPRINT)
    print(f"BlueprintAgent version: {version}")
    if version != "4":
        print("FAIL: expected version 4")
        return 1

    contract_text = await document_intelligence_service.extract_text_from_bytes(
        CONTRACT.read_bytes(), CONTRACT.name
    )
    blueprint_text = await document_intelligence_service.extract_text_from_bytes(
        BLUEPRINT.read_bytes(), BLUEPRINT.name
    )
    print(f"Contract text chars: {len(contract_text)}")
    print(f"Blueprint text chars: {len(blueprint_text)}")

    project_name = "Oceana Residences — 57-Story Luxury Condominium"
    contract_prompt = (
        f"Project Name: {project_name}\n\n"
        f"Extract parameters from this contract document:\n\n{contract_text}"
    )
    blueprint_prompt = (
        f"Project Name: {project_name}\n\n"
        f"Analyze blueprint specifications from this document:\n\n{blueprint_text}"
        f"{BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS}"
    )

    contract_raw = await _call(
        AGENT_CONTRACT,
        _resolve_version(AGENT_CONTRACT),
        contract_prompt,
    )
    contract_data = normalize_contract_agent(contract_raw)
    contract_data.setdefault("project_name", project_name)
    print(f"Contract floor_count: {contract_data.get('floor_count')}")

    blueprint_raw = await _call(AGENT_BLUEPRINT, version, blueprint_prompt)
    blueprint_data = _ensure_building_definition(dict(blueprint_raw), contract_data)

    bd = blueprint_data.get("building_definition", {})
    building = bd.get("building", {})
    levels = bd.get("levels", [])
    stories = building.get("stories")
    total_walls = sum(
        len(level.get("walls", [])) for level in levels if isinstance(level, dict)
    )

    print("--- BlueprintAgent v4 raw keys ---")
    print(sorted(blueprint_raw.keys()))
    has_bd_raw = "building_definition" in blueprint_raw or "buildingDefinition" in blueprint_raw
    print(f"Raw has building_definition: {has_bd_raw}")

    print("--- After _ensure_building_definition ---")
    print(f"stories: {stories}")
    print(f"levels count: {len(levels)}")
    print(f"footprint: {building.get('footprint')}")
    print(f"total walls across levels: {total_walls}")
    print(f"is_building_definition_sufficient: {is_building_definition_sufficient(bd)}")

    if not is_building_definition_sufficient(bd):
        print("FAIL: building_definition still insufficient")
        return 1

    if stories and len(levels) < int(stories):
        print("FAIL: levels < stories")
        return 1

    print("OK: BlueprintAgent v4 pipeline produced valid building_definition")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
