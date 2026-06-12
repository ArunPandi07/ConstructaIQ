"""
E2E test using docs/samples/ contract + blueprint PDFs.

Flow:
  1. POST /api/projects/upload (sample_contract.pdf + sample_blueprint.pdf)
  2. POST /api/projects/{id}/analyze (6-agent pipeline)
  3. Poll analyze status until complete or error
  4. GET summary, suppliers, crew
  5. Print project row highlights

Usage:
    python scripts/e2e_sample_docs_test.py
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from app.db.engine import is_db_configured
from app.main import app

SAMPLES = Path(__file__).resolve().parent.parent / "docs" / "samples"
CONTRACT_PDF = SAMPLES / "sample_contract.pdf"
BLUEPRINT_PDF = SAMPLES / "sample_blueprint.pdf"
DESCRIPTION_FILE = SAMPLES / "sample_mode1_description.txt"

PROJECT_NAME = "Lakefront Mixed-Use Tower — Phase 1"
POLL_INTERVAL_SEC = 5
POLL_TIMEOUT_SEC = 600


def _unwrap(body: dict) -> dict:
    return body.get("data", body)


def _extract_description() -> str:
    text = DESCRIPTION_FILE.read_text(encoding="utf-8")
    start = text.find("---BEGIN DESCRIPTION---")
    end = text.find("---END DESCRIPTION---")
    if start != -1 and end != -1:
        return text[start + len("---BEGIN DESCRIPTION---") : end].strip()
    return text


def main() -> int:
    if not is_db_configured():
        print("ERROR: DATABASE_URL not configured.")
        return 1
    if not CONTRACT_PDF.exists() or not BLUEPRINT_PDF.exists():
        print("ERROR: Run python scripts/build_sample_pdfs.py first.")
        return 1

    description = _extract_description()
    print("=" * 60)
    print("SAMPLE DOCS E2E TEST")
    print("=" * 60)
    print(f"Contract:  {CONTRACT_PDF.name}")
    print(f"Blueprint: {BLUEPRINT_PDF.name}")
    print()

    with TestClient(app) as client:
        # 1. Upload
        print("[1/4] POST /api/projects/upload ...")
        with open(CONTRACT_PDF, "rb") as fc, open(BLUEPRINT_PDF, "rb") as fb:
            resp = client.post(
                "/api/v1/projects/upload",
                data={"project_name": PROJECT_NAME},
                files={
                    "contract": (CONTRACT_PDF.name, fc, "application/pdf"),
                    "blueprint": (BLUEPRINT_PDF.name, fb, "application/pdf"),
                },
            )
        if resp.status_code != 201:
            print(f"FAIL upload: {resp.status_code} {resp.text[:500]}")
            return 1
        upload_data = _unwrap(resp.json())
        project_id = upload_data["project_id"]
        print(f"OK project_id={project_id}, documents={len(upload_data.get('documents', []))}")

        # 2. Analyze
        print("[2/4] POST /api/projects/{id}/analyze (async, ~2 min) ...")
        resp = client.post(
            f"/api/v1/projects/{project_id}/analyze",
            json={"description": description},
        )
        if resp.status_code != 202:
            print(f"FAIL analyze enqueue: {resp.status_code} {resp.text[:500]}")
            return 1
        job_id = _unwrap(resp.json())["job_id"]
        print(f"OK job_id={job_id}")

        # 3. Poll
        print("[3/4] Polling analyze status ...")
        deadline = time.time() + POLL_TIMEOUT_SEC
        final_status = None
        while time.time() < deadline:
            resp = client.get(
                f"/api/v1/projects/{project_id}/analyze/status",
                params={"job_id": job_id},
            )
            if resp.status_code != 200:
                print(f"FAIL status poll: {resp.status_code}")
                return 1
            status_data = _unwrap(resp.json())
            status = status_data.get("status")
            step = status_data.get("progress_step") or "-"
            pct = status_data.get("overall_pct", 0)
            print(f"  status={status} step={step} pct={pct}%")
            if status in ("complete", "error"):
                final_status = status_data
                break
            time.sleep(POLL_INTERVAL_SEC)
        else:
            print("FAIL poll timeout")
            return 1

        if final_status["status"] == "error":
            print(f"FAIL pipeline error: {final_status.get('error')}")
            return 1
        print("OK pipeline complete")

        # 4. Read APIs
        print("[4/4] Reading project outputs ...")
        summary = _unwrap(client.get(f"/api/v1/projects/{project_id}/summary").json())
        intel = summary.get("intelligence", {})
        suppliers = _unwrap(client.get(f"/api/v1/projects/{project_id}/suppliers").json())
        crew = _unwrap(client.get(f"/api/v1/projects/{project_id}/crew").json())
        print()
        print("--- Intelligence summary ---")
        print(f"  name:     {intel.get('name')}")
        print(f"  client:   {intel.get('client')}")
        print(f"  location: {intel.get('location')}")
        print(f"  budget:   {intel.get('budget')}")
        print(f"  duration: {intel.get('duration')}")
        print(f"  floors:   {intel.get('floors')}")
        print(f"  permits:  {len(intel.get('requiredPermits', []))}")
        print(f"  phases:   {len(intel.get('phases', []))}")
        print(f"  crew req: {len(intel.get('crewRequirements', []))}")

        supplier_rows = suppliers.get("suppliers", [])
        crew_rows = crew.get("crew_plans", [])
        print(f"  DB suppliers: {len(supplier_rows)}")
        print(f"  DB crew plans: {len(crew_rows)}")
        persistence = (final_status.get("result") or {}).get("persistenceSummary")
        if persistence:
            print()
            print("--- Persistence summary ---")
            print(json.dumps(persistence, indent=2))

        proj = summary.get("project", {})
        if proj:
            print()
            print("--- projects table (key columns) ---")
            print(f"  client_name:      {proj.get('client_name')}")
            print(f"  contract_value:   {proj.get('contract_value')}")
            print(f"  duration_months:  {proj.get('duration_months')}")
            print(f"  floor_count:      {proj.get('floor_count')}")
            print(f"  complexity_level: {proj.get('complexity_level')}")
            print(f"  location:         {proj.get('location')}")

        result = final_status.get("result") or {}
        has_summary = bool(result.get("projectSummary"))
        has_permits = bool(result.get("permitAssessment"))
        has_plan = bool(result.get("projectPlan"))
        has_supplier = bool((result.get("supplierAnalysis") or {}).get("procurement_plan"))
        has_crew = bool((result.get("crewAnalysis") or {}).get("crew_allocations"))
        print()
        print("--- Pipeline result keys ---")
        checks = [
            ("projectSummary", has_summary),
            ("permitAssessment", has_permits),
            ("projectPlan", has_plan),
            ("supplierAnalysis.procurement_plan", has_supplier),
            ("crewAnalysis.crew_allocations", has_crew),
        ]
        passed = sum(1 for _, ok in checks if ok)
        for name, ok in checks:
            print(f"  [{'OK' if ok else 'MISSING'}] {name}")
        print()
        print(f"Result: {passed}/{len(checks)} extraction checks passed")
        return 0 if passed >= 4 else 1


if __name__ == "__main__":
    raise SystemExit(main())
