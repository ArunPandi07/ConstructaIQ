"""Test text-searchable PDFs against DI + Contract/Blueprint agents."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.orchestrator.analyze_orchestrator import (
    AGENT_BLUEPRINT,
    AGENT_CONTRACT,
    BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS,
    _call,
    _finalize_blueprint_data,
    _resolve_version,
)
from app.services.agent_field_mapper import normalize_contract_agent
from app.services.building_templates import is_building_definition_sufficient
from app.services.document_intelligence import document_intelligence_service

CONTRACT = Path(r"c:\Users\Trucs\Downloads\construction_contract_text_searchable.pdf")
BLUEPRINT = Path(r"c:\Users\Trucs\Downloads\architectural_blueprint_text_searchable.pdf")
PROJECT = "Oceana Residences"

KEYWORDS = [
    "floor", "story", "stories", "gsf", "square", "footprint",
    "width", "depth", "NUMBER OF FLOORS", "STORIES ABOVE", "GROSS", "57", "42",
]


def key_lines(text: str) -> None:
    for i, line in enumerate(text.splitlines(), 1):
        if any(k.lower() in line.lower() for k in KEYWORDS):
            print(f"  L{i}: {line.strip()[:120]}")


async def main() -> None:
    for label, path in [("CONTRACT", CONTRACT), ("BLUEPRINT", BLUEPRINT)]:
        print("=" * 70)
        print(f"{label}: {path.name} ({path.stat().st_size} bytes)")
        text = await document_intelligence_service.extract_text_from_bytes(
            path.read_bytes(), path.name
        )
        print(f"Chars: {len(text)}, Lines: {len(text.splitlines())}")
        print("--- Key lines ---")
        key_lines(text)
        print("--- Full text ---")
        print(text)
        print()

    contract_text = await document_intelligence_service.extract_text_from_bytes(
        CONTRACT.read_bytes(), CONTRACT.name
    )
    blueprint_text = await document_intelligence_service.extract_text_from_bytes(
        BLUEPRINT.read_bytes(), BLUEPRINT.name
    )

    contract_prompt = (
        f"Project Name: {PROJECT}\n\n"
        f"Extract parameters from this contract document:\n\n{contract_text}"
    )
    blueprint_prompt = (
        f"Project Name: {PROJECT}\n\n"
        f"Analyze blueprint specifications from this document:\n\n{blueprint_text}"
        f"{BLUEPRINT_BUILDING_DEFINITION_INSTRUCTIONS}"
    )

    print("=" * 70)
    print(
        f"Agents: Contract v{_resolve_version(AGENT_CONTRACT)}, "
        f"Blueprint v{_resolve_version(AGENT_BLUEPRINT)}"
    )
    print()

    contract_raw = await _call(
        AGENT_CONTRACT, _resolve_version(AGENT_CONTRACT), contract_prompt
    )
    contract_data = normalize_contract_agent(contract_raw)
    print("CONTRACT AGENT (normalized):")
    for k in sorted(contract_data.keys()):
        v = contract_data[k]
        s = str(v)
        print(f"  {k}: {s[:100]}" + ("..." if len(s) > 100 else ""))

    blueprint_raw = await _call(
        AGENT_BLUEPRINT, _resolve_version(AGENT_BLUEPRINT), blueprint_prompt
    )
    raw_bd = blueprint_raw.get("building_definition") or blueprint_raw.get(
        "buildingDefinition"
    )
    print()
    print("BLUEPRINT AGENT raw keys:", sorted(blueprint_raw.keys()))
    print("Raw building_definition sufficient:", is_building_definition_sufficient(raw_bd))

    final = _finalize_blueprint_data(
        contract_data,
        dict(blueprint_raw),
        PROJECT,
        contract_text=contract_text,
        blueprint_text=blueprint_text,
    )
    print(f"Enriched floor_count: {contract_data.get('floor_count')}")
    print(f"Enriched footprint: {contract_data.get('footprint')}")
    bd = final.get("building_definition", {})
    b = bd.get("building", {})
    levels = bd.get("levels", [])
    footprint = b.get("footprint", {})
    stories = b.get("stories")
    assert stories == 42, f"Expected 42 stories, got {stories}"
    assert footprint.get("width_m") == 55.0, f"Expected width 55, got {footprint}"
    assert footprint.get("depth_m") == 45.0, f"Expected depth 45, got {footprint}"
    print()
    print("3D building_definition (after guard):")
    print(f"  type: {b.get('type')}")
    print(f"  stories: {b.get('stories')}")
    print(f"  totalHeight_m: {b.get('totalHeight_m')}")
    print(f"  footprint: {b.get('footprint')}")
    print(f"  levels: {len(levels)}")
    print(f"  walls total: {sum(len(l.get('walls', [])) for l in levels)}")
    print(f"  sufficient: {is_building_definition_sufficient(bd)}")
    if levels:
        l0 = levels[0]
        print(
            f"  level0: rooms={len(l0.get('rooms', []))} "
            f"walls={len(l0.get('walls', []))}"
        )


if __name__ == "__main__":
    asyncio.run(main())
