"""Reset project-scoped data and seed 5 demo projects for UI testing."""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

_SCRIPTS_DIR = Path(__file__).resolve().parent
_ROOT_DIR = _SCRIPTS_DIR.parent
sys.path.insert(0, str(_ROOT_DIR))
sys.path.insert(0, str(_SCRIPTS_DIR))

from sqlalchemy import func, select, text

from app.db.engine import dispose_db, init_db, is_db_configured
from app.db.models.crew_master import CrewMaster
from app.db.models.supplier_master import SupplierMaster
from app.db.repositories.project_repository import ProjectRepository
from app.db.session import _get_session_factory
from app.schemas.project import ProjectCreate
from app.services.agent_persistence_service import persist_analysis_outputs
from db_reset import PROJECT_TABLES_DELETE_ORDER, truncate_project_data
from demo_project_fixtures import DEMO_PROJECT_FIXTURES, build_execution_records


async def _count_catalog_rows(session) -> tuple[int, int]:
    supplier_count = await session.scalar(select(func.count()).select_from(SupplierMaster))
    crew_count = await session.scalar(select(func.count()).select_from(CrewMaster))
    return int(supplier_count or 0), int(crew_count or 0)


async def _table_row_counts(session) -> dict[str, int]:
    counts: dict[str, int] = {}
    for table in PROJECT_TABLES_DELETE_ORDER:
        result = await session.scalar(text(f"SELECT COUNT(*) FROM {table}"))
        counts[table] = int(result or 0)
    return counts


async def seed_demo_projects(
    session,
    *,
    skip_reset: bool = False,
    reseed_identity: bool = True,
) -> list[dict]:
    if not skip_reset:
        deleted = await truncate_project_data(session, reseed_identity=reseed_identity)
        await session.commit()
        print("Deleted project-scoped rows:")
        for table, count in deleted.items():
            print(f"  {table}: {count}")

    seeded: list[dict] = []
    project_repo = ProjectRepository(session)

    for fixture in DEMO_PROJECT_FIXTURES:
        pipeline = fixture["pipeline"]
        summary = pipeline["projectSummary"]
        project_name = summary["project_name"]

        project = await project_repo.create(
            ProjectCreate(project_name=project_name, status="uploaded")
        )
        await session.flush()

        execution_records = build_execution_records(pipeline)
        persist_summary = await persist_analysis_outputs(
            session,
            project.project_id,
            pipeline,
            execution_records=execution_records,
        )

        seeded.append(
            {
                "slug": fixture["slug"],
                "project_id": project.project_id,
                "project_name": project_name,
                "persist": persist_summary,
            }
        )
        print(f"Seeded project id={project.project_id}: {project_name}")

    return seeded


async def main() -> int:
    parser = argparse.ArgumentParser(
        description="Truncate project data and seed 5 demo projects."
    )
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Required flag to confirm destructive reset of project data.",
    )
    parser.add_argument(
        "--skip-reset",
        action="store_true",
        help="Skip truncate step (use on empty project tables only).",
    )
    parser.add_argument(
        "--no-reseed-identity",
        action="store_true",
        help="Do not run DBCC CHECKIDENT after delete.",
    )
    args = parser.parse_args()

    if not args.confirm:
        print("Refusing to run without --confirm (this deletes all project data).")
        return 1

    if not is_db_configured():
        print("DATABASE_URL is not configured.")
        return 1

    await init_db()
    session_factory = _get_session_factory()

    try:
        async with session_factory() as session:
            suppliers, crew = await _count_catalog_rows(session)
            if suppliers == 0 or crew == 0:
                print(
                    "Warning: master catalogs look empty "
                    f"(suppliers={suppliers}, crew={crew}). "
                    "Run: python scripts/bootstrap.py"
                )

            seeded = await seed_demo_projects(
                session,
                skip_reset=args.skip_reset,
                reseed_identity=not args.no_reseed_identity,
            )

            counts = await _table_row_counts(session)
            print("\nRow counts after seed:")
            for table, count in counts.items():
                print(f"  {table}: {count}")

            print(f"\nDemo seed complete: {len(seeded)} project(s).")
            for row in seeded:
                print(f"  [{row['project_id']}] {row['project_name']}")

        return 0
    except Exception as exc:
        print(f"Demo seed failed: {exc}")
        return 1
    finally:
        await dispose_db()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
