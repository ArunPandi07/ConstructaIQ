from datetime import date
from decimal import Decimal

from app.db.models.crew_plan import CrewPlan
from app.db.models.permit import Permit
from app.db.models.project import Project
from app.db.models.schedule import Schedule
from app.services.response_mapper import map_project_intelligence


def test_map_project_intelligence():
    project = Project(
        project_id=42,
        project_name="Tower A",
        client_name="ACME",
        location="Chicago",
        contract_value=Decimal("186000000"),
        duration_months=28,
        start_date=date(2026, 1, 1),
        target_completion_date=date(2028, 5, 1),
        floor_count=42,
        complexity_level="High",
        project_type="Commercial",
        square_footage=Decimal("500000"),
    )
    permits = [
        Permit(
            permit_id=1,
            project_id=42,
            permit_name="Building Permit",
            status="Pending",
        )
    ]
    schedules = [
        Schedule(
            schedule_id=1,
            project_id=42,
            total_duration_days=840,
            phase_breakdown='[{"name": "Foundation", "status": "pending"}]',
        )
    ]
    crew_plans = [
        CrewPlan(
            crew_plan_id=1,
            project_id=42,
            phase_name="Foundation",
            crew_name="Alice",
        ),
        CrewPlan(
            crew_plan_id=2,
            project_id=42,
            phase_name="Foundation",
            crew_name="Bob",
        ),
    ]

    result = map_project_intelligence(project, permits, schedules, crew_plans)

    assert result["projectId"] == "42"
    assert result["name"] == "Tower A"
    assert len(result["requiredPermits"]) == 1
    assert result["requiredPermits"][0]["status"] == "Pending"
    assert len(result["crewRequirements"]) == 1
    assert result["crewRequirements"][0]["count"] == 2
    assert len(result["phases"]) == 1

