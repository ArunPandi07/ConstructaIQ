from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.project_service import get_dashboard


@pytest.mark.asyncio
async def test_get_dashboard_risk_kpis_from_repository():
    session = AsyncMock()
    project = MagicMock()
    project.project_id = 1
    project.project_name = "Tower"
    project.status = "active"
    project.contract_value = None
    project.target_completion_date = None

    with patch("app.services.project_service.ProjectRepository") as repo_cls, patch(
        "app.services.project_service.AgentExecutionRepository"
    ) as exec_cls, patch(
        "app.services.project_service.PermitRepository"
    ) as permit_cls, patch(
        "app.services.project_service.ProjectRiskRepository"
    ) as risk_cls:
        repo_cls.return_value.list_desc = AsyncMock(return_value=[project])
        exec_repo = exec_cls.return_value
        exec_repo.list_recent_global = AsyncMock(return_value=[])
        exec_repo.list_by_projects = AsyncMock(return_value=[])
        exec_repo.list_by_project = AsyncMock(return_value=[])
        permit_repo = permit_cls.return_value
        permit_repo.list_by_projects = AsyncMock(return_value=[])
        permit_repo.list_by_project = AsyncMock(return_value=[])
        risk_repo = risk_cls.return_value
        risk_repo.count_open_global = AsyncMock(return_value=5)
        risk_repo.count_risk_projects_global = AsyncMock(return_value=2)
        risk_repo.count_open_with_detail_global = AsyncMock(return_value=3)
        risk_repo.count_by_category_global = AsyncMock(
            return_value={"supply_chain": 3, "workforce": 2}
        )
        risk_repo.list_by_projects = AsyncMock(return_value=[])
        risk_repo.list_by_project = AsyncMock(return_value=[])

        with patch(
            "app.services.project_service.ProjectSupplierRepository"
        ) as sup_cls, patch(
            "app.services.project_service.CrewPlanRepository"
        ) as crew_cls, patch(
            "app.services.project_service.ScheduleRepository"
        ) as sched_cls, patch(
            "app.services.project_service.BudgetRepository"
        ) as budget_cls:
            sup_cls.return_value.list_by_projects = AsyncMock(return_value=[])
            sup_cls.return_value.list_by_project = AsyncMock(return_value=[])
            crew_cls.return_value.list_by_projects = AsyncMock(return_value=[])
            crew_cls.return_value.list_by_project = AsyncMock(return_value=[])
            sched_cls.return_value.list_by_projects = AsyncMock(return_value=[])
            sched_cls.return_value.list_by_project = AsyncMock(return_value=[])
            budget_cls.return_value.list_by_projects = AsyncMock(return_value=[])
            budget_cls.return_value.list_by_project = AsyncMock(return_value=[])

            dashboard = await get_dashboard(session)

    assert dashboard.kpi.open_risks == 5
    assert dashboard.kpi.risk_projects == 2
    assert dashboard.kpi.recovery_plans == 3
    assert len(dashboard.risk_distribution) == 2
    permit_repo.list_by_projects.assert_awaited()
    permit_repo.list_by_project.assert_not_awaited()
    exec_repo.list_by_projects.assert_awaited()
    exec_repo.list_by_project.assert_not_awaited()
    risk_repo.list_by_projects.assert_awaited()
    risk_repo.list_by_project.assert_not_awaited()
