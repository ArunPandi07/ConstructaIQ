import json

from app.orchestrator.analyze_orchestrator import (
    _slim_blueprint_for_agents,
    _slim_planning_for_agents,
)
from app.services.building_templates import generate_building_definition


def test_slim_blueprint_drops_large_geometry():
    contract = {"floor_count": 42, "square_footage": 1250000}
    blueprint = {}
    full_bd = generate_building_definition(blueprint, contract)
    blueprint_data = {
        "stories_above_grade": 42,
        "construction_type": "post-tensioned concrete",
        "building_definition": full_bd,
        "levels": full_bd["levels"][:1],
    }

    full_size = len(json.dumps(blueprint_data))
    slim = _slim_blueprint_for_agents(blueprint_data)
    slim_size = len(json.dumps(slim))

    assert slim_size < full_size / 10
    assert "building_definition" not in slim
    assert "levels" not in slim
    assert slim.get("levels_modeled") == 42
    assert slim.get("building", {}).get("stories") == 42


def test_slim_planning_keeps_schedule_fields_only():
    planning = {
        "project_phases": [{"name": "Foundation"}],
        "materials": [{"material_name": "Steel", "quantity": 10}],
        "crew_requirements": [{"role": "Ironworker", "count": 5}],
        "dependencies": [],
        "raw_response": "should be omitted",
    }
    slim = _slim_planning_for_agents(planning)
    assert "materials" in slim
    assert "raw_response" not in slim
