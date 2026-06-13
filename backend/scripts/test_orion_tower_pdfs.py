"""Test user-provided contract and blueprint PDFs against agents."""
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
from app.services.agent_field_mapper import normalize_blueprint_agent, normalize_contract_agent
from app.services.building_templates import is_building_definition_sufficient
from app.services.document_intelligence import document_intelligence_service

CONTRACT = Path(r"c:\Users\Trucs\Downloads\Oceana_Residences_Construction_Contract_UPDATED(1).pdf")
BLUEPRINT = Path(r"c:\Users\Trucs\Downloads\Oceana_Residences_Architectural_Blueprint(1).pdf")
PROJECT_NAME = "Oceana Residences — 57-Story Luxury Condominium"


def preview(text: str, limit: int = 800) -> str:
    return text[:limit] + ("..." if len(text) > limit else "")


async def main() -> int:
    if not CONTRACT.exists():
        print(f"MISSING: {CONTRACT}")
        return 1
    if not BLUEPRINT.exists():
        print(f"MISSING: {BLUEPRINT}")
        return 1

    print("=== FILES ===")
    print(f"Contract: {CONTRACT} ({CONTRACT.stat().st_size} bytes)")
    print(f"Blueprint: {BLUEPRINT} ({BLUEPRINT.stat().st_size} bytes)")
    print(f"ContractAgent version: {_resolve_version(AGENT_CONTRACT)}")
    print(f"BlueprintAgent version: {_resolve_version(AGENT_BLUEPRINT)}")

    contract_text = await document_intelligence_service.extract_text_from_bytes(
        CONTRACT.read_bytes(), CONTRACT.name
    )
    blueprint_text = await document_intelligence_service.extract_text_from_bytes(
        BLUEPRINT.read_bytes(), BLUEPRINT.name
    )

    print("\n=== DOCUMENT INTELLIGENCE ===")
    print(f"Contract extracted chars: {len(contract_text)}")
    print(f"Blueprint extracted chars: {len(blueprint_text)}")
    print("\n--- Contract preview ---")
    print(preview(contract_text))
    print("\n--- Blueprint preview ---")
    print(preview(blueprint_text))

    project_name = PROJECT_NAME
    contract_prompt = (
        f"Project Name: {project_name}\n\n"
        f"Extract parameters from this contract document:\n\n{contract_text}"
    )
    blueprint_prompt = (
        f"Project Name: {project_name}\n\n"
        f"Analyze blueprint specifications from this document:\n\n{blueprint_text}"
        f"{BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS}"
    )

    print("\n=== CONTRACT AGENT ===")
    contract_raw = await _call(
        AGENT_CONTRACT, _resolve_version(AGENT_CONTRACT), contract_prompt
    )
    contract_data = normalize_contract_agent(contract_raw)
    print("Raw keys:", sorted(contract_raw.keys()))
    for key in sorted(contract_data.keys()):
        value = contract_data[key]
        if isinstance(value, list):
            print(f"  {key}: list[{len(value)}]")
        elif isinstance(value, dict):
            print(f"  {key}: dict({len(value)} keys)")
        else:
            text = str(value)
            print(f"  {key}: {text[:150]}")

    print("\n=== BLUEPRINT AGENT ===")
    blueprint_raw = await _call(
        AGENT_BLUEPRINT, _resolve_version(AGENT_BLUEPRINT), blueprint_prompt
    )
    blueprint_norm = normalize_blueprint_agent(blueprint_raw)
    print("Raw keys:", sorted(blueprint_raw.keys()))
    for key in sorted(blueprint_norm.keys()):
        if key == "building_definition":
            print("  building_definition: present")
            continue
        value = blueprint_norm[key]
        if isinstance(value, list):
            print(f"  {key}: list[{len(value)}]")
        elif isinstance(value, dict):
            print(f"  {key}: dict")
        else:
            print(f"  {key}: {str(value)[:150]}")

    raw_bd = blueprint_raw.get("building_definition") or blueprint_raw.get("buildingDefinition")
    print(f"Raw building_definition sufficient: {is_building_definition_sufficient(raw_bd)}")

    blueprint_final = _ensure_building_definition(dict(blueprint_raw), contract_data)
    bd = blueprint_final.get("building_definition", {})
    building = bd.get("building", {})
    levels = bd.get("levels", [])
    total_walls = sum(
        len(level.get("walls", [])) for level in levels if isinstance(level, dict)
    )

    print("\n=== 3D building_definition (after guard) ===")
    print(f"  type: {building.get('type')}")
    print(f"  stories: {building.get('stories')}")
    print(f"  totalHeight_m: {building.get('totalHeight_m')}")
    print(f"  footprint: {building.get('footprint')}")
    print(f"  levels count: {len(levels)}")
    print(f"  total walls: {total_walls}")
    print(f"  sufficient: {is_building_definition_sufficient(bd)}")
    if levels:
        level0 = levels[0]
        print(f"  level 0 rooms: {len(level0.get('rooms', []))}")
        print(f"  level 0 walls: {len(level0.get('walls', []))}")
        print(f"  level 0 stairs: {len(level0.get('stairs', []))}")

    print("\n=== RESULT ===")
    if contract_data.get("floor_count"):
        print(f"floor_count extracted: {contract_data.get('floor_count')}")
    else:
        print("WARNING: floor_count not extracted from contract")
    if contract_data.get("square_footage"):
        print(f"square_footage extracted: {contract_data.get('square_footage')}")

    ok = is_building_definition_sufficient(bd)
    stories = building.get("stories")
    if ok and stories and len(levels) >= int(stories):
        print("PASS: Valid building_definition for 3D viewer")
        return 0
    print("PARTIAL: building_definition valid but may not match document scale")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
