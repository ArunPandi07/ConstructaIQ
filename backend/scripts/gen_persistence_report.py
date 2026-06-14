#!/usr/bin/env python3
"""
Comprehensive report: Agent outputs vs Database persistence
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

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

logger = get_logger("PersistenceReport")


async def generate_report():
    """Generate persistence analysis report."""
    if not settings.DATABASE_URL:
        logger.error("DATABASE_URL not configured")
        return

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    report = {
        "timestamp": str(__import__('datetime').datetime.now()),
        "agent_analysis": {},
        "gaps": [],
        "recommendations": []
    }

    try:
        async with async_session() as session:
            # Get first seeded project
            repo = ProjectRepository(session)
            project = await repo.get_by_id(1)
            if not project:
                logger.error("No projects found")
                return

            fixture = DEMO_PROJECT_FIXTURES[0]
            pipeline = fixture["pipeline"]

            # Analyze each agent
            report["agent_analysis"]["contractagent"] = await analyze_contract(session, project, pipeline)
            report["agent_analysis"]["permitagent"] = await analyze_permits(session, project, pipeline)
            report["agent_analysis"]["scheduleagent"] = await analyze_schedule(session, project, pipeline)
            report["agent_analysis"]["supplieragent"] = await analyze_supplier(session, project, pipeline)
            report["agent_analysis"]["crewagent"] = await analyze_crew(session, project, pipeline)

            # Identify gaps
            report["gaps"] = identify_gaps(report["agent_analysis"])
            report["recommendations"] = generate_recommendations(report["gaps"])

            # Print report
            print_report(report)

    finally:
        await engine.dispose()


async def analyze_contract(session: AsyncSession, project, pipeline: dict):
    """Analyze ContractAgent output."""
    agent_data = pipeline.get("projectSummary", {})
    db_fields = {
        "project_name": project.project_name,
        "client_name": project.client_name,
        "budget": project.contract_value,
        "location": project.location,
        "scope": project.scope,
        "start_date": project.start_date,
        "target_completion_date": project.target_completion_date,
        "duration_months": project.duration_months,
        "square_footage": project.square_footage,
        "floor_count": project.floor_count,
        "complexity_level": project.complexity_level,
        "project_type": project.project_type,
        "milestones": project.milestones,
    }

    persisted = {k: v for k, v in db_fields.items() if v is not None}
    agent_keys = set(agent_data.keys())
    persisted_keys = set(persisted.keys())
    
    return {
        "agent_output_fields": len(agent_keys),
        "agent_output_keys": list(agent_keys),
        "persisted_fields": len(persisted_keys),
        "persisted_keys": list(persisted_keys),
        "coverage": f"{len(persisted_keys & agent_keys)}/{len(agent_keys)} ({round(100*len(persisted_keys & agent_keys)/len(agent_keys))})%",
        "missing_fields": list(agent_keys - persisted_keys),
    }


async def analyze_permits(session: AsyncSession, project, pipeline: dict):
    """Analyze PermitAgent output."""
    agent_data = pipeline.get("permitAssessment", {})
    agent_permits = agent_data.get("required_permits", [])
    
    permit_repo = PermitRepository(session)
    db_permits = await permit_repo.list_by_project(project.project_id)
    
    if agent_permits:
        agent_keys = set(agent_permits[0].keys())
    else:
        agent_keys = set()
    
    db_fields = ["permit_name", "permit_category", "status", "estimated_approval_days", "application_reference", "required_documents", "critical_path_impact"]
    
    return {
        "agent_permits": len(agent_permits),
        "agent_fields_per_permit": list(agent_keys),
        "persisted_permits": len(db_permits),
        "persisted_fields": db_fields,
        "coverage": f"{len(db_permits)}/{len(agent_permits)} permits persisted",
        "fields_missing": list(agent_keys - set(db_fields)),
    }


async def analyze_schedule(session: AsyncSession, project, pipeline: dict):
    """Analyze ScheduleAgent output."""
    agent_data = pipeline.get("projectPlan", {})
    
    schedule_repo = ScheduleRepository(session)
    db_schedules = await schedule_repo.list_by_project(project.project_id)
    
    inspection_repo = InspectionRepository(session)
    db_inspections = await inspection_repo.list_by_project(project.project_id)
    
    agent_phases = agent_data.get("project_phases", [])
    agent_inspections = agent_data.get("inspection_stages", [])
    
    return {
        "agent_phases": len(agent_phases),
        "agent_inspection_stages": len(agent_inspections),
        "persisted_schedules": len(db_schedules),
        "persisted_inspections": len(db_inspections),
        "schedule_fields": ["total_duration_days", "phase_breakdown (JSON)", "work_packages (JSON)"],
        "inspection_fields": ["inspection_name", "inspection_phase", "inspection_date", "status"],
        "notes": "Phases stored in phase_breakdown JSON, dependencies/materials in work_packages JSON",
    }


async def analyze_supplier(session: AsyncSession, project, pipeline: dict):
    """Analyze SupplierAgent output."""
    agent_data = pipeline.get("supplierAnalysis", {})
    
    supplier_repo = ProjectSupplierRepository(session)
    db_suppliers = await supplier_repo.list_by_project(project.project_id)
    
    risk_repo = ProjectRiskRepository(session)
    db_risks = await risk_repo.list_by_project(project.project_id)
    supply_risks = [r for r in db_risks if r.category == "supply_chain"]
    
    agent_procurement = agent_data.get("procurement_plan", [])
    agent_risks = agent_data.get("supply_chain_risks", [])
    
    return {
        "agent_procurement_items": len(agent_procurement),
        "persisted_suppliers": len(db_suppliers),
        "agent_risk_count": len(agent_risks),
        "persisted_supply_chain_risks": len(supply_risks),
        "supplier_fields": ["supplier_name", "material_name", "quantity", "unit_price", "delivery_date", "total_cost"],
        "notes": "Supply chain risks stored in project_risks table",
    }


async def analyze_crew(session: AsyncSession, project, pipeline: dict):
    """Analyze CrewAgent output."""
    agent_data = pipeline.get("crewAnalysis", {})
    
    crew_repo = CrewPlanRepository(session)
    db_crew = await crew_repo.list_by_project(project.project_id)
    
    risk_repo = ProjectRiskRepository(session)
    db_risks = await risk_repo.list_by_project(project.project_id)
    workforce_risks = [r for r in db_risks if r.category == "workforce"]
    
    agent_allocations = agent_data.get("crew_allocations", [])
    agent_gaps = agent_data.get("workforce_gaps", [])
    
    return {
        "agent_crew_allocations": len(agent_allocations),
        "persisted_crew_plans": len(db_crew),
        "agent_workforce_gaps": len(agent_gaps),
        "persisted_workforce_risks": len(workforce_risks),
        "crew_fields": ["crew_name", "skill_type", "phase_name", "labor_cost", "start_date", "end_date"],
        "notes": "Workforce gaps stored in project_risks table",
    }


def identify_gaps(analysis: dict) -> list:
    """Identify gaps in persistence."""
    gaps = []
    
    # Contract gaps
    contract = analysis.get("contractagent", {})
    if contract.get("missing_fields"):
        gaps.append({
            "agent": "ContractAgent",
            "issue": f"Fields returned but not persisted: {contract['missing_fields']}",
            "severity": "LOW"
        })
    
    # Permit gaps
    permit = analysis.get("permitagent", {})
    if permit.get("fields_missing"):
        gaps.append({
            "agent": "PermitAgent",
            "issue": f"Permit fields not persisted: {permit['fields_missing']}",
            "severity": "MEDIUM"
        })
    
    # Schedule gaps
    schedule = analysis.get("scheduleagent", {})
    agent_phases = schedule.get("agent_phases", 0)
    persisted_phases = schedule.get("persisted_schedules", 0)
    if persisted_phases == 0 and agent_phases > 0:
        gaps.append({
            "agent": "ScheduleAgent",
            "issue": "Schedule record not persisted to DB (only JSON stored)",
            "severity": "MEDIUM"
        })
    
    # Supplier/Risk gaps
    supplier = analysis.get("supplieragent", {})
    agent_risks = supplier.get("agent_risk_count", 0)
    persisted_risks = supplier.get("persisted_supply_chain_risks", 0)
    if persisted_risks < agent_risks:
        gaps.append({
            "agent": "SupplierAgent",
            "issue": f"Supply chain risks: agent provided {agent_risks}, only {persisted_risks} persisted",
            "severity": "MEDIUM"
        })
    
    # Crew gaps
    crew = analysis.get("crewagent", {})
    agent_gaps = crew.get("agent_workforce_gaps", 0)
    persisted_gaps = crew.get("persisted_workforce_risks", 0)
    if persisted_gaps < agent_gaps:
        gaps.append({
            "agent": "CrewAgent",
            "issue": f"Workforce gaps: agent provided {agent_gaps}, only {persisted_gaps} persisted as risks",
            "severity": "MEDIUM"
        })
    
    return gaps


def generate_recommendations(gaps: list) -> list:
    """Generate recommendations for closing gaps."""
    recommendations = []
    
    if any(g["agent"] == "PermitAgent" for g in gaps):
        recommendations.append({
            "action": "Extend Permit model",
            "details": "Add missing permit fields to handle all agent output",
            "impact": "Better permit tracking and compliance"
        })
    
    if any(g["agent"] == "ScheduleAgent" for g in gaps):
        recommendations.append({
            "action": "Add Schedule table columns",
            "details": "Store permit_name, status as proper columns, not just JSON",
            "impact": "Easier querying and reporting"
        })
    
    if any(g["agent"] == "SupplierAgent" for g in gaps):
        recommendations.append({
            "action": "Enhance risk persistence",
            "details": "Ensure all supply_chain_risks from agent are saved to project_risks table",
            "impact": "Complete risk visibility"
        })
    
    if any(g["agent"] == "CrewAgent" for g in gaps):
        recommendations.append({
            "action": "Validate crew risk mapping",
            "details": "Verify all workforce_gaps are converted to project_risks entries",
            "impact": "Comprehensive workforce tracking"
        })
    
    return recommendations


def print_report(report: dict):
    """Print formatted report."""
    print("\n" + "="*100)
    print("AGENT OUTPUT vs DATABASE PERSISTENCE ANALYSIS")
    print("="*100)
    
    print("\n### CONTRACTAGENT ###")
    ca = report["agent_analysis"]["contractagent"]
    print(f"Output fields: {ca['agent_output_fields']}")
    print(f"Persisted fields: {ca['persisted_fields']}")
    print(f"Coverage: {ca['coverage']}")
    if ca["missing_fields"]:
        print(f"NOT PERSISTED: {ca['missing_fields']}")
    
    print("\n### PERMITAGENT ###")
    pa = report["agent_analysis"]["permitagent"]
    print(f"Agent permits: {pa['agent_permits']}")
    print(f"DB permits: {pa['persisted_permits']}")
    print(f"Coverage: {pa['coverage']}")
    if pa.get("fields_missing"):
        print(f"MISSING FIELDS: {pa['fields_missing']}")
    
    print("\n### SCHEDULEAGENT ###")
    sa = report["agent_analysis"]["scheduleagent"]
    print(f"Agent phases: {sa['agent_phases']}")
    print(f"Agent inspection stages: {sa['agent_inspection_stages']}")
    print(f"DB schedules: {sa['persisted_schedules']}")
    print(f"DB inspections: {sa['persisted_inspections']}")
    print(f"Note: {sa['notes']}")
    
    print("\n### SUPPLIERAGENT ###")
    spa = report["agent_analysis"]["supplieragent"]
    print(f"Agent procurement items: {spa['agent_procurement_items']}")
    print(f"DB suppliers: {spa['persisted_suppliers']}")
    print(f"Agent risks: {spa['agent_risk_count']}")
    print(f"DB supply chain risks: {spa['persisted_supply_chain_risks']}")
    print(f"Note: {spa['notes']}")
    
    print("\n### CREWAGENT ###")
    ca = report["agent_analysis"]["crewagent"]
    print(f"Agent crew allocations: {ca['agent_crew_allocations']}")
    print(f"DB crew plans: {ca['persisted_crew_plans']}")
    print(f"Agent workforce gaps: {ca['agent_workforce_gaps']}")
    print(f"DB workforce risks: {ca['persisted_workforce_risks']}")
    print(f"Note: {ca['notes']}")
    
    print("\n" + "="*100)
    print("IDENTIFIED GAPS")
    print("="*100)
    for gap in report["gaps"]:
        print(f"\n[{gap['severity']}] {gap['agent']}")
        print(f"  Issue: {gap['issue']}")
    
    print("\n" + "="*100)
    print("RECOMMENDATIONS")
    print("="*100)
    for rec in report["recommendations"]:
        print(f"\n- {rec['action']}")
        print(f"  Details: {rec['details']}")
        print(f"  Impact: {rec['impact']}")
    
    print("\n" + "="*100)


if __name__ == "__main__":
    asyncio.run(generate_report())
