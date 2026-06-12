from datetime import date
from decimal import Decimal

from app.services.agent_field_mapper import (
    build_project_summary,
    normalize_blueprint_agent,
    normalize_contract_agent,
    normalize_permit_agent,
)
from app.services.agent_persistence_service import _parse_date, _parse_decimal, _parse_int

CHENNAI_SAMPLE = {
    "project_name": "Chennai Business Tower",
    "client_name": "ABC Infrastructure Pvt Ltd",
    "budget": "₹85 Crores",
    "Projecttype": "Commercial Office Building",
    "location": "OMR, Chennai, Tamil Nadu, India",
    "startdate": "01 January 2027",
    "completiondate": "30 June 2028",
    "duration_months": "18",
    "scope": (
        "Design, construct, and deliver a 12-floor commercial office building "
        "including foundation works, structural construction, electrical systems."
    ),
    "Milestones": [
        {"Milestone": "Site Preparation and Foundation", "Duration": "2 Months"},
        {"Milestone": "Structural Framework", "Duration": "6 Months"},
    ],
}


def test_normalize_contract_agent_chennai_sample():
    result = normalize_contract_agent(CHENNAI_SAMPLE)

    assert result["project_name"] == "Chennai Business Tower"
    assert result["client_name"] == "ABC Infrastructure Pvt Ltd"
    assert result["budget"] == "₹85 Crores"
    assert result["project_type"] == "Commercial Office Building"
    assert result["location"] == "OMR, Chennai, Tamil Nadu, India"
    assert result["start_date"] == "01 January 2027"
    assert result["target_completion_date"] == "30 June 2028"
    assert result["duration_months"] == "18"
    assert len(result["milestones"]) == 2
    assert result["milestones"][0]["name"] == "Site Preparation and Foundation"
    assert result["milestones"][0]["duration"] == "2 Months"


def test_build_project_summary_from_normalized():
    summary = build_project_summary(CHENNAI_SAMPLE)

    assert summary["project_type"] == "Commercial Office Building"
    assert summary["start_date"] == "01 January 2027"
    assert summary["target_completion_date"] == "30 June 2028"
    assert isinstance(summary["milestones"], list)


def test_parse_indian_budget_and_dates():
    assert _parse_decimal("₹85 Crores") == Decimal("850000000")
    assert _parse_decimal("₹5 Lakhs") == Decimal("500000")
    assert _parse_int("18") == 18
    assert _parse_date("01 January 2027") == date(2027, 1, 1)
    assert _parse_date("30 June 2028") == date(2028, 6, 30)


LAKEFRONT_PROBE_SAMPLE = {
    "project_name": "Format Probe Tower",
    "location": "Downtown Chicago",
    "client": "Lakefront Development Partners",
    "building_type": "Mixed-use commercial tower",
    "number_of_floors": 42,
    "budget": 186500000,
    "schedule_months": 28,
    "gross_square_feet": 1250000,
}


def test_normalize_contract_agent_lakefront_probe():
    result = normalize_contract_agent(LAKEFRONT_PROBE_SAMPLE)

    assert result["project_name"] == "Format Probe Tower"
    assert result["client_name"] == "Lakefront Development Partners"
    assert result["project_type"] == "Mixed-use commercial tower"
    assert result["floor_count"] == 42
    assert result["budget"] == 186500000
    assert result["duration_months"] == 28
    assert result["square_footage"] == 1250000
    assert result["location"] == "Downtown Chicago"


def test_build_project_summary_blueprint_fallback():
    contract = {"project_name": "Tower A", "location": "Chicago"}
    blueprint = {
        "client": "Lakefront Development Partners",
        "budget_usd": 186500000,
        "floors": 42,
        "type": "Mixed-use commercial tower",
    }
    summary = build_project_summary(contract, blueprint_data=blueprint)

    assert summary["project_name"] == "Tower A"
    assert summary["location"] == "Chicago"
    assert summary["client_name"] == "Lakefront Development Partners"
    assert summary["budget"] == 186500000
    assert summary["floor_count"] == 42
    assert summary["project_type"] == "Mixed-use commercial tower"


