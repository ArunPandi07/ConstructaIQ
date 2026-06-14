from app.services.critical_path_service import (
    compute_critical_path_phases,
    mark_critical_phases,
)


def test_compute_critical_path_longest_chain():
    deps = [
        {"predecessor": "A", "successor": "B"},
        {"predecessor": "B", "successor": "C"},
        {"predecessor": "A", "successor": "D"},
    ]
    path = compute_critical_path_phases(deps, ["A", "B", "C", "D"])
    assert path == ["A", "B", "C"]


def test_compute_critical_path_empty():
    assert compute_critical_path_phases([], []) == []


def test_mark_critical_phases():
    phases = [{"name": "Foundation", "progress": 0}, {"name": "Steel", "progress": 0}]
    marked = mark_critical_phases(phases, ["Foundation", "Steel"])
    assert marked[0]["isCritical"] is True
    assert marked[1]["isCritical"] is True
