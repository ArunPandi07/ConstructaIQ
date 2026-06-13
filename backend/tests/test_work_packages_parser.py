import json

from app.services.work_packages_parser import parse_work_packages


def test_parse_structured_work_packages():
    raw = json.dumps(
        {
            "dependencies": [{"predecessor": "A", "successor": "B"}],
            "materials": [{"material_name": "Steel", "quantity": 10}],
        }
    )
    result = parse_work_packages(raw)
    assert len(result["dependencies"]) == 1
    assert len(result["materials"]) == 1


def test_parse_legacy_dependencies_list():
    raw = json.dumps([{"predecessor": "A", "successor": "B"}])
    result = parse_work_packages(raw)
    assert len(result["dependencies"]) == 1
    assert result["materials"] == []


def test_parse_legacy_materials_list():
    raw = json.dumps([{"material_name": "Concrete"}])
    result = parse_work_packages(raw)
    assert result["dependencies"] == []
    assert len(result["materials"]) == 1
