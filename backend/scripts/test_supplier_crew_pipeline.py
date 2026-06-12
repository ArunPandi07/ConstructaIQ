"""Integration tests for supplier/crew catalog loading and agent output persistence."""

import asyncio
import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.engine import dispose_db, init_db, is_db_configured
from app.db.repositories.crew_plan_repository import CrewPlanRepository
from app.db.repositories.project_repository import ProjectRepository
from app.db.repositories.project_supplier_repository import ProjectSupplierRepository
from app.db.session import _get_session_factory
from app.schemas.project import ProjectCreate
from app.services.agent_persistence_service import persist_supplier_and_crew_outputs
from app.services.master_catalog_service import load_catalogs, load_crew_catalog, load_supplier_catalog


MOCK_SUPPLIER_OUTPUT = {
    "procurement_plan": [
        {
            "material_name": "Wide Flange Beam W14x90",
            "supplier_name": "MidWest Steel Corp",
            "quantity": "10",
            "unit_price": "2850.00",
            "delivery_date": "2026-08-01",
            "total_cost": "28500.00",
        }
    ],
    "supply_chain_risks": [],
    "recommended_suppliers": [],
}

MOCK_CREW_OUTPUT = {
    "crew_allocations": [
        {
            "phase_name": "Foundation & Structure",
            "crew_name": "Derek Sullivan",
            "skill_type": "Steel Worker",
            "labor_cost": "4900.00",
            "start_date": "2026-03-01",
            "end_date": "2026-06-30",
        }
    ],
    "workforce_gaps": [],
    "recommendations": [],
}


async def test_no_db_fallback() -> bool:
    supplier_catalog, crew_catalog = await load_catalogs(None)
    ok = supplier_catalog == [] and crew_catalog == []
    print(f"[{'OK' if ok else 'FAIL'}] No-DB fallback returns empty catalogs")
    return ok


async def test_catalog_loading(session) -> bool:
    supplier_catalog = await load_supplier_catalog(session)
    crew_catalog = await load_crew_catalog(session)

    suppliers_ok = len(supplier_catalog) >= 1
    materials_ok = any(
        len(supplier.get("materials", [])) > 0 for supplier in supplier_catalog
    )
    crew_ok = len(crew_catalog) >= 1

    ok = suppliers_ok and materials_ok and crew_ok
    print(
        f"[{'OK' if ok else 'FAIL'}] Catalog loading: "
        f"{len(supplier_catalog)} suppliers, {len(crew_catalog)} crew members"
    )
    return ok


async def test_persistence(session) -> bool:
    project_repo = ProjectRepository(session)
    supplier_repo = ProjectSupplierRepository(session)
    crew_repo = CrewPlanRepository(session)

    project = await project_repo.create(
        ProjectCreate(project_name="Supplier Crew Pipeline Test", status="active")
    )
    await session.flush()

    summary = await persist_supplier_and_crew_outputs(
        session=session,
        project_id=project.project_id,
        supplier_data=MOCK_SUPPLIER_OUTPUT,
        crew_data=MOCK_CREW_OUTPUT,
    )
    await session.flush()

    suppliers = await supplier_repo.list_by_project(project.project_id)
    crew_plans = await crew_repo.list_by_project(project.project_id)

    first_ok = (
        summary["project_suppliers_created"] == 1
        and summary["crew_plans_created"] == 1
        and len(suppliers) == 1
        and len(crew_plans) == 1
        and suppliers[0].supplier_name == "MidWest Steel Corp"
        and crew_plans[0].crew_name == "Derek Sullivan"
    )
    print(f"[{'OK' if first_ok else 'FAIL'}] Persistence creates project rows")

    updated_supplier_output = {
        **MOCK_SUPPLIER_OUTPUT,
        "procurement_plan": [
            {
                **MOCK_SUPPLIER_OUTPUT["procurement_plan"][0],
                "supplier_name": "RegionalSteel Co",
                "total_cost": "29250.00",
            }
        ],
    }
    replace_summary = await persist_supplier_and_crew_outputs(
        session=session,
        project_id=project.project_id,
        supplier_data=updated_supplier_output,
        crew_data=MOCK_CREW_OUTPUT,
    )
    await session.flush()

    suppliers_after = await supplier_repo.list_by_project(project.project_id)
    replace_ok = (
        replace_summary["project_suppliers_deleted"] >= 1
        and len(suppliers_after) == 1
        and suppliers_after[0].supplier_name == "RegionalSteel Co"
        and suppliers_after[0].total_cost == Decimal("29250.00")
    )
    print(f"[{'OK' if replace_ok else 'FAIL'}] Re-run replaces existing project rows")

    await project_repo.delete(project)
    await session.flush()

    remaining_suppliers = await supplier_repo.list_by_project(project.project_id)
    remaining_crew = await crew_repo.list_by_project(project.project_id)
    cleanup_ok = len(remaining_suppliers) == 0 and len(remaining_crew) == 0
    print(f"[{'OK' if cleanup_ok else 'FAIL'}] Cascade cleanup after project delete")

    return first_ok and replace_ok and cleanup_ok


async def main() -> int:
    results: list[bool] = []

    results.append(await test_no_db_fallback())

    if not is_db_configured():
        print("DATABASE_URL is not configured — skipping DB integration tests.")
        return 0 if all(results) else 1

    await init_db()
    session_factory = _get_session_factory()

    try:
        async with session_factory() as session:
            results.append(await test_catalog_loading(session))
            results.append(await test_persistence(session))
            await session.commit()
    except Exception as exc:
        print(f"Integration test failed: {exc}")
        return 1
    finally:
        await dispose_db()

    passed = sum(results)
    total = len(results)
    print(f"\nSupplier/crew pipeline tests: {passed}/{total} passed.")
    return 0 if all(results) else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
