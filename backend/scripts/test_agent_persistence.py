#!/usr/bin/env python3
"""
Test script to run 6-agent pipeline and verify persistence of all JSON fields.
Compares agent outputs with what's stored in the database.
"""

import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.config.settings import settings
from app.orchestrator.analyze_orchestrator import (
    run_pipeline_from_text,
)
from app.db.repositories.project_repository import ProjectRepository
from app.db.repositories.permit_repository import PermitRepository
from app.db.repositories.schedule_repository import ScheduleRepository
from app.db.repositories.inspection_repository import InspectionRepository
from app.db.repositories.budget_repository import BudgetRepository
from app.db.repositories.project_supplier_repository import ProjectSupplierRepository
from app.db.repositories.crew_plan_repository import CrewPlanRepository
from app.db.repositories.agent_execution_repository import AgentExecutionRepository
from app.db.repositories.project_risk_repository import ProjectRiskRepository
from app.services.logging_service import get_logger

logger = get_logger("TestAgentPersistence")


async def main():
    """Run pipeline and verify persistence."""
    if not settings.DATABASE_URL:
        logger.error("DATABASE_URL not configured. Please set it in .env")
        return
    
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    test_project_name = f"TestProject_{datetime.now(timezone.utc).timestamp()}"
    test_description = """
    This is a commercial office building located in downtown area with 
    25 floors, approximately 250,000 square feet. The project requires 
    extensive HVAC systems, advanced IT infrastructure, and includes 
    sustainable green features. Timeline is 36 months with phased execution.
    Budget is approximately $75 million.
    """

    try:
        async with async_session() as session:
            logger.info(f"Starting pipeline test for: {test_project_name}")

            # Run pipeline
            result = await run_pipeline_from_text(
                project_name=test_project_name,
                description=test_description,
                session=session,
            )

            if result.get("persistenceSummary"):
                project_id = result["persistenceSummary"].get("project_id")
                logger.info(f"✓ Project persisted with ID: {project_id}")

                # Now query and verify what was stored
                await verify_persistence(session, project_id, result)
            else:
                logger.error("No persistence summary in result")
                logger.error(f"Result keys: {result.keys()}")

    finally:
        await engine.dispose()


