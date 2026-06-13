from __future__ import annotations

import re
from typing import Any

from app.services.logging_service import get_logger

logger = get_logger("ProjectMetadataExtractor")

MIN_STORIES = 1
MAX_STORIES = 120
MIN_SQUARE_FOOTAGE = 1_000
MAX_SQUARE_FOOTAGE = 50_000_000
MIN_FOOTPRINT_M = 5.0
MAX_FOOTPRINT_M = 250.0
FEET_TO_M = 0.3048

FLOOR_LABEL_PATTERN = re.compile(
    r"(?:number\s+of\s+floors|stories\s+above\s+grade|total\s+stories|floor\s+count)",
    re.IGNORECASE,
)
STORY_SCOPE_PATTERN = re.compile(
    r"\b(\d{1,3})[- ]?story(?:ies)?\b",
    re.IGNORECASE,
)
GSF_LABEL_PATTERN = re.compile(
    r"(?:gross\s+square\s+footage|gross\s+square\s+feet|gsf)",
    re.IGNORECASE,
)
GSF_VALUE_PATTERN = re.compile(
    r"(\d{1,3}(?:,\d{3})+|\d+)\s*(?:gsf|sq\.?\s*ft|square\s+feet)",
    re.IGNORECASE,
)
FOOTPRINT_M_PATTERN = re.compile(
    r"(\d+(?:\.\d+)?)\s*m\s*[x×]\s*(\d+(?:\.\d+)?)\s*m",
    re.IGNORECASE,
)
FOOTPRINT_FT_PATTERN = re.compile(
    r"(\d+(?:\.\d+)?)\s*(?:ft|feet|')\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|')",
    re.IGNORECASE,
)
STANDALONE_INT_PATTERN = re.compile(r"^\s*(\d{1,3})\s*$")


def _parse_int_value(value: Any) -> int | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        text = value.strip().replace(",", "")
        if not text:
            return None
        try:
            return int(float(text))
        except ValueError:
            return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _valid_stories(value: int | None) -> int | None:
    if value is None or value < MIN_STORIES or value > MAX_STORIES:
        return None
    return value


def _valid_square_footage(value: int | None) -> int | None:
    if value is None or value < MIN_SQUARE_FOOTAGE or value > MAX_SQUARE_FOOTAGE:
        return None
    return value


def _valid_footprint_dim(value: float) -> bool:
    return MIN_FOOTPRINT_M <= value <= MAX_FOOTPRINT_M


def parse_story_count_from_scope(scope: str | None) -> int | None:
    if not scope or not isinstance(scope, str):
        return None
    match = STORY_SCOPE_PATTERN.search(scope)
    if not match:
        return None
    return _valid_stories(_parse_int_value(match.group(1)))


def parse_floor_count_from_text(text: str | None) -> int | None:
    if not text or not isinstance(text, str):
        return None

    lines = text.splitlines()
    for index, line in enumerate(lines):
        if not FLOOR_LABEL_PATTERN.search(line):
            continue

        same_line = re.search(r":\s*(\d{1,3})\b", line)
        if same_line:
            result = _valid_stories(_parse_int_value(same_line.group(1)))
            if result is not None:
                return result

        for next_line in lines[index + 1 : index + 4]:
            stripped = next_line.strip()
            if not stripped:
                continue
            standalone = STANDALONE_INT_PATTERN.match(stripped)
            if standalone:
                result = _valid_stories(_parse_int_value(standalone.group(1)))
                if result is not None:
                    return result
            break

    return None


def parse_square_footage_from_text(text: str | None) -> int | None:
    if not text or not isinstance(text, str):
        return None

    for match in GSF_VALUE_PATTERN.finditer(text):
        result = _valid_square_footage(_parse_int_value(match.group(1)))
        if result is not None:
            return result

    lines = text.splitlines()
    for index, line in enumerate(lines):
        if not GSF_LABEL_PATTERN.search(line):
            continue

        same_line = re.search(r":\s*([\d,]+)", line)
        if same_line:
            result = _valid_square_footage(_parse_int_value(same_line.group(1)))
            if result is not None:
                return result

        for next_line in lines[index + 1 : index + 4]:
            stripped = next_line.strip()
            if not stripped:
                continue
            digits = re.search(r"^([\d,]+)", stripped)
            if digits:
                result = _valid_square_footage(_parse_int_value(digits.group(1)))
                if result is not None:
                    return result
            break

    return None


