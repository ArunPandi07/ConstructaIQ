from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scripts.demo_project_fixtures import (
    DEMO_PROJECT_FIXTURES,
    PIPELINE_AGENTS,
    build_execution_records,
)

REQUIRED_PIPELINE_KEYS = frozenset(
    {
        "projectSummary",
        "blueprintSummary",
        "permitAssessment",
        "projectPlan",
        "supplierAnalysis",
        "crewAnalysis",
    }
)


def test_demo_fixtures_count_and_keys():
    assert len(DEMO_PROJECT_FIXTURES) == 5
    for fixture in DEMO_PROJECT_FIXTURES:
        pipeline = fixture["pipeline"]
        assert REQUIRED_PIPELINE_KEYS.issubset(pipeline.keys())
        assert pipeline["projectSummary"]["project_name"]


def test_build_execution_records_six_agents():
    pipeline = DEMO_PROJECT_FIXTURES[0]["pipeline"]
    records = build_execution_records(pipeline)
    assert len(records) == len(PIPELINE_AGENTS)
    assert {r["agent_name"] for r in records} == {a[0] for a in PIPELINE_AGENTS}
    for record in records:
        assert record["status"] == "complete"
        assert record["output"] is not None


@pytest.mark.asyncio
async def test_seed_demo_projects_orchestration():
    from scripts.seed_demo_projects import seed_demo_projects

    session = AsyncMock()
    project = MagicMock()
    project.project_id = 1

    with patch("scripts.seed_demo_projects.truncate_project_data", new_callable=AsyncMock) as truncate, patch(
        "scripts.seed_demo_projects.ProjectRepository"
    ) as repo_cls, patch(
        "scripts.seed_demo_projects.persist_analysis_outputs", new_callable=AsyncMock
    ) as persist:
        truncate.return_value = {"projects": 0}
        repo = repo_cls.return_value
        repo.create = AsyncMock(return_value=project)
        persist.return_value = {"permits_created": 1}

        results = await seed_demo_projects(session, skip_reset=False)

    assert len(results) == 5
    assert persist.await_count == 5
    truncate.assert_awaited_once()
    session.commit.assert_awaited()
