from datetime import date
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.agent_persistence_service import (
    _parse_date,
    _parse_decimal,
    persist_analysis_outputs,
)


def test_parse_date_iso():
    assert _parse_date("2026-08-01") == date(2026, 8, 1)


def test_parse_date_month_relative():
    start = date(2026, 1, 15)
    assert _parse_date("Month 3", project_start=start) == date(2026, 3, 15)


def test_parse_decimal_with_suffix():
    assert _parse_decimal("$186M") == Decimal("186000000")


@pytest.mark.asyncio
async def test_persist_analysis_outputs_counts():
    pipeline_result = {
        "projectSummary": {
            "client_name": "ACME",
            "budget": "1000000",
            "duration_months": 12,
            "scope": "Tower build",
        },
        "permitAssessment": {
            "required_permits": [
                {"name": "Building Permit", "status": "Pending", "estimated_days": 30}
            ]
        },
        "projectPlan": {
            "estimated_duration_days": 365,
            "project_phases": [{"name": "Foundation", "status": "pending"}],
            "inspection_stages": ["Foundation Inspection"],
            "dependencies": [{"predecessor": "A", "successor": "B"}],
            "materials": [{"material_name": "Steel", "quantity": 10}],
        },
        "supplierAnalysis": {
            "supply_chain_risks": [
                {"risk": "Lead time", "severity": "high", "mitigation": "Order early"}
            ],
            "procurement_plan": [
                {
                    "material_name": "Steel",
                    "supplier_name": "SteelCo",
                    "total_cost": 50000,
                }
            ]
        },
        "crewAnalysis": {
            "workforce_gaps": [{"role": "Electrician", "shortage": "3 workers"}],
            "crew_allocations": [
                {
                    "phase_name": "Foundation",
                    "crew_name": "Alice",
                    "labor_cost": 10000,
                    "start_date": "Month 1",
                }
            ]
        },
    }

    session = AsyncMock()
    project = MagicMock()
    project.start_date = date(2026, 1, 1)

    with patch(
        "app.services.agent_persistence_service.ProjectRepository"
    ) as project_repo_cls, patch(
        "app.services.agent_persistence_service.PermitRepository"
    ) as permit_repo_cls, patch(
        "app.services.agent_persistence_service.ScheduleRepository"
    ) as schedule_repo_cls, patch(
        "app.services.agent_persistence_service.BudgetRepository"
    ) as budget_repo_cls, patch(
        "app.services.agent_persistence_service.InspectionRepository"
    ) as inspection_repo_cls, patch(
        "app.services.agent_persistence_service.AgentExecutionRepository"
    ) as execution_repo_cls, patch(
        "app.services.agent_persistence_service.ProjectSupplierRepository"
    ) as supplier_repo_cls, patch(
        "app.services.agent_persistence_service.CrewPlanRepository"
    ) as crew_repo_cls, patch(
        "app.services.agent_persistence_service.ProjectRiskRepository"
    ) as risk_repo_cls:
        project_repo = project_repo_cls.return_value
        project_repo.get_by_id = AsyncMock(return_value=project)
        project_repo.update = AsyncMock(return_value=project)

        for repo in (
            permit_repo_cls,
            schedule_repo_cls,
            budget_repo_cls,
            inspection_repo_cls,
            supplier_repo_cls,
            crew_repo_cls,
            risk_repo_cls,
        ):
            instance = repo.return_value
            instance.delete_by_project = AsyncMock(return_value=0)
            instance.create = AsyncMock()

        execution_repo_cls.return_value.create = AsyncMock()

        summary = await persist_analysis_outputs(
            session,
            project_id=1,
            pipeline_result=pipeline_result,
            execution_records=[
                {
                    "agent_name": "ContractAgent",
                    "agent_version": "4",
                    "output": {"health_score": 80},
                }
            ],
        )

    assert summary["permits_created"] == 1
    assert summary["schedules_created"] == 1
    assert summary["budgets_created"] == 1
    assert summary["inspections_created"] == 1
    assert summary["project_suppliers_created"] == 1
    assert summary["crew_plans_created"] == 1
    assert summary["agent_executions_created"] == 1
    assert summary["risks_created"] == 2
    schedule_create = schedule_repo_cls.return_value.create.await_args.args[0]
    import json

    wp = json.loads(schedule_create.work_packages)
    assert len(wp["dependencies"]) == 1
    assert len(wp["materials"]) == 1
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_persist_chennai_project_summary_fields():
    from app.services.agent_field_mapper import build_project_summary
    from tests.test_agent_field_mapper import CHENNAI_SAMPLE

    pipeline_result = {
        "projectSummary": build_project_summary(CHENNAI_SAMPLE),
        "permitAssessment": {},
        "projectPlan": {"inspection_stages": []},
        "supplierAnalysis": {"procurement_plan": []},
        "crewAnalysis": {"crew_allocations": []},
    }

    session = AsyncMock()
    project = MagicMock()
    project.start_date = None

    with patch(
        "app.services.agent_persistence_service.ProjectRepository"
    ) as project_repo_cls, patch(
        "app.services.agent_persistence_service.PermitRepository"
    ) as permit_repo_cls, patch(
        "app.services.agent_persistence_service.ScheduleRepository"
    ) as schedule_repo_cls, patch(
        "app.services.agent_persistence_service.BudgetRepository"
    ) as budget_repo_cls, patch(
        "app.services.agent_persistence_service.InspectionRepository"
    ) as inspection_repo_cls, patch(
        "app.services.agent_persistence_service.ProjectSupplierRepository"
    ) as supplier_repo_cls, patch(
        "app.services.agent_persistence_service.CrewPlanRepository"
    ) as crew_repo_cls, patch(
        "app.services.agent_persistence_service.ProjectRiskRepository"
    ) as risk_repo_cls:
        project_repo = project_repo_cls.return_value
        project_repo.get_by_id = AsyncMock(return_value=project)
        project_repo.update = AsyncMock(return_value=project)

        for repo in (
            permit_repo_cls,
            schedule_repo_cls,
            budget_repo_cls,
            inspection_repo_cls,
            supplier_repo_cls,
            crew_repo_cls,
            risk_repo_cls,
        ):
            instance = repo.return_value
            instance.delete_by_project = AsyncMock(return_value=0)
            instance.create = AsyncMock()

        await persist_analysis_outputs(session, project_id=1, pipeline_result=pipeline_result)

    project_repo.update.assert_awaited_once()
    update_arg = project_repo.update.await_args.args[1]
    assert update_arg.client_name == "ABC Infrastructure Pvt Ltd"
    assert update_arg.contract_value == Decimal("850000000")
    assert update_arg.duration_months == 18
    assert update_arg.project_type == "Commercial Office Building"
    assert update_arg.location == "OMR, Chennai, Tamil Nadu, India"
    assert update_arg.start_date == date(2027, 1, 1)
    assert update_arg.target_completion_date == date(2028, 6, 30)


