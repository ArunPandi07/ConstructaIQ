from __future__ import annotations

import re
from typing import Any

from app.services.logging_service import get_logger

logger = get_logger("MaterialMatcher")

STOP_WORDS = frozenset(
    {
        "a",
        "an",
        "the",
        "and",
        "or",
        "with",
        "for",
        "of",
        "in",
        "on",
        "to",
        "by",
        "per",
    }
)

MATERIAL_KEYWORDS = frozenset(
    {
        "concrete",
        "steel",
        "rebar",
        "reinforced",
        "structural",
        "ready",
        "mix",
        "high",
        "strength",
        "curtain",
        "wall",
        "glazing",
        "glass",
        "elevator",
        "aluminum",
        "timber",
        "wood",
        "masonry",
        "brick",
        "gypsum",
        "insulation",
        "roofing",
        "membrane",
        "copper",
        "stainless",
        "precast",
        "aggregate",
        "cement",
        "mortar",
        "pipe",
        "pvc",
        "duct",
        "hvac",
        "plumbing",
        "cable",
        "wiring",
        "drywall",
        "shingle",
        "asphalt",
        "stone",
        "granite",
        "marble",
        "tile",
        "ceramic",
        "framing",
        "beam",
        "column",
        "truss",
        "deck",
        "slab",
        "foundation",
        "footing",
        "psi",
        "core",
        "walls",
    }
)


def normalize_material_label(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(text).lower()).strip()


def material_tokens(text: str) -> set[str]:
    normalized = normalize_material_label(text)
    return {
        token
        for token in normalized.split()
        if token and token not in STOP_WORDS and not token.isdigit()
    }


def score_material_match(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    if normalize_material_label(a) == normalize_material_label(b):
        return 1.0

    tokens_a = material_tokens(a)
    tokens_b = material_tokens(b)
    if not tokens_a or not tokens_b:
        return 0.0

    intersection = tokens_a & tokens_b
    if not intersection:
        return 0.0

    overlap = len(intersection) / max(len(tokens_a), len(tokens_b))
    keyword_bonus = sum(0.05 for token in intersection if token in MATERIAL_KEYWORDS)
    return min(1.0, overlap + keyword_bonus)


def best_material_match(
    target: str,
    candidates: list[str],
    *,
    min_score: float = 0.45,
) -> tuple[str, float] | None:
    best_name: str | None = None
    best_score = 0.0
    for candidate in candidates:
        if not candidate or not str(candidate).strip():
            continue
        score = score_material_match(target, str(candidate))
        if score >= min_score and score > best_score:
            best_name = str(candidate)
            best_score = score
    if best_name is None:
        return None
    return best_name, best_score


def align_procurement_plan(
    procurement_plan: list[Any],
    schedule_materials: list[str],
    *,
    min_score: float = 0.45,
) -> list[Any]:
    if not procurement_plan or not schedule_materials:
        return procurement_plan

    schedule_by_norm = {
        normalize_material_label(name): name for name in schedule_materials if name
    }
    aligned: list[Any] = []

    for row in procurement_plan:
        if not isinstance(row, dict):
            aligned.append(row)
            continue

        updated = dict(row)
        material_name = (
            updated.get("material_name")
            or updated.get("name")
            or updated.get("MaterialName")
            or updated.get("material")
            or updated.get("item_name")
        )
        if not material_name:
            aligned.append(updated)
            continue

        material_str = str(material_name).strip()
        norm = normalize_material_label(material_str)
        canonical = schedule_by_norm.get(norm)
        if canonical:
            updated["material_name"] = canonical
            aligned.append(updated)
            continue

        match = best_material_match(material_str, schedule_materials, min_score=min_score)
        if match:
            logger.info(
                "Aligned procurement material '%s' -> '%s' (score=%.2f)",
                material_str,
                match[0],
                match[1],
            )
            updated["material_name"] = match[0]

        aligned.append(updated)

    return aligned
