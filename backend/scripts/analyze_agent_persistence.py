#!/usr/bin/env python3
"""
Verify what fields from agent outputs are being persisted vs what's available but not used.
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.config.settings import settings
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
from scripts.demo_project_fixtures import DEMO_PROJECT_FIXTURES

logger = get_logger("AgentPersistenceAnalyzer")


async def analyze_persistence():
    """Analyze what's being persisted from agent outputs."""
    if not settings.DATABASE_URL:
        logger.error("DATABASE_URL not configured")
        return

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            # Get first seeded project
            repo = ProjectRepository(session)
            project = await repo.get_by_id(1)
            if not project:
                logger.error("No projects found in database")
                return

            logger.info("\n" + "=" * 100)
            logger.info(f"AGENT OUTPUT VS DATABASE PERSISTENCE ANALYSIS")
            logger.info(f"Project: {project.project_name}")
            logger.info("=" * 100)

            # Get the fixture data for this project
            fixture = DEMO_PROJECT_FIXTURES[0]
            agent_outputs = {
                "ContractAgent": fixture["pipeline"].get("projectSummary", {}),
                "BlueprintAgent": fixture["pipeline"].get("blueprintSummary", {}),
                "PermitAgent": fixture["pipeline"].get("permitAssessment", {}),
                "ScheduleAgent": fixture["pipeline"].get("projectPlan", {}),
                "SupplierAgent": fixture["pipeline"].get("supplierAnalysis", {}),
                "CrewAgent": fixture["pipeline"].get("crewAnalysis", {}),
            }

            # Analyze each agent output
            await analyze_contract_agent(session, project.project_id, agent_outputs)
            await analyze_permit_agent(session, project.project_id, agent_outputs)
            await analyze_schedule_agent(session, project.project_id, agent_outputs)
            await analyze_supplier_agent(session, project.project_id, agent_outputs)
            await analyze_crew_agent(session, project.project_id, agent_outputs)

            logger.info("\n" + "=" * 100)

    finally:
        await engine.dispose()


async def analyze_contract_agent(session: AsyncSession, project_id: int, outputs: dict):
    """Analyze ContractAgent output vs persisted Project fields."""
    logger.info("\n>>> CONTRACTAGENT OUTPUT ANALYSIS:")
    contract_output = outputs["ContractAgent"]
    
    logger.info(f"Agent returns {len(contract_output)} fields:")
    for key in sorted(contract_output.keys()):
        value = contract_output[key]
        if isinstance(value, str) and len(str(value)) > 60:
            logger.info(f"  • {key}: {str(value)[:60]}...")
        else:
            logger.info(f"  • {key}: {value}")

    # Check what's actually in Project model
    repo = ProjectRepository(session)
    project = await repo.get_by_id(project_id)
    
    logger.info(f"\nPersisted in Project table:")
    persisted_fields = {
        "project_name": project.project_name,
        "project_type": project.project_type,
        "location": project.location,
        "client_name": project.client_name,
        "status": project.status,
        "start_date": project.start_date,
        "target_completion_date": project.target_completion_date,
        "contract_value": project.contract_value,
        "duration_months": project.duration_months,
        "scope": project.scope,
        "milestones": project.milestones,
        "square_footage": project.square_footage,
        "floor_count": project.floor_count,
        "complexity_level": project.complexity_level,
        "priority_score": project.priority_score,
    }
    for key, value in persisted_fields.items():
        if value is not None:
            status = "✓" if key in contract_output else "?"
            logger.info(f"  {status} {key}: {value}")
    
    not_persisted = set(contract_output.keys()) - set(persisted_fields.keys())
    if not_persisted:
        logger.warning(f"\nAgent fields NOT persisted: {not_persisted}")


