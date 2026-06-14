from app.orchestrator.analyze_orchestrator import _ensure_building_definition
from app.services.agent_field_mapper import build_project_summary, normalize_blueprint_agent
from app.services.building_templates import (
    is_building_definition_sufficient,
    patch_building_definition_footprint,
)
from app.services.project_metadata_extractor import enrich_project_metadata


def _stub_building_definition(stories: int = 1, walls: int = 0) -> dict:
    return {
        "building": {
            "type": "residential_tower",
            "stories": stories,
            "totalHeight_m": 4.0,
            "footprint": {"width_m": 20, "depth_m": 15},
            "roof_type": "flat",
        },
        "levels": [
            {
                "level": 0,
                "name": "Ground Floor",
                "height_m": 4.0,
                "floorplate": {"width_m": 20, "depth_m": 15},
                "rooms": [],
                "walls": [
                    {
                        "id": f"wall_{index}",
                        "start": {"x": 0, "y": 0},
                        "end": {"x": 20, "y": 0},
                        "thickness_m": 0.3,
                        "type": "exterior",
                    }
                    for index in range(walls)
                ],
                "stairs": [],
            }
        ],
        "facade": {
            "balconies": False,
            "balcony_depth_m": 0,
            "railing_height_m": 1.1,
            "window_pattern": "grid",
            "material": "curtain_wall",
        },
    }


def test_is_building_definition_sufficient_rejects_stub():
    assert is_building_definition_sufficient(_stub_building_definition(stories=57, walls=0)) is False
    assert is_building_definition_sufficient(_stub_building_definition(stories=1, walls=2)) is False


def test_is_building_definition_sufficient_accepts_full_floor():
    assert is_building_definition_sufficient(_stub_building_definition(stories=1, walls=4)) is True


def test_ensure_building_definition_regenerates_stub():
    stub = _stub_building_definition(stories=57, walls=0)
    blueprint_data = {
        "building_definition": stub,
        "stories_above_grade": 57,
        "construction_type": "post-tensioned concrete",
    }
    contract_data = {"floor_count": 57, "square_footage": 1450000}

    result = _ensure_building_definition(blueprint_data, contract_data)
    regenerated = result["building_definition"]

    assert is_building_definition_sufficient(regenerated)
    assert regenerated["building"]["stories"] == 57
    assert len(regenerated["levels"]) == 57
    assert len(regenerated["levels"][0]["walls"]) >= 4


def test_normalize_blueprint_agent_preserves_building_definition():
    payload = {
        "budget_usd": 890000000,
        "floors": 57,
        "buildingDefinition": _stub_building_definition(stories=1, walls=4),
        "likely_structural_details": {"core": "concrete"},
        "building_features": ["marina", "amenity deck"],
    }
    result = normalize_blueprint_agent(payload)

    assert result["budget"] == 890000000
    assert result["floor_count"] == 57
    assert "building_definition" in result
    assert "buildingDefinition" not in result
    assert result["building_definition"]["building"]["stories"] == 1
    assert result["likely_structural_details"] == {"core": "concrete"}
    assert result["building_features"] == ["marina", "amenity deck"]


def test_ensure_building_definition_from_scope_regex_only():
    stub = _stub_building_definition(stories=42, walls=0)
    blueprint_data = {"building_definition": stub}
    contract_data = {
        "scope": "Construction of a 42-story mixed-use commercial / residential high-rise",
    }
    contract_data, blueprint_data = enrich_project_metadata(contract_data, blueprint_data)
    merged_summary = build_project_summary(contract_data, blueprint_data=blueprint_data)

    result = _ensure_building_definition(blueprint_data, merged_summary)
    regenerated = result["building_definition"]

    assert regenerated["building"]["stories"] == 42
    assert len(regenerated["levels"]) == 42


def test_ensure_building_definition_uses_explicit_footprint():
    stub = _stub_building_definition(stories=1, walls=0)
    blueprint_data = {"building_definition": stub}
    contract_data = {
        "floor_count": 10,
        "footprint": {"width_m": 55.0, "depth_m": 45.0},
    }
    merged_summary = build_project_summary(contract_data, blueprint_data=blueprint_data)
    merged_summary["footprint"] = contract_data["footprint"]

    result = _ensure_building_definition(blueprint_data, merged_summary)
    regenerated = result["building_definition"]

    assert regenerated["building"]["footprint"]["width_m"] == 55.0
    assert regenerated["building"]["footprint"]["depth_m"] == 45.0


def test_ensure_building_definition_merged_max_footprint():
    stub = _stub_building_definition(stories=42, walls=0)
    blueprint_data = {
        "building_definition": stub,
        "footprint": {"width_m": 43.0, "depth_m": 37.0},
    }
    contract_data = {
        "floor_count": 42,
        "square_footage": 1250000,
        "footprint": {"width_m": 55.0, "depth_m": 45.0},
    }
    contract_data, blueprint_data = enrich_project_metadata(
        contract_data,
        blueprint_data,
        contract_text="FOOTPRINT (APPROX):\n55 m x 45 m",
        blueprint_text="footprint note 43 m x 37 m",
    )
    merged_summary = build_project_summary(contract_data, blueprint_data=blueprint_data)
    merged_summary["footprint"] = contract_data["footprint"]

    result = _ensure_building_definition(blueprint_data, merged_summary)
    regenerated = result["building_definition"]

    assert regenerated["building"]["stories"] == 42
    assert regenerated["building"]["footprint"]["width_m"] == 55.0
    assert regenerated["building"]["footprint"]["depth_m"] == 45.0


def test_patch_building_definition_footprint_scales_geometry():
    defn = {
        "building": {
            "type": "office_tower",
            "stories": 2,
            "totalHeight_m": 8.0,
            "footprint": {"width_m": 43.0, "depth_m": 37.0},
            "roof_type": "flat",
        },
        "levels": [
            {
                "level": 0,
                "name": "Ground Floor",
                "height_m": 4.0,
                "floorplate": {"width_m": 43.0, "depth_m": 37.0},
                "rooms": [
                    {
                        "id": "r1",
                        "name": "Lobby",
                        "type": "lobby",
                        "height_m": 4.0,
                        "polygon": [
                            {"x": 1.0, "y": 1.0},
                            {"x": 10.0, "y": 1.0},
                            {"x": 10.0, "y": 8.0},
                            {"x": 1.0, "y": 8.0},
                        ],
                    }
                ],
                "walls": [
                    {
                        "id": "w1",
                        "start": {"x": 0, "y": 0},
                        "end": {"x": 43, "y": 0},
                        "thickness_m": 0.3,
                        "type": "exterior",
                        "openings": [
                            {
                                "offset_m": 10.0,
                                "width_m": 1.4,
                                "height_m": 1.8,
                                "sill_m": 0.9,
                                "type": "window",
                            }
                        ],
                    }
                ],
                "stairs": [],
            }
        ],
        "facade": {
            "balconies": False,
            "balcony_depth_m": 0,
            "railing_height_m": 1.1,
            "window_pattern": "grid",
            "material": "curtain_wall",
        },
    }
    patched = patch_building_definition_footprint(
        defn, {"width_m": 55.0, "depth_m": 45.0}
    )
    assert patched["building"]["footprint"]["width_m"] == 55.0
    assert patched["building"]["footprint"]["depth_m"] == 45.0
    assert patched["levels"][0]["floorplate"]["width_m"] == 55.0
    assert patched["levels"][0]["walls"][0]["end"]["x"] == 55.0