@pytest.mark.asyncio
async def test_persist_nested_contract_summary_fields():
    from app.services.agent_field_mapper import build_project_summary

    contract = {
        "project_name": "Lakefront Mixed-Use Tower — Phase 1",
        "location": "Chicago, IL",
        "project_type": "Mixed-Use High-Rise",
        "schedule_months": 28,
        "extracted_parameters": {
            "client_name": "Lakefront Development Partners, LLC",
            "budget": 186500000,
            "scope": "42-story tower",
            "startdate": "2026-03-01",
            "completiondate": "2028-07-01",
        },
    }
    pipeline_result = {
        "projectSummary": build_project_summary(contract),
        "permitAssessment": {},
        "projectPlan": {"inspection_stages": []},
        "supplierAnalysis": {"procurement_plan": []},
        "crewAnalysis": {"crew_allocations": []},
    }

    session = AsyncMock()
    project = MagicMock()
    project.start_date = None

    with patch(
        "app.services.agent_persistence_service.ProjectRepository"
    ) as project_repo_cls, patch(
        "app.services.agent_persistence_service.PermitRepository"
    ) as permit_repo_cls, patch(
        "app.services.agent_persistence_service.ScheduleRepository"
    ) as schedule_repo_cls, patch(
        "app.services.agent_persistence_service.BudgetRepository"
    ) as budget_repo_cls, patch(
        "app.services.agent_persistence_service.InspectionRepository"
    ) as inspection_repo_cls, patch(
        "app.services.agent_persistence_service.ProjectSupplierRepository"
    ) as supplier_repo_cls, patch(
        "app.services.agent_persistence_service.CrewPlanRepository"
    ) as crew_repo_cls, patch(
        "app.services.agent_persistence_service.ProjectRiskRepository"
    ) as risk_repo_cls:
        project_repo = project_repo_cls.return_value
        project_repo.get_by_id = AsyncMock(return_value=project)
        project_repo.update = AsyncMock(return_value=project)

        for repo in (
            permit_repo_cls,
            schedule_repo_cls,
            budget_repo_cls,
            inspection_repo_cls,
            supplier_repo_cls,
            crew_repo_cls,
            risk_repo_cls,
        ):
            instance = repo.return_value
            instance.delete_by_project = AsyncMock(return_value=0)
            instance.create = AsyncMock()

        await persist_analysis_outputs(session, project_id=19, pipeline_result=pipeline_result)

    update_arg = project_repo.update.await_args.args[1]
    assert update_arg.client_name == "Lakefront Development Partners, LLC"
    assert update_arg.contract_value == Decimal("186500000")
    assert update_arg.duration_months == 28
    assert update_arg.scope == "42-story tower"
    assert update_arg.start_date == date(2026, 3, 1)
    assert update_arg.target_completion_date == date(2028, 7, 1)


