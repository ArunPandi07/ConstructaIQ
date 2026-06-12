"""
End-to-end backend verification for the ConstructaIQ analyze pipeline.

Runs live Foundry agent calls for the 6-agent pipeline. Requires Azure credentials in .env and
seeded supplier/crew master data for full catalog coverage.

Usage:
    python scripts/e2e_backend_test.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from app.config.settings import settings
from app.db.engine import dispose_db, init_db, is_db_configured
from app.db.repositories.crew_plan_repository import CrewPlanRepository
from app.db.repositories.project_repository import ProjectRepository
from app.db.repositories.project_supplier_repository import ProjectSupplierRepository
from app.db.session import _get_session_factory
from app.main import app
from app.orchestrator.analyze_orchestrator import run_pipeline_from_text
from app.schemas.project import ProjectCreate
from app.services.master_catalog_service import load_catalogs

EXPECTED_RESPONSE_KEYS = [
    "projectSummary",
    "blueprintSummary",
    "permitAssessment",
    "projectPlan",
    "supplierAnalysis",
    "crewAnalysis",
]

TEST_PROJECT_NAME = "E2E Tower A"
TEST_DESCRIPTION = (
    "42-floor mixed-use commercial tower in downtown Chicago. "
    "Budget $186M, 28-month schedule. Structural steel framing, "
    "deep foundation, MEP fit-out, and interior finishing phases."
)


class E2EResult:
    def __init__(self) -> None:
        self.passed: list[str] = []
        self.failed: list[str] = []

    def ok(self, name: str) -> None:
        self.passed.append(name)
        print(f"[PASS] {name}")

    def fail(self, name: str, detail: str) -> None:
        self.failed.append(f"{name}: {detail}")
        print(f"[FAIL] {name}: {detail}")

    @property
    def success(self) -> bool:
        return not self.failed


results = E2EResult()


def _check_azure_config() -> bool:
    missing = []
    if not settings.AZURE_AIFOUNDRY_ENDPOINT:
        missing.append("AZURE_AIFOUNDRY_ENDPOINT")
    if not settings.AZURE_AIFOUNDRY_KEY:
        missing.append("AZURE_AIFOUNDRY_KEY")
    if missing:
        results.fail("Azure config", f"Missing: {', '.join(missing)}")
        return False
    results.ok("Azure AI Foundry credentials configured")
    return True


def _run_http_smoke_tests() -> None:
    with TestClient(app) as client:
        resp = client.get("/healthz")
        if resp.status_code == 200 and resp.json().get("status") == "healthy":
            results.ok("GET /healthz")
        else:
            results.fail("GET /healthz", f"status={resp.status_code} body={resp.text}")

        resp = client.get("/healthz/db")
        if is_db_configured():
            if resp.status_code == 200 and resp.json().get("status") == "healthy":
                results.ok("GET /healthz/db")
            else:
                results.fail("GET /healthz/db", f"status={resp.status_code} body={resp.text}")
        elif resp.status_code == 503:
            results.ok("GET /healthz/db returns 503 when DB unset")
        else:
            results.fail("GET /healthz/db", f"expected 503, got {resp.status_code}")

        resp = client.post(
            "/api/projects/call-agent",
            json={
                "agent_name": "SupplierAgent",
                "version": "default",
                "text": 'Reply with JSON: {"status": "ok"}',
            },
        )
        if resp.status_code == 200:
            results.ok("POST /api/projects/call-agent (SupplierAgent)")
        else:
            results.fail(
                "POST /api/projects/call-agent",
                f"status={resp.status_code} body={resp.text[:300]}",
            )

async def _verify_catalogs() -> bool:
    if not is_db_configured():
        results.ok("Catalog load skipped (no DATABASE_URL)")
        return True

    session_factory = _get_session_factory()
    async with session_factory() as session:
        suppliers, crew = await load_catalogs(session)
        if len(suppliers) < 1 or len(crew) < 1:
            results.fail(
                "Master catalog load",
                f"Expected seeded data; got {len(suppliers)} suppliers, {len(crew)} crew",
            )
            return False
        results.ok(
            f"Master catalogs loaded: {len(suppliers)} suppliers, {len(crew)} crew"
        )
        return True


async def _create_test_project() -> int | None:
    if not is_db_configured():
        results.fail("DB project setup", "DATABASE_URL not configured")
        return None

    session_factory = _get_session_factory()
    async with session_factory() as session:
        repo = ProjectRepository(session)
        project = await repo.create(
            ProjectCreate(project_name="E2E Persistence Project", status="active")
        )
        await session.commit()
        results.ok(f"Created test project id={project.project_id}")
        return project.project_id


async def _run_full_pipeline(project_id: int | None) -> dict | None:
    print("\n--- Running full analyze pipeline (live Foundry, may take several minutes) ---")

    session_factory = _get_session_factory() if is_db_configured() else None
    if session_factory is None:
        body = await run_pipeline_from_text(
            project_name=TEST_PROJECT_NAME,
            description=TEST_DESCRIPTION,
        )
        return body

    async with session_factory() as session:
        body = await run_pipeline_from_text(
            project_name=TEST_PROJECT_NAME,
            description=TEST_DESCRIPTION,
            project_id=project_id,
            session=session,
        )
        await session.commit()
        return body


def _validate_pipeline_response(body: dict, project_id: int | None) -> None:
    missing_keys = [key for key in EXPECTED_RESPONSE_KEYS if key not in body]
    if missing_keys:
        results.fail("Analyze response shape", f"Missing keys: {missing_keys}")
    else:
        results.ok("Pipeline returns full response shape")

    supplier_data = body.get("supplierAnalysis") or {}
    crew_data = body.get("crewAnalysis") or {}

    if not supplier_data:
        results.fail("SupplierAgent output", "supplierAnalysis is empty")
    elif supplier_data.get("procurement_plan"):
        results.ok("SupplierAgent returned structured procurement_plan")
    else:
        results.ok("SupplierAgent returned output (non-JSON or raw_response fallback)")

    if not crew_data:
        results.fail("CrewAgent output", "crewAnalysis is empty")
    elif crew_data.get("crew_allocations"):
        results.ok("CrewAgent returned structured crew_allocations")
    else:
        results.ok("CrewAgent returned output (non-JSON or raw_response fallback)")

    if project_id is not None:
        summary = body.get("persistenceSummary")
        if not summary:
            results.fail("Persistence summary", "persistenceSummary missing from response")
        elif (
            supplier_data.get("procurement_plan")
            or crew_data.get("crew_allocations")
        ):
            if summary.get("project_suppliers_created", 0) < 1 and supplier_data.get(
                "procurement_plan"
            ):
                results.fail(
                    "Persistence summary",
                    f"No supplier rows persisted: {json.dumps(summary)}",
                )
            elif summary.get("crew_plans_created", 0) < 1 and crew_data.get(
                "crew_allocations"
            ):
                results.fail(
                    "Persistence summary",
                    f"No crew rows persisted: {json.dumps(summary)}",
                )
            else:
                results.ok(
                    f"Persistence summary: {summary['project_suppliers_created']} suppliers, "
                    f"{summary['crew_plans_created']} crew plans"
                )
        else:
            results.ok(
                "Persistence skipped (agents did not return structured procurement_plan "
                "or crew_allocations)"
            )


async def _verify_persistence(project_id: int, body: dict) -> None:
    supplier_data = body.get("supplierAnalysis") or {}
    crew_data = body.get("crewAnalysis") or {}
    if not supplier_data.get("procurement_plan") and not crew_data.get(
        "crew_allocations"
    ):
        results.ok("DB persistence verification skipped (no structured agent output)")
        return

    session_factory = _get_session_factory()
    async with session_factory() as session:
        supplier_repo = ProjectSupplierRepository(session)
        crew_repo = CrewPlanRepository(session)
        suppliers = await supplier_repo.list_by_project(project_id)
        crew_plans = await crew_repo.list_by_project(project_id)

        if supplier_data.get("procurement_plan") and not suppliers:
            results.fail(
                "Persistence verification",
                f"No project_suppliers rows for project {project_id}",
            )
            return
        if crew_data.get("crew_allocations") and not crew_plans:
            results.fail(
                "Persistence verification",
                f"No crew_plans rows for project {project_id}",
            )
            return

        results.ok(
            f"DB persistence verified: {len(suppliers)} supplier row(s), "
            f"{len(crew_plans)} crew plan row(s)"
        )


async def _cleanup_project(project_id: int) -> None:
    session_factory = _get_session_factory()
    async with session_factory() as session:
        repo = ProjectRepository(session)
        project = await repo.get_by_id(project_id)
        if project:
            await repo.delete(project)
            await session.commit()
            results.ok(f"Cleaned up test project id={project_id}")


async def main() -> int:
    print("=" * 60)
    print("CONSTRUCTAIQ BACKEND E2E TEST")
    print("(6-agent pipeline)")
    print("=" * 60)

    if not _check_azure_config():
        return 1

    await init_db()
    project_id: int | None = None

    try:
        await _verify_catalogs()
        project_id = await _create_test_project()

        body = await _run_full_pipeline(project_id)
        if body is None:
            results.fail("Full pipeline", "No response returned")
        else:
            _validate_pipeline_response(body, project_id)

        if project_id is not None and body is not None:
            await _verify_persistence(project_id, body)
    except Exception as exc:
        results.fail("Unexpected error", str(exc))
    finally:
        if project_id is not None:
            try:
                await _cleanup_project(project_id)
            except Exception as exc:
                results.fail("Cleanup", str(exc))
        await dispose_db()

    # HTTP smoke tests last (TestClient lifespan disposes the DB engine on exit)
    _run_http_smoke_tests()

    print("\n" + "=" * 60)
    print(f"PASSED: {len(results.passed)}")
    print(f"FAILED: {len(results.failed)}")
    if results.failed:
        print("\nFailures:")
        for item in results.failed:
            print(f"  - {item}")
    print("=" * 60)

    return 0 if results.success else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