async def analyze_permit_agent(session: AsyncSession, project_id: int, outputs: dict):
    """Analyze PermitAgent output vs persisted Permit fields."""
    logger.info("\n>>> PERMITAGENT OUTPUT ANALYSIS:")
    permit_output = outputs["PermitAgent"]
    
    required_permits = permit_output.get("required_permits", [])
    logger.info(f"Agent returns {len(required_permits)} permits")
    
    if required_permits:
        permit_sample = required_permits[0]
        logger.info(f"Sample permit fields: {list(permit_sample.keys())}")
        for key in sorted(permit_sample.keys()):
            logger.info(f"  • {key}: {permit_sample[key]}")

    # Check persisted permits
    permit_repo = PermitRepository(session)
    permits = await permit_repo.list_by_project(project_id)
    logger.info(f"\nPersisted in Permit table: {len(permits)} records")
    
    if permits:
        perm = permits[0]
        persisted_fields = {
            "permit_name": perm.permit_name,
            "permit_type": perm.permit_type,
            "status": perm.status,
            "approval_days": perm.approval_days,
            "required_documents": perm.required_documents,
        }
        logger.info("Sample persisted permit:")
        for key, value in persisted_fields.items():
            if value:
                logger.info(f"  • {key}: {value}")
        
        if required_permits:
            agent_keys = set(required_permits[0].keys())
            db_keys = set(persisted_fields.keys())
            not_persisted = agent_keys - db_keys
            if not_persisted:
                logger.warning(f"  Agent fields NOT persisted: {not_persisted}")


async def analyze_schedule_agent(session: AsyncSession, project_id: int, outputs: dict):
    """Analyze ScheduleAgent output vs persisted Schedule fields."""
    logger.info("\n>>> SCHEDULEAGENT OUTPUT ANALYSIS:")
    schedule_output = outputs["ScheduleAgent"]
    
    logger.info(f"Agent returns {len(schedule_output)} top-level fields:")
    for key in sorted(schedule_output.keys()):
        value = schedule_output[key]
        if isinstance(value, list):
            logger.info(f"  • {key}: list of {len(value)} items")
            if value and isinstance(value[0], dict):
                logger.info(f"    - Sample item keys: {list(value[0].keys())}")
        else:
            logger.info(f"  • {key}: {type(value).__name__}")

    # Check persisted schedules
    schedule_repo = ScheduleRepository(session)
    schedules = await schedule_repo.list_by_project(project_id)
    logger.info(f"\nPersisted in Schedule table: {len(schedules)} records")
    
    if schedules:
        sched = schedules[0]
        logger.info("Sample persisted schedule:")
        logger.info(f"  • total_duration_days: {sched.total_duration_days}")
        
        if sched.phase_breakdown:
            phases = json.loads(sched.phase_breakdown)
            logger.info(f"  • phase_breakdown: {len(phases)} phases (JSON)")
            if phases and isinstance(phases[0], dict):
                logger.info(f"    - First phase keys: {list(phases[0].keys())}")
        
        if sched.work_packages:
            work_pkg = json.loads(sched.work_packages)
            logger.info(f"  • work_packages: keys={list(work_pkg.keys())} (JSON)")
            if work_pkg.get("dependencies"):
                logger.info(f"    - dependencies: {len(work_pkg['dependencies'])} items")
            if work_pkg.get("materials"):
                logger.info(f"    - materials: {len(work_pkg['materials'])} items")

    # Check inspections
    inspection_repo = InspectionRepository(session)
    inspections = await inspection_repo.list_by_project(project_id)
    logger.info(f"\nPersisted in Inspection table: {len(inspections)} records")
    
    inspection_stages = schedule_output.get("inspection_stages", [])
    logger.info(f"Agent provided {len(inspection_stages)} inspection stages")
    
    not_persisted_count = max(0, len(inspection_stages) - len(inspections))
    if not_persisted_count > 0:
        logger.warning(f"  ⚠ {not_persisted_count} inspection stages not fully persisted")


