from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from app.services.project_service import list_projects


def _project(project_id: int, name: str):
    return SimpleNamespace(
        project_id=project_id,
        project_name=name,
        project_type=None,
        location=None,
        client_name=None,
        status="active",
        start_date=None,
        target_completion_date=None,
        contract_value=Decimal("0"),
        duration_months=None,
        scope=None,
        milestones=None,
        square_footage=None,
        floor_count=None,
        complexity_level=None,
        priority_score=None,
    )


@pytest.mark.asyncio
async def test_list_projects_uses_bulk_related_fetches():
    project = _project(1, "Tower")
    execution = SimpleNamespace(
        project_id=1,
        execution_id=10,
        agent_name="ContractAgent",
        status="complete",
    )
    suppliers = [
        SimpleNamespace(project_id=1),
        SimpleNamespace(project_id=1),
    ]
    crew_plans = [SimpleNamespace(project_id=1)]
    schedules = [
        SimpleNamespace(
            project_id=1,
            phase_breakdown='[{"name": "Foundation", "progress": 50}]',
        )
    ]

    with patch("app.services.project_service.ProjectRepository") as repo_cls, patch(
        "app.services.project_service.AgentExecutionRepository"
    ) as exec_cls, patch(
        "app.services.project_service.ProjectSupplierRepository"
    ) as supplier_cls, patch(
        "app.services.project_service.CrewPlanRepository"
    ) as crew_cls, patch(
        "app.services.project_service.ScheduleRepository"
    ) as schedule_cls:
        repo_cls.return_value.list_desc = AsyncMock(return_value=[project])
        exec_cls.return_value.list_by_projects = AsyncMock(return_value=[execution])
        supplier_repo = supplier_cls.return_value
        supplier_repo.list_by_projects = AsyncMock(return_value=suppliers)
        supplier_repo.list_by_project = AsyncMock(return_value=[])
        crew_repo = crew_cls.return_value
        crew_repo.list_by_projects = AsyncMock(return_value=crew_plans)
        crew_repo.list_by_project = AsyncMock(return_value=[])
        schedule_repo = schedule_cls.return_value
        schedule_repo.list_by_projects = AsyncMock(return_value=schedules)
        schedule_repo.list_by_project = AsyncMock(return_value=[])

        items = await list_projects(AsyncMock())

    assert len(items) == 1
    assert items[0].agent_completed == 1
    assert items[0].supplier_count == 2
    assert items[0].crew_count == 1
    assert items[0].phase_progress == 50
    supplier_repo.list_by_projects.assert_awaited_once_with([1], limit=5000)
    crew_repo.list_by_projects.assert_awaited_once_with([1], limit=5000)
    schedule_repo.list_by_projects.assert_awaited_once_with([1], limit=5000)
    supplier_repo.list_by_project.assert_not_awaited()
    crew_repo.list_by_project.assert_not_awaited()
    schedule_repo.list_by_project.assert_not_awaited()