async def verify_persistence(session: AsyncSession, project_id: int, result: dict):
    """Verify all agent outputs are in database."""
    logger.info("\n" + "=" * 80)
    logger.info("PERSISTENCE VERIFICATION REPORT")
    logger.info("=" * 80)

    # Verify project
    project_repo = ProjectRepository(session)
    project = await project_repo.get_by_id(project_id)
    if project:
        logger.info(f"\n✓ PROJECT (ID {project_id}):")
        logger.info(f"  - Name: {project.project_name}")
        logger.info(f"  - Contract Value: {project.contract_value}")
        logger.info(f"  - Start Date: {project.start_date}")
        logger.info(f"  - Target Completion: {project.target_completion_date}")
    else:
        logger.error(f"\n✗ PROJECT NOT FOUND (ID {project_id})")
        return

    # Verify permits
    permit_repo = PermitRepository(session)
    permits = await permit_repo.list_by_project(project_id)
    permit_data = result.get("permitAssessment", {})
    logger.info(f"\n✓ PERMITS (Agent: {len(permit_data.get('required_permits', []))} | DB: {len(permits)}):")
    if permits:
        for p in permits[:3]:
            logger.info(f"  - {p.permit_name}: {p.status}")
            logger.info(f"    Approval Days: {p.approval_days}")
            logger.info(f"    Documents: {p.required_documents}")
    else:
        logger.warning("  (no permits in DB)")

    # Verify schedules
    schedule_repo = ScheduleRepository(session)
    schedules = await schedule_repo.list_by_project(project_id)
    schedule_data = result.get("projectPlan", {})
    logger.info(
        f"\n✓ SCHEDULES (Agent phases: {len(schedule_data.get('project_phases', []))} | DB records: {len(schedules)}):"
    )
    if schedules:
        for s in schedules[:2]:
            logger.info(f"  - Total Duration: {s.total_duration_days} days")
            phase_breakdown = json.loads(s.phase_breakdown) if s.phase_breakdown else []
            logger.info(f"  - Phases: {len(phase_breakdown)}")
            if phase_breakdown:
                for phase in phase_breakdown[:3]:
                    logger.info(f"    • {phase.get('name')}: {phase.get('duration')} days")
            work_packages = json.loads(s.work_packages) if s.work_packages else {}
            logger.info(f"  - Work Packages: {list(work_packages.keys())}")
            if work_packages.get("dependencies"):
                logger.info(f"    Dependencies: {len(work_packages['dependencies'])} items")
            if work_packages.get("materials"):
                logger.info(f"    Materials: {len(work_packages['materials'])} items")
    else:
        logger.warning("  (no schedules in DB)")

    # Verify inspections
    inspection_repo = InspectionRepository(session)
    inspections = await inspection_repo.list_by_project(project_id)
    schedule_data = result.get("projectPlan", {})
    logger.info(
        f"\n✓ INSPECTIONS (Agent stages: {len(schedule_data.get('inspection_stages', []))} | DB records: {len(inspections)}):"
    )
    if inspections:
        for insp in inspections[:3]:
            logger.info(f"  - {insp.inspection_name}: {insp.inspection_phase}")
            logger.info(f"    Date: {insp.inspection_date}, Status: {insp.status}")
    else:
        logger.warning("  (no inspections in DB)")

    # Verify suppliers
    supplier_repo = ProjectSupplierRepository(session)
    suppliers = await supplier_repo.list_by_project(project_id)
    supplier_data = result.get("supplierAnalysis", {})
    logger.info(
        f"\n✓ SUPPLIERS (Agent procurement plan: {len(supplier_data.get('procurement_plan', []))} | DB records: {len(suppliers)}):"
    )
    if suppliers:
        for supp in suppliers[:3]:
            logger.info(f"  - {supp.supplier_name}: {supp.material_name}")
            logger.info(f"    Quantity: {supp.quantity}, Unit Price: {supp.unit_price}")
            logger.info(f"    Delivery Date: {supp.delivery_date}")
    else:
        logger.warning("  (no suppliers in DB)")
    
    # Log supply chain risks
    supply_risks = supplier_data.get("supply_chain_risks", [])
    logger.info(f"  Supply Chain Risks (from agent): {len(supply_risks)}")
    if supply_risks:
        for risk in supply_risks[:2]:
            logger.info(f"    - {risk.get('risk')}: {risk.get('severity')}")

    # Verify crew plans
    crew_repo = CrewPlanRepository(session)
    crew_plans = await crew_repo.list_by_project(project_id)
    crew_data = result.get("crewAnalysis", {})
    logger.info(
        f"\n✓ CREW PLANS (Agent allocations: {len(crew_data.get('crew_allocations', []))} | DB records: {len(crew_plans)}):"
    )
    if crew_plans:
        for crew in crew_plans[:3]:
            logger.info(f"  - {crew.crew_name}: {crew.skill_type}")
            logger.info(f"    Phase: {crew.phase_name}, Labor Cost: {crew.labor_cost}")
            logger.info(f"    Start: {crew.start_date}, End: {crew.end_date}")
    else:
        logger.warning("  (no crew plans in DB)")
    
    # Log workforce gaps
    workforce_gaps = crew_data.get("workforce_gaps", [])
    logger.info(f"  Workforce Gaps (from agent): {len(workforce_gaps)}")
    if workforce_gaps:
        for gap in workforce_gaps[:2]:
            logger.info(f"    - {gap.get('role')}: {gap.get('shortage')} needed")

    # Verify budgets
    budget_repo = BudgetRepository(session)
    budgets = await budget_repo.list_by_project(project_id)
    logger.info(f"\n✓ BUDGETS (DB records: {len(budgets)}):")
    if budgets:
        for b in budgets:
            logger.info(f"  - {b.category}: {b.amount} ({b.percentage}%)")
    else:
        logger.warning("  (no budgets in DB)")

    # Verify risks
    risk_repo = ProjectRiskRepository(session)
    risks = await risk_repo.list_by_project(project_id)
    logger.info(f"\n✓ PROJECT RISKS (DB records: {len(risks)}):")
    if risks:
        for risk in risks[:5]:
            logger.info(
                f"  - {risk.title} ({risk.category}): {risk.severity} - {risk.status}"
            )
            logger.info(f"    Detail: {risk.detail[:80]}...")
    else:
        logger.warning("  (no risks in DB)")

    # Verify agent executions
    exec_repo = AgentExecutionRepository(session)
    executions = await exec_repo.list_by_project(project_id)
    logger.info(f"\n✓ AGENT EXECUTIONS (DB records: {len(executions)}):")
    for ex in executions:
        logger.info(
            f"  - {ex.agent_name} v{ex.agent_version}: {ex.status}"
        )
        if ex.output:
            output_dict = json.loads(ex.output) if isinstance(ex.output, str) else ex.output
            logger.info(f"    Output keys: {list(output_dict.keys())}")
            logger.info(f"    Tokens used: {ex.tokens_used}")

    logger.info("\n" + "=" * 80)
    logger.info("VERIFICATION COMPLETE")
    logger.info("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
