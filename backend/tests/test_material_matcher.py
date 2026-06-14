from app.services.material_matcher import (
    align_procurement_plan,
    best_material_match,
    normalize_material_label,
    score_material_match,
)


def test_normalize_material_label():
    assert normalize_material_label("Ready-Mix Concrete (8000 psi)") == (
        "ready mix concrete 8000 psi"
    )


def test_score_material_match_fuzzy_concrete():
    schedule = "Ready-Mix Concrete (8000 psi core walls)"
    supplier = "High-Strength Concrete 8000 psi (core walls)"
    score = score_material_match(schedule, supplier)
    assert score >= 0.45


def test_score_material_match_exact():
    assert score_material_match("Structural Steel", "Structural Steel") == 1.0


def test_best_material_match_returns_canonical_name():
    candidates = [
        "Ready-Mix Concrete (8000 psi core walls)",
        "Structural Steel (Framing)",
    ]
    match = best_material_match(
        "High-Strength Concrete 8000 psi (core walls)",
        candidates,
    )
    assert match is not None
    assert match[0] == "Ready-Mix Concrete (8000 psi core walls)"
    assert match[1] >= 0.45


def test_align_procurement_plan_preserves_exact_match():
    schedule = ["Structural Steel", "Ready-Mix Concrete (8000 psi)"]
    plan = [{"material_name": "Structural Steel", "supplier_name": "SteelCo"}]
    aligned = align_procurement_plan(plan, schedule)
    assert aligned[0]["material_name"] == "Structural Steel"


def test_align_procurement_plan_rewrites_fuzzy_match():
    schedule = ["Ready-Mix Concrete (8000 psi core walls)"]
    plan = [
        {
            "material_name": "High-Strength Concrete 8000 psi (core walls)",
            "supplier_name": "ConcreteCo",
        }
    ]
    aligned = align_procurement_plan(plan, schedule)
    assert aligned[0]["material_name"] == "Ready-Mix Concrete (8000 psi core walls)"


def test_align_procurement_plan_skips_when_no_match():
    schedule = ["Structural Steel"]
    plan = [{"material_name": "Ceramic Tile Flooring", "supplier_name": "TileCo"}]
    aligned = align_procurement_plan(plan, schedule)
    assert aligned[0]["material_name"] == "Ceramic Tile Flooring"
