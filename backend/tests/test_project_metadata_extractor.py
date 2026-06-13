from app.services.project_metadata_extractor import (
    enrich_project_metadata,
    merge_footprint_candidates,
    parse_floor_count_from_text,
    parse_footprint_from_text,
    parse_square_footage_from_text,
    parse_story_count_from_scope,
)


def test_parse_floor_count_from_label_next_line():
    text = "NUMBER OF FLOORS (STORIES ABOVE GRADE):\n42\nGROSS SQUARE FOOTAGE"
    assert parse_floor_count_from_text(text) == 42


def test_parse_story_count_from_scope():
    assert parse_story_count_from_scope("42-story mixed-use commercial") == 42
    assert parse_story_count_from_scope("Construction of a 57 story tower") == 57


def test_parse_square_footage_from_label():
    text = "GROSS SQUARE FOOTAGE (GSF):\n1,250,000\nFOOTPRINT"
    assert parse_square_footage_from_text(text) == 1250000


def test_parse_square_footage_inline():
    assert parse_square_footage_from_text("declared gross square footage is 1,250,000 GSF") == 1250000


def test_parse_footprint_meters():
    fp = parse_footprint_from_text("approximate footprint is 55 m x 45 m")
    assert fp == {"width_m": 55.0, "depth_m": 45.0}


def test_parse_footprint_feet():
    fp = parse_footprint_from_text("footprint 200 ft x 150 ft")
    assert fp is not None
    assert fp["width_m"] == round(200 * 0.3048, 2)
    assert fp["depth_m"] == round(150 * 0.3048, 2)


def test_enrich_does_not_overwrite_existing_floor_count():
    contract = {"floor_count": 10, "scope": "42-story tower"}
    blueprint = {}
    enriched_contract, _ = enrich_project_metadata(contract, blueprint)
    assert enriched_contract["floor_count"] == 10


def test_enrich_from_scope_when_floor_count_missing():
    contract = {"scope": "42-story mixed-use high-rise"}
    blueprint = {}
    enriched_contract, enriched_blueprint = enrich_project_metadata(contract, blueprint)
    assert enriched_contract["floor_count"] == 42
    assert enriched_blueprint["stories_above_grade"] == 42


def test_enrich_footprint_from_contract_text():
    contract = {}
    blueprint = {}
    contract_text = "FOOTPRINT (APPROX):\n55 m x 45 m"
    enriched_contract, _ = enrich_project_metadata(
        contract,
        blueprint,
        contract_text=contract_text,
    )
    assert enriched_contract["footprint"] == {"width_m": 55.0, "depth_m": 45.0}


def test_merge_footprint_candidates_prefers_max_area():
    merged = merge_footprint_candidates(
        [
            {"width_m": 43.0, "depth_m": 37.0},
            {"width_m": 55.0, "depth_m": 45.0},
        ]
    )
    assert merged == {"width_m": 55.0, "depth_m": 45.0}


def test_enrich_footprint_max_area_over_stub_building_definition():
    contract = {}
    blueprint = {
        "building_definition": {
            "building": {
                "stories": 3,
                "footprint": {"width_m": 43.0, "depth_m": 37.0},
            },
            "levels": [{"level": 0, "walls": []}],
        }
    }
    contract_text = "FOOTPRINT (APPROX):\n55 m x 45 m"
    enriched_contract, _ = enrich_project_metadata(
        contract,
        blueprint,
        contract_text=contract_text,
    )
    assert enriched_contract["footprint"] == {"width_m": 55.0, "depth_m": 45.0}