def parse_footprint_from_text(text: str | None) -> dict[str, float] | None:
    if not text or not isinstance(text, str):
        return None

    for pattern, multiplier in ((FOOTPRINT_M_PATTERN, 1.0), (FOOTPRINT_FT_PATTERN, FEET_TO_M)):
        match = pattern.search(text)
        if not match:
            continue
        width = float(match.group(1)) * multiplier
        depth = float(match.group(2)) * multiplier
        if _valid_footprint_dim(width) and _valid_footprint_dim(depth):
            return {"width_m": round(width, 2), "depth_m": round(depth, 2)}

    return None


def merge_footprint_candidates(candidates: list[dict[str, Any]]) -> dict[str, float] | None:
    """Pick footprint with largest area; tie-break on max(width, depth)."""
    valid: list[dict[str, float]] = []
    for candidate in candidates:
        if not isinstance(candidate, dict):
            continue
        width = candidate.get("width_m")
        depth = candidate.get("depth_m")
        if width is None or depth is None:
            continue
        width_f = float(width)
        depth_f = float(depth)
        if _valid_footprint_dim(width_f) and _valid_footprint_dim(depth_f):
            valid.append(
                {"width_m": round(width_f, 2), "depth_m": round(depth_f, 2)}
            )

    if not valid:
        return None

    def sort_key(fp: dict[str, float]) -> tuple[float, float]:
        area = fp["width_m"] * fp["depth_m"]
        max_dim = max(fp["width_m"], fp["depth_m"])
        return (area, max_dim)

    return max(valid, key=sort_key)


def infer_stories_from_blueprint(blueprint_data: dict[str, Any] | None) -> int | None:
    if not isinstance(blueprint_data, dict):
        return None

    stories = _valid_stories(_parse_int_value(blueprint_data.get("stories_above_grade")))
    if stories is not None:
        return stories

    building = blueprint_data.get("building")
    if isinstance(building, dict):
        stories = _valid_stories(_parse_int_value(building.get("stories")))
        if stories is not None:
            return stories

    defn = blueprint_data.get("building_definition") or blueprint_data.get("buildingDefinition")
    if isinstance(defn, dict):
        building_in_defn = defn.get("building")
        if isinstance(building_in_defn, dict):
            stories = _valid_stories(_parse_int_value(building_in_defn.get("stories")))
            if stories is not None:
                return stories

    return None


def _has_floor_count(data: dict[str, Any]) -> bool:
    return _parse_int_value(data.get("floor_count") or data.get("floors")) is not None


def _infer_stories(
    contract: dict[str, Any],
    blueprint: dict[str, Any],
    contract_text: str | None,
    blueprint_text: str | None,
) -> tuple[int | None, str | None]:
    if _has_floor_count(contract):
        return _valid_stories(
            _parse_int_value(contract.get("floor_count") or contract.get("floors"))
        ), None
    if _has_floor_count(blueprint):
        return _valid_stories(
            _parse_int_value(blueprint.get("floor_count") or blueprint.get("floors"))
        ), None

    blueprint_stories = infer_stories_from_blueprint(blueprint)
    if blueprint_stories is not None:
        return blueprint_stories, "blueprint_structured"

    for source_name, text in (
        ("contract_text_label", contract_text),
        ("blueprint_text_label", blueprint_text),
    ):
        if text:
            parsed = parse_floor_count_from_text(text)
            if parsed is not None:
                return parsed, source_name

    scope = contract.get("scope") or contract.get("project_name") or ""
    scope_stories = parse_story_count_from_scope(str(scope))
    if scope_stories is not None:
        return scope_stories, "scope_regex"

    return None, None


def _infer_square_footage(
    contract: dict[str, Any],
    blueprint: dict[str, Any],
    contract_text: str | None,
    blueprint_text: str | None,
) -> tuple[int | None, str | None]:
    contract_sf = _valid_square_footage(_parse_int_value(contract.get("square_footage")))
    if contract_sf is not None:
        return contract_sf, None

    blueprint_sf = _valid_square_footage(_parse_int_value(blueprint.get("square_footage")))
    if blueprint_sf is not None:
        return blueprint_sf, None

    for source_name, text in (
        ("contract_text", contract_text),
        ("blueprint_text", blueprint_text),
    ):
        if text:
            parsed = parse_square_footage_from_text(text)
            if parsed is not None:
                return parsed, source_name

    return None, None