async def analyze_supplier_agent(session: AsyncSession, project_id: int, outputs: dict):
    """Analyze SupplierAgent output vs persisted ProjectSupplier fields."""
    logger.info("\n>>> SUPPLIERAGENT OUTPUT ANALYSIS:")
    supplier_output = outputs["SupplierAgent"]
    
    logger.info(f"Agent returns {len(supplier_output)} top-level fields:")
    for key in sorted(supplier_output.keys()):
        value = supplier_output[key]
        if isinstance(value, list):
            logger.info(f"  • {key}: list of {len(value)} items")
        else:
            logger.info(f"  • {key}: {type(value).__name__}")

    # Check persisted suppliers
    supplier_repo = ProjectSupplierRepository(session)
    suppliers = await supplier_repo.list_by_project(project_id)
    logger.info(f"\nPersisted in ProjectSupplier table: {len(suppliers)} records")
    
    procurement_plan = supplier_output.get("procurement_plan", [])
    logger.info(f"Agent provided {len(procurement_plan)} procurement items")
    
    if suppliers:
        supp = suppliers[0]
        persisted_fields = {
            "supplier_name": supp.supplier_name,
            "material_name": supp.material_name,
            "quantity": supp.quantity,
            "unit_price": supp.unit_price,
            "delivery_date": supp.delivery_date,
            "total_cost": supp.total_cost,
        }
        logger.info("Sample persisted supplier:")
        for key, value in persisted_fields.items():
            if value:
                logger.info(f"  • {key}: {value}")

    # Check supply chain risks
    supply_risks = supplier_output.get("supply_chain_risks", [])
    logger.info(f"\nSupply Chain Risks from agent: {len(supply_risks)} risks")
    
    if supply_risks:
        logger.info(f"  Sample risk fields: {list(supply_risks[0].keys())}")
        for key in sorted(supply_risks[0].keys()):
            logger.info(f"    • {key}: {supply_risks[0][key]}")
    
    # Check project risks
    risk_repo = ProjectRiskRepository(session)
    risks = await risk_repo.list_by_project(project_id)
    supply_chain_risks = [r for r in risks if r.category == "supply_chain"]
    logger.info(f"\nSupply Chain Risks in DB: {len(supply_chain_risks)} records")
    
    if supply_chain_risks:
        risk = supply_chain_risks[0]
        logger.info(f"  Sample risk:")
        logger.info(f"    • title: {risk.title}")
        logger.info(f"    • severity: {risk.severity}")
        logger.info(f"    • detail: {risk.detail[:60]}...")


async def analyze_crew_agent(session: AsyncSession, project_id: int, outputs: dict):
    """Analyze CrewAgent output vs persisted CrewPlan fields."""
    logger.info("\n>>> CREWAGENT OUTPUT ANALYSIS:")
    crew_output = outputs["CrewAgent"]
    
    logger.info(f"Agent returns {len(crew_output)} top-level fields:")
    for key in sorted(crew_output.keys()):
        value = crew_output[key]
        if isinstance(value, list):
            logger.info(f"  • {key}: list of {len(value)} items")
        else:
            logger.info(f"  • {key}: {type(value).__name__}")

    # Check persisted crew
    crew_repo = CrewPlanRepository(session)
    crew_plans = await crew_repo.list_by_project(project_id)
    logger.info(f"\nPersisted in CrewPlan table: {len(crew_plans)} records")
    
    crew_allocations = crew_output.get("crew_allocations", [])
    logger.info(f"Agent provided {len(crew_allocations)} crew allocations")
    
    if crew_plans:
        crew = crew_plans[0]
        persisted_fields = {
            "crew_name": crew.crew_name,
            "skill_type": crew.skill_type,
            "phase_name": crew.phase_name,
            "labor_cost": crew.labor_cost,
            "start_date": crew.start_date,
            "end_date": crew.end_date,
        }
        logger.info("Sample persisted crew plan:")
        for key, value in persisted_fields.items():
            if value:
                logger.info(f"  • {key}: {value}")

    # Check workforce gaps
    workforce_gaps = crew_output.get("workforce_gaps", [])
    logger.info(f"\nWorkforce Gaps from agent: {len(workforce_gaps)} gaps")
    
    if workforce_gaps:
        logger.info(f"  Sample gap fields: {list(workforce_gaps[0].keys())}")
        for key in sorted(workforce_gaps[0].keys()):
            logger.info(f"    • {key}: {workforce_gaps[0][key]}")
    
    # Check project risks for workforce gaps
    risk_repo = ProjectRiskRepository(session)
    risks = await risk_repo.list_by_project(project_id)
    workforce_risks = [r for r in risks if r.category == "workforce"]
    logger.info(f"\nWorkforce Risks in DB: {len(workforce_risks)} records")
    
    if workforce_risks:
        risk = workforce_risks[0]
        logger.info(f"  Sample risk:")
        logger.info(f"    • title: {risk.title}")
        logger.info(f"    • detail: {risk.detail[:60]}...")


if __name__ == "__main__":
    asyncio.run(analyze_persistence())