def test_build_project_summary_contract_wins_over_blueprint():
    contract = {"client": "Primary Client", "budget": 100}
    blueprint = {"client": "Blueprint Client", "budget_usd": 200}
    summary = build_project_summary(contract, blueprint_data=blueprint)

    assert summary["client_name"] == "Primary Client"
    assert summary["budget"] == 100


def test_normalize_blueprint_agent_probe_keys():
    result = normalize_blueprint_agent(
        {
            "budget_usd": 186500000,
            "schedule_months": 28,
            "gross_square_footage": 1250000,
        }
    )
    assert result["budget"] == 186500000
    assert result["duration_months"] == 28
    assert result["square_footage"] == 1250000


def test_normalize_permit_agent_string_list():
    result = normalize_permit_agent(
        {
            "required_permits": [
                "Building Permit (full plan review)",
                "Electrical Permit",
            ],
            "approval_days": 41,
            "compliance_risks": ["Zoning variance risk"],
            "required_documents": ["Site plan", "Structural calcs"],
        }
    )

    assert len(result["required_permits"]) == 2
    assert result["required_permits"][0]["name"] == "Building Permit (full plan review)"
    assert result["required_permits"][0]["status"] == "required"
    assert result["required_permits"][0]["estimated_approval_days"] == 41
    assert result["approval_days"] == 41
    assert result["compliance_risks"] == ["Zoning variance risk"]


def test_empty_template_fields_omitted():
    empty_template = {
        "project_name": "",
        "client_name": "",
        "budget": "",
        "Projecttype": "",
        "location": "",
        "startdate": "",
        "completiondate": "",
        "duration_months": "",
        "scope": "",
        "Milestones": [],
    }
    result = normalize_contract_agent(empty_template)
    assert result == {}


def test_normalize_contract_agent_flattens_nested_wrapper():
    nested = {
        "project_name": "Lakefront Mixed-Use Tower — Phase 1",
        "location": "1200 South Lakeshore Drive, Chicago, IL 60605",
        "project_type": "Mixed-Use Commercial / Residential High-Rise",
        "duration_months": 28,
        "extracted_parameters": {
            "client_name": "Lakefront Development Partners, LLC",
            "budget": 186500000,
            "scope": "42-story mixed-use tower",
            "startdate": "2026-03-01",
            "targetCompletionDate": "2028-07-01",
            "Milestones": [
                {"Milestone": "Notice to Proceed", "Duration": "Month 1"},
            ],
        },
    }
    result = normalize_contract_agent(nested)

    assert result["client_name"] == "Lakefront Development Partners, LLC"
    assert result["budget"] == 186500000
    assert result["scope"] == "42-story mixed-use tower"
    assert result["start_date"] == "2026-03-01"
    assert result["target_completion_date"] == "2028-07-01"
    assert len(result["milestones"]) == 1


def test_build_project_summary_nested_contract_matches_user_symptom():
    """Top-level schedule/location fields without nested client/budget should merge blueprint."""
    contract = {
        "project_name": "Lakefront Mixed-Use Tower — Phase 1",
        "location": "1200 South Lakeshore Drive, Chicago, IL 60605",
        "project_type": "Mixed-Use Commercial / Residential High-Rise",
        "schedule_months": 28,
        "extracted_parameters": {
            "client_name": "Lakefront Development Partners, LLC",
            "budget": 186500000,
            "scope": "42-story mixed-use tower",
        },
    }
    summary = build_project_summary(contract)

    assert summary["duration_months"] == 28
    assert summary["client_name"] == "Lakefront Development Partners, LLC"
    assert summary["budget"] == 186500000
    assert summary["scope"] == "42-story mixed-use tower"