def _infer_footprint(
    contract: dict[str, Any],
    blueprint: dict[str, Any],
    contract_text: str | None,
    blueprint_text: str | None,
) -> tuple[dict[str, float] | None, str | None]:
    candidates: list[dict[str, float]] = []

    footprint = contract.get("footprint")
    if isinstance(footprint, dict):
        width = footprint.get("width_m")
        depth = footprint.get("depth_m")
        if width and depth and _valid_footprint_dim(float(width)) and _valid_footprint_dim(
            float(depth)
        ):
            candidates.append(
                {
                    "width_m": round(float(width), 2),
                    "depth_m": round(float(depth), 2),
                }
            )

    blueprint_footprint = blueprint.get("footprint")
    if isinstance(blueprint_footprint, dict):
        width = blueprint_footprint.get("width_m")
        depth = blueprint_footprint.get("depth_m")
        if width and depth and _valid_footprint_dim(float(width)) and _valid_footprint_dim(
            float(depth)
        ):
            candidates.append(
                {
                    "width_m": round(float(width), 2),
                    "depth_m": round(float(depth), 2),
                }
            )

    if contract_text:
        parsed = parse_footprint_from_text(contract_text)
        if parsed is not None:
            candidates.append(parsed)

    if blueprint_text:
        parsed = parse_footprint_from_text(blueprint_text)
        if parsed is not None:
            candidates.append(parsed)

    scope = contract.get("scope") or contract.get("project_name") or ""
    if scope:
        parsed = parse_footprint_from_text(str(scope))
        if parsed is not None:
            candidates.append(parsed)

    defn = blueprint.get("building_definition") or blueprint.get("buildingDefinition")
    if isinstance(defn, dict):
        from app.services.building_templates import is_building_definition_sufficient

        if is_building_definition_sufficient(defn):
            building = defn.get("building")
            if isinstance(building, dict):
                defn_fp = building.get("footprint")
                if isinstance(defn_fp, dict):
                    width = defn_fp.get("width_m")
                    depth = defn_fp.get("depth_m")
                    if width and depth and _valid_footprint_dim(float(width)) and _valid_footprint_dim(
                        float(depth)
                    ):
                        candidates.append(
                            {
                                "width_m": round(float(width), 2),
                                "depth_m": round(float(depth), 2),
                            }
                        )

    merged = merge_footprint_candidates(candidates)
    if merged is None:
        return None, None

    if len(candidates) > 1:
        logger.info(
            "Merged footprint candidates %s -> %sx%s m (max-area policy)",
            candidates,
            merged["width_m"],
            merged["depth_m"],
        )
        return merged, "merged_max_area"

    return merged, None


def enrich_project_metadata(
    contract_data: dict[str, Any] | None,
    blueprint_data: dict[str, Any] | None,
    *,
    contract_text: str | None = None,
    blueprint_text: str | None = None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Fill missing floor_count, square_footage, and footprint from text heuristics."""
    contract = dict(contract_data or {})
    blueprint = dict(blueprint_data or {})

    stories, stories_source = _infer_stories(
        contract, blueprint, contract_text, blueprint_text
    )
    if stories is not None and not _has_floor_count(contract):
        contract["floor_count"] = stories
        if stories_source:
            logger.info("Enriched floor_count=%s from %s", stories, stories_source)

    if stories is not None and blueprint.get("stories_above_grade") is None:
        blueprint["stories_above_grade"] = stories

    square_footage, sf_source = _infer_square_footage(
        contract, blueprint, contract_text, blueprint_text
    )
    if square_footage is not None and contract.get("square_footage") is None:
        contract["square_footage"] = square_footage
        if sf_source:
            logger.info("Enriched square_footage=%s from %s", square_footage, sf_source)

    footprint, fp_source = _infer_footprint(
        contract, blueprint, contract_text, blueprint_text
    )
    if footprint is not None and contract.get("footprint") is None:
        contract["footprint"] = footprint
        if fp_source:
            logger.info(
                "Enriched footprint=%sx%s m from %s",
                footprint["width_m"],
                footprint["depth_m"],
                fp_source,
            )

    return contract, blueprint