@pytest.mark.asyncio
async def test_persist_string_permit_list():
    pipeline_result = {
        "projectSummary": {"project_name": "Tower"},
        "permitAssessment": {
            "required_permits": [
                "Building Permit (full plan review)",
                "Electrical Permit",
            ],
            "approval_days": 41,
        },
        "projectPlan": {"inspection_stages": []},
        "supplierAnalysis": {"procurement_plan": []},
        "crewAnalysis": {"crew_allocations": []},
    }

    session = AsyncMock()
    project = MagicMock()
    project.start_date = None

    with patch(
        "app.services.agent_persistence_service.ProjectRepository"
    ) as project_repo_cls, patch(
        "app.services.agent_persistence_service.PermitRepository"
    ) as permit_repo_cls, patch(
        "app.services.agent_persistence_service.ScheduleRepository"
    ) as schedule_repo_cls, patch(
        "app.services.agent_persistence_service.BudgetRepository"
    ) as budget_repo_cls, patch(
        "app.services.agent_persistence_service.InspectionRepository"
    ) as inspection_repo_cls, patch(
        "app.services.agent_persistence_service.ProjectSupplierRepository"
    ) as supplier_repo_cls, patch(
        "app.services.agent_persistence_service.CrewPlanRepository"
    ) as crew_repo_cls, patch(
        "app.services.agent_persistence_service.ProjectRiskRepository"
    ) as risk_repo_cls:
        project_repo = project_repo_cls.return_value
        project_repo.get_by_id = AsyncMock(return_value=project)
        project_repo.update = AsyncMock(return_value=project)

        for repo in (
            permit_repo_cls,
            schedule_repo_cls,
            budget_repo_cls,
            inspection_repo_cls,
            supplier_repo_cls,
            crew_repo_cls,
            risk_repo_cls,
        ):
            instance = repo.return_value
            instance.delete_by_project = AsyncMock(return_value=0)
            instance.create = AsyncMock()

        summary = await persist_analysis_outputs(
            session, project_id=1, pipeline_result=pipeline_result
        )

    assert summary["permits_created"] == 2
    permit_repo_cls.return_value.create.assert_awaited()


@pytest.mark.asyncio
async def test_persist_crew_allocations_with_headcount_and_skill():
    pipeline_result = {
        "projectSummary": {"project_name": "Tower"},
        "permitAssessment": {},
        "projectPlan": {"inspection_stages": []},
        "supplierAnalysis": {"procurement_plan": []},
        "crewAnalysis": {
            "crew_allocations": [
                {
                    "phase_name": "Steel",
                    "crew_name": "Gang A",
                    "headcount": 24,
                    "skill_type": "Ironworker Local 40",
                    "labor_cost": 120000,
                    "start_date": "2026-04-01",
                    "end_date": "2026-08-01",
                }
            ]
        },
    }

    session = AsyncMock()
    project = MagicMock()
    project.start_date = date(2026, 1, 1)

    with patch(
        "app.services.agent_persistence_service.ProjectRepository"
    ) as project_repo_cls, patch(
        "app.services.agent_persistence_service.PermitRepository"
    ) as permit_repo_cls, patch(
        "app.services.agent_persistence_service.ScheduleRepository"
    ) as schedule_repo_cls, patch(
        "app.services.agent_persistence_service.BudgetRepository"
    ) as budget_repo_cls, patch(
        "app.services.agent_persistence_service.InspectionRepository"
    ) as inspection_repo_cls, patch(
        "app.services.agent_persistence_service.AgentExecutionRepository"
    ) as execution_repo_cls, patch(
        "app.services.agent_persistence_service.ProjectSupplierRepository"
    ) as supplier_repo_cls, patch(
        "app.services.agent_persistence_service.CrewPlanRepository"
    ) as crew_repo_cls, patch(
        "app.services.agent_persistence_service.ProjectRiskRepository"
    ) as risk_repo_cls:
        project_repo_cls.return_value.get_by_id = AsyncMock(return_value=project)
        project_repo_cls.return_value.update = AsyncMock(return_value=project)

        for repo in (
            permit_repo_cls,
            schedule_repo_cls,
            budget_repo_cls,
            inspection_repo_cls,
            supplier_repo_cls,
            crew_repo_cls,
            risk_repo_cls,
        ):
            instance = repo.return_value
            instance.delete_by_project = AsyncMock(return_value=0)
            instance.create = AsyncMock()

        execution_repo_cls.return_value.create = AsyncMock()

        await persist_analysis_outputs(session, project_id=1, pipeline_result=pipeline_result)

    crew_create = crew_repo_cls.return_value.create.await_args.args[0]
    assert crew_create.headcount == 24
    assert crew_create.skill_type == "Ironworker Local 40"
