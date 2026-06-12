"""
Mode 2 document pipeline E2E — PDF upload via /api/analyze/documents.

Requires Azure Document Intelligence and Foundry credentials.

Usage:
    python scripts/e2e_mode2_documents.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from app.main import app

MINIMAL_PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


def main() -> int:
    with TestClient(app) as client:
        files = {
            "contract": ("contract.pdf", MINIMAL_PDF, "application/pdf"),
        }
        data = {
            "project_name": "Mode2 E2E Project",
        }
        print("POST /api/analyze/documents (live Foundry + DI)...")
        resp = client.post("/api/analyze/documents", data=data, files=files)
        if resp.status_code != 200:
            print(f"FAIL: {resp.status_code} {resp.text[:500]}")
            return 1

        body = resp.json()
        required = [
            "projectSummary",
            "permitAssessment",
            "projectPlan",
            "supplierAnalysis",
            "crewAnalysis",
        ]
        missing = [k for k in required if k not in body]
        if missing:
            print(f"FAIL missing keys: {missing}")
            return 1

        print("OK Mode 2 document pipeline completed.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
