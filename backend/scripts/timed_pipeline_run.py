"""Timed full pipeline run against user PDFs."""
import asyncio
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.orchestrator.analyze_orchestrator import run_pipeline_from_documents

CONTRACT = Path(r"c:\Users\Trucs\Downloads\construction_contract_text_searchable.pdf")
BLUEPRINT = Path(r"c:\Users\Trucs\Downloads\architectural_blueprint_text_searchable.pdf")


async def main() -> None:
    cb, cf = CONTRACT.read_bytes(), CONTRACT.name
    bb, bf = BLUEPRINT.read_bytes(), BLUEPRINT.name
    timings: list[tuple[float, str]] = []
    start = time.time()

    def progress(step: str) -> None:
        timings.append((time.time() - start, step))
        print(f"  [{timings[-1][0]:.1f}s] {step}")

    result = await run_pipeline_from_documents(
        "Aster Heights Timed",
        cb,
        cf,
        bb,
        bf,
        progress_callback=progress,
        skip_blob_upload=True,
    )

    elapsed = time.time() - start
    ps = result.get("projectSummary", {})
    bd = result.get("blueprintSummary", {}).get("building_definition", {})
    b = bd.get("building", {}) if bd else {}
    mats = result.get("projectPlan", {}).get("materials", [])
    proc = result.get("supplierAnalysis", {}).get("procurement_plan", [])

    print()
    print(f"TOTAL: {elapsed:.1f}s")
    print(f"floor_count: {ps.get('floor_count')}")
    print(f"stories: {b.get('stories')}, levels: {len(bd.get('levels', []))}")
    print(f"footprint: {b.get('footprint')}")
    print(f"materials: {len(mats)}, procurement: {len(proc)}")
    if mats and proc:
        print(f"sample schedule: {mats[0].get('material_name') or mats[0].get('name')}")
        print(f"sample procurement: {proc[0].get('material_name')}")

    slim_note = next((t for t in timings if "ScheduleAgent" in t[1]), None)
    print("ScheduleAgent started at:", slim_note[0] if slim_note else "?")


if __name__ == "__main__":
    asyncio.run(main())
