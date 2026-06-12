"""
HTTP E2E for project lifecycle APIs (create, upload, read endpoints).

Does not run the full Foundry analyze pipeline by default (use e2e_backend_test.py).
Set RUN_LIVE_ANALYZE=1 to enqueue analyze and poll until complete.

Usage:
    python scripts/e2e_project_flow_test.py
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from app.db.engine import dispose_db, is_db_configured
from app.main import app

RUN_LIVE_ANALYZE = os.getenv("RUN_LIVE_ANALYZE", "0") == "1"


def _unwrap(response_json: dict):
    return response_json.get("data", response_json)


def main() -> int:
    if not is_db_configured():
        print("DATABASE_URL not configured — skipping project flow E2E.")
        return 1

    passed = 0
    failed = 0

    import asyncio

    try:
        client_ctx = TestClient(app)
    except Exception as exc:
        print(f"Could not start API (database unavailable?): {exc}")
        return 1

    with client_ctx as client:
        print("POST /api/projects")
        resp = client.post(
            "/api/projects",
            json={"project_name": "E2E Project Flow", "scope": "Test scope"},
        )
        if resp.status_code != 201:
            print(f"FAIL create project: {resp.status_code} {resp.text}")
            return 1
        project_id = _unwrap(resp.json())["project_id"]
        print(f"OK project_id={project_id}")
        passed += 1

        print("GET /api/projects/{id}")
        resp = client.get(f"/api/projects/{project_id}")
        if resp.status_code != 200:
            print(f"FAIL get project: {resp.status_code}")
            failed += 1
        else:
            passed += 1

        print("GET /api/projects/{id}/summary")
        resp = client.get(f"/api/projects/{project_id}/summary")
        if resp.status_code != 200:
            print(f"FAIL summary: {resp.status_code}")
            failed += 1
        else:
            passed += 1

        print("GET /api/projects/{id}/agents")
        resp = client.get(f"/api/projects/{project_id}/agents")
        if resp.status_code != 200:
            print(f"FAIL agents: {resp.status_code}")
            failed += 1
        else:
            passed += 1

        if RUN_LIVE_ANALYZE:
            print("POST /api/projects/{id}/analyze (live)")
            resp = client.post(
                f"/api/projects/{project_id}/analyze",
                json={"description": "28-month commercial tower, $50M budget."},
            )
            if resp.status_code != 202:
                print(f"FAIL analyze enqueue: {resp.status_code} {resp.text}")
                failed += 1
            else:
                job_id = _unwrap(resp.json())["job_id"]
                passed += 1
                for _ in range(120):
                    status_resp = client.get(
                        f"/api/projects/{project_id}/analyze/status",
                        params={"job_id": job_id},
                    )
                    status_data = _unwrap(status_resp.json())
                    if status_data["status"] in ("complete", "error"):
                        print(f"Analyze finished: {status_data['status']}")
                        if status_data["status"] == "complete":
                            passed += 1
                        else:
                            failed += 1
                        break
                    time.sleep(2)
                else:
                    print("FAIL analyze poll timeout")
                    failed += 1

    asyncio.run(dispose_db())
    print(f"\nResults: {passed} passed, {failed} failed")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
