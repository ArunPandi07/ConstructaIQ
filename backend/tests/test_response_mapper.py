from datetime import date
from decimal import Decimal
import json

from app.db.models.crew_plan import CrewPlan
from app.db.models.agent_execution import AgentExecution
from app.db.models.permit import Permit
from app.db.models.project import Project
from app.db.models.schedule import Schedule
from app.db.models.budget import Budget
from app.db.models.inspection import Inspection
from app.db.models.project_risk import ProjectRisk
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
            phase_breakdown='[{"name": "Foundation", "status": "pending", "start": "2026-01-01", "end": "2026-06-01"}]',
            work_packages='{"dependencies": [{"predecessor": "Foundation", "successor": "Steel"}], "materials": [{"material_name": "Steel", "category": "Structure", "quantity": 100, "unit_price": 5000, "total_cost": 500000}]}',
        )
    ]
    budgets = [
        Budget(
            budget_id=1,
            project_id=42,
            total_budget=Decimal("186000000"),
            material_cost=Decimal("50000000"),
            labor_cost=Decimal("30000000"),
        )
    ]
    inspections = [
        Inspection(
            inspection_id=1,
            project_id=42,
            inspection_name="Foundation Inspection",
            inspection_phase="Foundation",
            status="planned",
        )
    ]
    risks = [
        ProjectRisk(
            risk_id=1,
            project_id=42,
            source_agent="SupplierAgent",
            category="supply_chain",
            title="Steel lead time",
            severity="medium",
            detail="Order early",
            status="open",
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

    result = map_project_intelligence(
        project,
        permits,
        schedules,
        crew_plans,
        budgets=budgets,
        inspections=inspections,
        risks=risks,
        executions=[
            AgentExecution(
                execution_id=1,
                project_id=42,
                agent_name="SupplierAgent",
                agent_version="3",
                status="complete",
                output_json='{"recommended_suppliers": [{"supplier_name": "SteelCo", "rationale": "Preferred supplier", "severity": "medium"}]}',
            )
        ],
        suppliers=[],
    )

    assert result["projectId"] == "42"
    assert result["name"] == "Tower A"
    assert len(result["requiredPermits"]) == 1
    assert result["requiredPermits"][0]["status"] == "Pending"
    assert len(result["crewRequirements"]) == 1
    assert result["crewRequirements"][0]["count"] == 2
    assert len(result["phases"]) == 1
    assert result["phases"][0]["startDate"] == "2026-01-01"
    assert result["budgetBreakdown"] is not None
    assert result["budgetBreakdown"]["material"] == "$50,000,000"
    assert len(result["dependencies"]) == 1
    assert len(result["materials"]) == 1
    assert result["materials"][0]["category"] == "Structure"
    assert result["materials"][0]["totalCost"] == 500000.0
    assert len(result["recommendations"]) == 1
    assert result["recommendations"][0]["sourceAgent"] == "SupplierAgent"


def test_extract_recommendations_permit_risk_no_json_description():
    from app.services.response_mapper import _extract_recommendations

    executions = [
        AgentExecution(
            execution_id=2,
            project_id=42,
            agent_name="PermitAgent",
            agent_version="3",
            status="complete",
            output_json=json.dumps(
                {
                    "compliance_risks": [
                        {"risk": "Delay in obtaining multiple NOCs may delay plan approval"},
                    ],
                    "required_documents": [
                        {"name": "Land ownership documents (Patta, encumbrance certificate)"},
                    ],
                }
            ),
        )
    ]

    recommendations = _extract_recommendations(executions)
    risk = next(r for r in recommendations if "NOCs" in r["title"])
    doc = next(r for r in recommendations if "Land ownership" in r["title"])

    assert risk["description"] == ""
    assert doc["description"] == ""
    assert doc["category"] == "Documents"
