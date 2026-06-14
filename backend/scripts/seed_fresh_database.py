"""Main orchestrator for fresh database seeding with master data and 5 new projects.

Usage:
    python -m scripts.seed_fresh_database --confirm
    python -m scripts.seed_fresh_database --confirm --skip-projects
    python -m scripts.seed_fresh_database --confirm --projects-only
"""

import asyncio
import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.engine import dispose_db, init_db, is_db_configured
from app.db.repositories.crew_master_repository import CrewMasterRepository
from app.db.repositories.project_repository import ProjectRepository
from app.db.repositories.supplier_master_repository import SupplierMasterRepository
from app.db.repositories.supplier_material_repository import SupplierMaterialRepository
from app.db.session import _get_session_factory
from app.schemas.crew_master import CrewMasterCreate
from app.schemas.project import ProjectCreate
from app.schemas.supplier_master import SupplierMasterCreate
from app.schemas.supplier_material import SupplierMaterialCreate
from app.services.agent_persistence_service import persist_analysis_outputs
from app.services.logging_service import get_logger

# Import fixtures
from scripts.master_data_fixtures import CREW_MASTER_DATA, SUPPLIER_MASTER_DATA
from scripts.new_project_fixtures import get_all_project_fixtures
from scripts.seed_helpers import (
    build_agent_executions,
    display_sample_data,
    reseed_identities,
    truncate_all_tables,
    validate_seed_data,
)

logger = get_logger("SeedFreshDatabase")


async def seed_supplier_master_data(session) -> tuple[int, int]:
    """Seed supplier master and materials.

    Returns:
        Tuple of (supplier_count, material_count)
    """
    logger.info("\n" + "=" * 80)
    logger.info("SEEDING SUPPLIER MASTER DATA")
    logger.info("=" * 80)

    supplier_repo = SupplierMasterRepository(session)
    material_repo = SupplierMaterialRepository(session)

    supplier_count = 0
    material_count = 0

    for supplier_data in SUPPLIER_MASTER_DATA:
        # Extract materials before creating supplier
        materials = supplier_data.pop("materials", [])

        # Create supplier
        supplier = await supplier_repo.create(SupplierMasterCreate(**supplier_data))
        supplier_count += 1
        logger.info(f"  Created supplier: {supplier.supplier_name} ({supplier.supplier_code})")

        # Create materials for this supplier
        for material_data in materials:
            material_data["supplier_id"] = supplier.supplier_id
            await material_repo.create(SupplierMaterialCreate(**material_data))
            material_count += 1

    await session.flush()
    logger.info(f"\n[OK] Seeded {supplier_count} suppliers with {material_count} materials")
    return supplier_count, material_count


async def seed_crew_master_data(session) -> int:
    """Seed crew master data.

    Returns:
        Crew member count
    """
    logger.info("\n" + "=" * 80)
    logger.info("SEEDING CREW MASTER DATA")
    logger.info("=" * 80)

    crew_repo = CrewMasterRepository(session)
    crew_count = 0

    for crew_data in CREW_MASTER_DATA:
        crew = await crew_repo.create(CrewMasterCreate(**crew_data))
        crew_count += 1
        logger.info(f"  Created crew: {crew.employee_name} ({crew.skill_type})")

    await session.flush()
    logger.info(f"\n[OK] Seeded {crew_count} crew members")
    return crew_count


async def seed_projects(session) -> int:
    """Seed 5 new projects with complete data.

    Returns:
        Project count
    """
    logger.info("\n" + "=" * 80)
    logger.info("SEEDING PROJECTS")
    logger.info("=" * 80)

    project_repo = ProjectRepository(session)
    fixtures = get_all_project_fixtures()
    project_count = 0

    for idx, fixture in enumerate(fixtures, start=1):
        # Extract project summary
        project_summary = fixture.get("projectSummary", {})

        # Create base project
        project_create_data = {
            "project_name": project_summary.get("project_name"),
            "client_name": project_summary.get("client_name"),
            "location": project_summary.get("location"),
            "project_type": project_summary.get("project_type"),
            "scope": project_summary.get("scope"),
            "status": "planning",
        }

        project = await project_repo.create(ProjectCreate(**project_create_data))
        await session.flush()
        project_count += 1

        logger.info(f"\n  [{idx}/5] Created project: {project.project_name} (ID: {project.project_id})")

        # Build agent execution records
        base_time = datetime.now(timezone.utc)
        execution_records = build_agent_executions(fixture, base_time=base_time)

        # Persist all analysis outputs (updates project + creates all related entities)
        await persist_analysis_outputs(
            session=session,
            project_id=project.project_id,
            pipeline_result=fixture,
            execution_records=execution_records,
        )

        await session.commit()
        logger.info(f"  [OK] Project {idx}/5 complete: {project.project_name}")

    logger.info(f"\n[OK] Seeded {project_count} projects with complete data")
    return project_count


async def main():
    """Main orchestrator for database seeding."""
    # Parse CLI arguments
    parser = argparse.ArgumentParser(description="Seed database with master data and projects")
    parser.add_argument("--confirm", action="store_true", required=True, help="Confirm destructive operation")
    parser.add_argument("--skip-projects", action="store_true", help="Skip project seeding (master data only)")
    parser.add_argument("--projects-only", action="store_true", help="Skip master data (projects only)")
    parser.add_argument("--no-reseed-identity", action="store_true", help="Skip identity column reseeding")

    args = parser.parse_args()

    if not args.confirm:
        logger.error("ERROR: --confirm flag required for destructive operation")
        sys.exit(1)

    if args.skip_projects and args.projects_only:
        logger.error("ERROR: Cannot use both --skip-projects and --projects-only")
        sys.exit(1)

    # Database setup
    if not is_db_configured():
        logger.error("ERROR: Database not configured. Set DATABASE_URL environment variable.")
        sys.exit(1)

    await init_db()
    session_factory = _get_session_factory()

    try:
        async with session_factory() as session:
            # Display warning
            logger.warning("\n" + "!" * 80)
            logger.warning("WARNING: This will DELETE ALL DATA in the database!")
            logger.warning("!" * 80 + "\n")

            # Phase 1: Truncation
            logger.info("=" * 80)
            logger.info("PHASE 1: TRUNCATING ALL TABLES")
            logger.info("=" * 80)
            await truncate_all_tables(session)
            await session.commit()

            # Phase 2: Identity Reseed
            if not args.no_reseed_identity:
                logger.info("\n" + "=" * 80)
                logger.info("PHASE 2: RESEEDING IDENTITY COLUMNS")
                logger.info("=" * 80)
                await reseed_identities(session)
                await session.commit()

            # Phase 3: Master Data Seeding
            if not args.projects_only:
                logger.info("\n" + "=" * 80)
                logger.info("PHASE 3: SEEDING MASTER DATA")
                logger.info("=" * 80)

                supplier_count, material_count = await seed_supplier_master_data(session)
                crew_count = await seed_crew_master_data(session)

                await session.commit()
                logger.info(f"\n[OK] Master data complete: {supplier_count} suppliers, {material_count} materials, {crew_count} crew")

            # Phase 4: Project Seeding
            if not args.skip_projects:
                logger.info("\n" + "=" * 80)
                logger.info("PHASE 4: SEEDING PROJECTS")
                logger.info("=" * 80)

                project_count = await seed_projects(session)
                logger.info(f"\n[OK] Projects complete: {project_count} projects seeded")

            # Phase 5: Validation
            logger.info("\n" + "=" * 80)
            logger.info("PHASE 5: VALIDATION")
            logger.info("=" * 80)

            counts = await validate_seed_data(session)
            await display_sample_data(session)

            # Final summary
            logger.info("\n" + "=" * 80)
            logger.info("SEEDING COMPLETE!")
            logger.info("=" * 80)
            logger.info("\nSummary:")
            logger.info(f"  • Suppliers: {counts.get('supplier_master', 0)}")
            logger.info(f"  • Materials: {counts.get('supplier_materials', 0)}")
            logger.info(f"  • Crew Members: {counts.get('crew_master', 0)}")
            logger.info(f"  • Projects: {counts.get('projects', 0)}")
            logger.info(f"  • Permits: {counts.get('permits', 0)}")
            logger.info(f"  • Schedules: {counts.get('schedules', 0)}")
            logger.info(f"  • Budgets: {counts.get('budgets', 0)}")
            logger.info(f"  • Crew Plans: {counts.get('crew_plans', 0)}")
            logger.info(f"  • Project Suppliers: {counts.get('project_suppliers', 0)}")
            logger.info(f"  • Project Risks: {counts.get('project_risks', 0)}")
            logger.info(f"  • Inspections: {counts.get('inspections', 0)}")
            logger.info(f"  • Agent Executions: {counts.get('agent_executions', 0)}")
            logger.info("\n" + "=" * 80 + "\n")

    except Exception as e:
        logger.error(f"\n\n[FAIL] SEEDING FAILED: {str(e)}")
        logger.exception("Full traceback:")
        sys.exit(1)
    finally:
        await dispose_db()


if __name__ == "__main__":
    asyncio.run(main())
