from __future__ import annotations

from copy import deepcopy
from math import sqrt
from typing import Any

from app.services.project_metadata_extractor import (
    merge_footprint_candidates,
    parse_footprint_from_text,
)


SUPPORTED_BUILDING_TYPES = {
    "residential_tower",
    "office_tower",
    "hospital",
    "mixed_use",
    "warehouse",
}


def _num(value: Any, default: float) -> float:
    if value is None or value == "":
        return default
    try:
        return float(str(value).replace("$", "").replace(",", "").strip())
    except (TypeError, ValueError):
        return default


def _text(*values: Any) -> str:
    return " ".join(str(v or "").lower() for v in values)


def _is_twin_tower_project(project_summary: dict[str, Any], blueprint: dict[str, Any]) -> bool:
    source = _text(
        project_summary.get("project_type"),
        project_summary.get("scope"),
        blueprint.get("project_name"),
    )
    return "twin" in source and "tower" in source


def _building_type(project_summary: dict[str, Any], blueprint: dict[str, Any]) -> str:
    source = _text(
        project_summary.get("project_type"),
        project_summary.get("scope"),
        blueprint.get("construction_type"),
    )
    if any(token in source for token in ("hospital", "health", "medical")):
        return "hospital"
    if any(token in source for token in ("warehouse", "logistics", "industrial", "cross-dock", "data center")):
        return "warehouse"
    if "mixed" in source or ("retail" in source and "residential" in source):
        return "mixed_use"
    if any(
        token in source
        for token in ("residential", "multi-family", "apartment", "condominium", "condo")
    ):
        return "residential_tower"
    if any(
        token in source
        for token in ("office", "commercial", "corporate", "research", "education", "laboratory", "tower")
    ):
        return "office_tower"
    return "office_tower"


def _footprint_from_dict(footprint: Any) -> dict[str, float] | None:
    if not isinstance(footprint, dict):
        return None
    width = _num(footprint.get("width_m"), 0)
    depth = _num(footprint.get("depth_m"), 0)
    if width <= 0 or depth <= 0:
        return None
    return {"width_m": round(width, 2), "depth_m": round(depth, 2)}


def _resolve_footprint(
    project_summary: dict[str, Any],
    blueprint: dict[str, Any],
    stories: int,
    building_type: str,
) -> dict[str, float]:
    candidates: list[dict[str, float]] = []

    for source in (
        project_summary.get("footprint"),
        blueprint.get("footprint"),
    ):
        resolved = _footprint_from_dict(source)
        if resolved is not None:
            candidates.append(resolved)

    scope = project_summary.get("scope") or project_summary.get("project_name") or ""
    if scope:
        parsed = parse_footprint_from_text(str(scope))
        if parsed is not None:
            candidates.append(parsed)

    defn = blueprint.get("building_definition") or blueprint.get("buildingDefinition")
    if isinstance(defn, dict) and is_building_definition_sufficient(defn):
        building = defn.get("building")
        if isinstance(building, dict):
            resolved = _footprint_from_dict(building.get("footprint"))
            if resolved is not None:
                candidates.append(resolved)

    merged = merge_footprint_candidates(candidates)
    if merged is not None:
        return merged

    return _footprint_heuristic(project_summary, stories, building_type)


def _footprint_heuristic(
    project_summary: dict[str, Any], stories: int, building_type: str
) -> dict[str, float]:
    sf = _num(project_summary.get("square_footage"), 150_000)
    if building_type == "warehouse":
        area_m2 = max(sf * 0.0929, 12_000)
        width = sqrt(area_m2 * 1.8)
        depth = area_m2 / width
    else:
        area_m2 = max((sf * 0.0929) / max(stories, 1), 250)
        aspect = {
            "hospital": 1.8,
            "mixed_use": 1.35,
            "residential_tower": 1.15,
            "office_tower": 1.25,
        }.get(building_type, 1.25)
        width = sqrt(area_m2 * aspect)
        depth = area_m2 / width
    return {"width_m": round(width, 2), "depth_m": round(depth, 2)}


def _resolve_stories(
    blueprint: dict[str, Any],
    project_summary: dict[str, Any],
) -> int:
    for source in (blueprint, project_summary):
        for key in ("stories_above_grade", "floor_count", "floors"):
            value = source.get(key)
            if value is None or value == "":
                continue
            stories = int(max(1, _num(value, 0)))
            return min(stories, 120)

    return 3


def _openings(
    length: float,
    *,
    kind: str,
    count: int,
    width: float,
    height: float,
    sill: float,
    prefix: str,
) -> list[dict[str, Any]]:
    if count <= 0:
        return []
    margin = min(max(width * 0.8, 1.0), max(length / 5, 1.0))
    usable = max(length - margin * 2, width)
    step = usable / count
    return [
        {
            "id": f"{prefix}_{index + 1}",
            "type": kind,
            "offset_m": round(margin + step * index + step / 2 - width / 2, 2),
            "width_m": width,
            "height_m": height,
            "sill_m": sill,
        }
        for index in range(count)
    ]


def _exterior_walls(
    width: float,
    depth: float,
    level: int,
    building_type: str,
    *,
    window_pattern: str = "grid",
) -> list[dict[str, Any]]:
    pattern = window_pattern.lower()
    if pattern == "strip":
        window_count_long = max(2, min(8, int(width // 8)))
        window_count_short = max(1, min(4, int(depth // 8)))
        win_w, win_h, sill = 2.8, 2.4, 0.6
    elif pattern == "punched":
        window_count_long = max(2, min(6, int(width // 7)))
        window_count_short = max(1, min(4, int(depth // 7)))
        win_w, win_h, sill = 1.8, 1.8, 1.0
    elif pattern == "industrial":
        window_count_long = max(1, min(4, int(width // 12)))
        window_count_short = max(1, min(3, int(depth // 12)))
        win_w, win_h, sill = 2.0, 1.6, 1.2
    else:
        window_count_long = max(2, min(12, int(width // 5)))
        window_count_short = max(1, min(8, int(depth // 5)))
        win_w, win_h, sill = 1.4, 1.8, 0.9
    loading_bays = 8 if building_type == "warehouse" and level == 0 else 0
    front_openings = (
        _openings(
            width,
            kind="loading_bay",
            count=loading_bays,
            width=3.2,
            height=4.2,
            sill=0,
            prefix=f"l{level}_dock",
        )
        if loading_bays
        else _openings(
            width,
            kind="window",
            count=window_count_long,
            width=win_w,
            height=win_h,
            sill=sill,
            prefix=f"l{level}_front_win",
        )
    )
    if level == 0 and building_type != "warehouse":
        front_openings.append(
            {
                "id": f"l{level}_main_entry",
                "type": "door",
                "offset_m": round(width / 2 - 1.2, 2),
                "width_m": 2.4,
                "height_m": 2.6,
                "sill_m": 0,
            }
        )
    return [
        {
            "id": f"l{level}_front",
            "start": {"x": 0, "y": 0},
            "end": {"x": width, "y": 0},
            "thickness_m": 0.3,
            "type": "exterior",
            "material": "brick" if building_type == "mixed_use" and level < 3 else "concrete",
            "openings": front_openings,
        },
        {
            "id": f"l{level}_right",
            "start": {"x": width, "y": 0},
            "end": {"x": width, "y": depth},
            "thickness_m": 0.3,
            "type": "exterior",
            "material": "concrete",
            "openings": _openings(
                depth,
                kind="window",
                count=window_count_short,
                width=win_w * 0.85,
                height=win_h * 0.85,
                sill=sill + 0.1,
                prefix=f"l{level}_right_win",
            ),
        },
        {
            "id": f"l{level}_rear",
            "start": {"x": width, "y": depth},
            "end": {"x": 0, "y": depth},
            "thickness_m": 0.3,
            "type": "exterior",
            "material": "concrete",
            "openings": _openings(
                width,
                kind="window",
                count=window_count_long,
                width=win_w,
                height=win_h,
                sill=sill,
                prefix=f"l{level}_rear_win",
            ),
        },
        {
            "id": f"l{level}_left",
            "start": {"x": 0, "y": depth},
            "end": {"x": 0, "y": 0},
            "thickness_m": 0.3,
            "type": "exterior",
            "material": "concrete",
            "openings": _openings(
                depth,
                kind="window",
                count=window_count_short,
                width=win_w * 0.85,
                height=win_h * 0.85,
                sill=sill + 0.1,
                prefix=f"l{level}_left_win",
            ),
        },
    ]


def _rect_room(
    level: int,
    room_id: str,
    name: str,
    room_type: str,
    x: float,
    y: float,
    w: float,
    d: float,
    height: float,
) -> dict[str, Any]:
    return {
        "id": f"l{level}_{room_id}",
        "name": name,
        "type": room_type,
        "height_m": height,
        "polygon": [
            {"x": round(x, 2), "y": round(y, 2)},
            {"x": round(x + w, 2), "y": round(y, 2)},
            {"x": round(x + w, 2), "y": round(y + d, 2)},
            {"x": round(x, 2), "y": round(y + d, 2)},
        ],
    }


def _partition_wall(
    level: int,
    wall_id: str,
    start: tuple[float, float],
    end: tuple[float, float],
    wall_type: str = "partition",
) -> dict[str, Any]:
    return {
        "id": f"l{level}_{wall_id}",
        "start": {"x": round(start[0], 2), "y": round(start[1], 2)},
        "end": {"x": round(end[0], 2), "y": round(end[1], 2)},
        "thickness_m": 0.18 if wall_type == "partition" else 0.28,
        "type": wall_type,
        "material": "concrete" if wall_type == "core" else "partition",
        "openings": [],
    }


def _rooms_and_partitions(
    building_type: str,
    level: int,
    width: float,
    depth: float,
    height: float,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    core_w = min(width * 0.24, 10)
    core_d = min(depth * 0.28, 9)
    cx = width / 2 - core_w / 2
    cy = depth / 2 - core_d / 2
    stairs = [
        {
            "id": f"l{level}_stair_1",
            "position": {"x": round(cx + core_w + 1, 2), "y": round(cy, 2)},
            "width_m": 2.4,
            "depth_m": 4.2,
            "direction": "both" if level > 0 else "up",
        }
    ]

    if building_type == "warehouse":
        rooms = [
            _rect_room(level, "warehouse", "Warehouse Floor", "warehouse", 0.8, 0.8, width - 1.6, depth - 8, height),
            _rect_room(level, "office", "Operations Office", "office", 1.2, depth - 7, min(16, width * 0.25), 5.8, 3.2),
            _rect_room(level, "loading", "Loading Apron", "loading", width * 0.35, depth - 7, width * 0.45, 5.8, height),
        ]
        walls = [
            _partition_wall(level, "office_sep", (0.8, depth - 7.2), (min(18, width * 0.3), depth - 7.2)),
            _partition_wall(level, "dock_sep", (width * 0.35, depth - 7.2), (width * 0.8, depth - 7.2)),
        ]
        return rooms, walls, stairs

    if building_type == "hospital":
        corridor_y = depth / 2 - 1.4
        rooms = [
            _rect_room(level, "corridor", "Main Clinical Corridor", "corridor", 1.0, corridor_y, width - 2, 2.8, height),
            _rect_room(level, "imaging", "Imaging / Procedure Suite", "clinical", 1.0, 1.0, width * 0.32, corridor_y - 1.0, height),
            _rect_room(level, "patient", "Patient Care Bays", "clinical", width * 0.36, 1.0, width * 0.34, corridor_y - 1.0, height),
            _rect_room(level, "support", "Support / Nurse Station", "support", width * 0.72, 1.0, width * 0.25, corridor_y - 1.0, height),
            _rect_room(level, "core", "Vertical Core", "core", cx, cy, core_w, core_d, height),
        ]
    elif building_type == "mixed_use" and level < 3:
        rooms = [
            _rect_room(level, "retail", "Retail Shell", "retail", 1.0, 1.0, width * 0.55, depth - 2, height),
            _rect_room(level, "lobby", "Residential Lobby", "lobby", width * 0.58, 1.0, width * 0.18, depth * 0.45, height),
            _rect_room(level, "service", "Back of House", "service", width * 0.78, 1.0, width * 0.18, depth * 0.45, height),
            _rect_room(level, "core", "Tower Core", "core", cx, cy, core_w, core_d, height),
        ]
    elif building_type in {"residential_tower", "mixed_use"}:
        rooms = [
            _rect_room(level, "corridor", "Central Corridor", "corridor", 1.2, cy + core_d + 0.8, width - 2.4, 2.2, height),
            _rect_room(level, "unit_a", "Apartment Unit A", "residential", 1.0, 1.0, width * 0.38, depth * 0.42, height),
            _rect_room(level, "unit_b", "Apartment Unit B", "residential", width * 0.58, 1.0, width * 0.38, depth * 0.42, height),
            _rect_room(level, "unit_c", "Apartment Unit C", "residential", 1.0, depth * 0.58, width * 0.38, depth * 0.36, height),
            _rect_room(level, "unit_d", "Apartment Unit D", "residential", width * 0.58, depth * 0.58, width * 0.38, depth * 0.36, height),
            _rect_room(level, "core", "Elevator / Stair Core", "core", cx, cy, core_w, core_d, height),
        ]
    else:
        rooms = [
            _rect_room(level, "open_office", "Open Office", "office", 1.0, 1.0, width * 0.56, depth - 2, height),
            _rect_room(level, "meeting", "Meeting Rooms", "meeting", width * 0.6, 1.0, width * 0.18, depth * 0.42, height),
            _rect_room(level, "support", "Support / Pantry", "support", width * 0.8, 1.0, width * 0.17, depth * 0.42, height),
            _rect_room(level, "core", "Elevator / Stair Core", "core", cx, cy, core_w, core_d, height),
        ]

    walls = [
        _partition_wall(level, "core_n", (cx, cy), (cx + core_w, cy), "core"),
        _partition_wall(level, "core_s", (cx, cy + core_d), (cx + core_w, cy + core_d), "core"),
        _partition_wall(level, "core_w", (cx, cy), (cx, cy + core_d), "core"),
        _partition_wall(level, "core_e", (cx + core_w, cy), (cx + core_w, cy + core_d), "core"),
        _partition_wall(level, "mid_partition", (width * 0.5, 1.0), (width * 0.5, depth - 1.0)),
    ]
    return rooms, walls, stairs


def _facade(building_type: str) -> dict[str, Any]:
    if building_type == "warehouse":
        return {
            "balconies": False,
            "balcony_depth_m": 0,
            "railing_height_m": 1.1,
            "window_pattern": "industrial",
            "material": "metal_panel",
            "face_materials": {
                "front": "metal_panel",
                "back": "metal_panel",
                "left": "metal_panel",
                "right": "metal_panel",
            },
            "balcony_faces": [],
        }
    if building_type == "mixed_use":
        return {
            "balconies": True,
            "balcony_depth_m": 1.5,
            "railing_height_m": 1.1,
            "window_pattern": "grid",
            "material": "concrete_with_glass",
            "face_materials": {
                "front": "brick",
                "back": "concrete",
                "left": "concrete",
                "right": "concrete",
            },
            "balcony_faces": ["front", "back"],
        }
    if building_type == "residential_tower":
        return {
            "balconies": True,
            "balcony_depth_m": 1.5,
            "railing_height_m": 1.1,
            "window_pattern": "grid",
            "material": "concrete_with_glass",
            "face_materials": {
                "front": "concrete",
                "back": "concrete",
                "left": "concrete",
                "right": "concrete",
            },
            "balcony_faces": ["front", "back"],
        }
    if building_type == "hospital":
        return {
            "balconies": False,
            "balcony_depth_m": 0,
            "railing_height_m": 1.1,
            "window_pattern": "strip",
            "material": "concrete_with_glass",
            "face_materials": {
                "front": "glass",
                "back": "concrete",
                "left": "concrete",
                "right": "concrete",
            },
            "balcony_faces": [],
        }
    return {
        "balconies": False,
        "balcony_depth_m": 0,
        "railing_height_m": 1.1,
        "window_pattern": "grid",
        "material": "curtain_wall",
        "face_materials": {
            "front": "curtain_wall",
            "back": "concrete",
            "left": "concrete",
            "right": "concrete",
        },
        "balcony_faces": [],
    }


def is_building_definition_sufficient(defn: Any) -> bool:
    """Return True when a building_definition has enough geometry for the 3D viewer."""
    if not isinstance(defn, dict):
        return False

    building = defn.get("building")
    if not isinstance(building, dict):
        return False

    try:
        stories = int(building.get("stories") or 0)
    except (TypeError, ValueError):
        return False
    if stories < 1:
        return False

    footprint = building.get("footprint")
    if not isinstance(footprint, dict):
        return False
    width = _num(footprint.get("width_m"), 0)
    depth = _num(footprint.get("depth_m"), 0)
    if width <= 0 or depth <= 0:
        return False

    levels = defn.get("levels")
    if not isinstance(levels, list) or len(levels) == 0:
        return False
    if len(levels) < stories:
        return False

    total_walls = 0
    for level in levels:
        if not isinstance(level, dict):
            continue
        walls = level.get("walls")
        if isinstance(walls, list):
            total_walls += len(walls)

    if total_walls < 4:
        return False

    first_level = levels[0]
    if not isinstance(first_level, dict):
        return False
    first_walls = first_level.get("walls")
    if not isinstance(first_walls, list) or len(first_walls) < 4:
        return False

    return True


def patch_building_definition_footprint(
    defn: dict[str, Any],
    target_footprint: dict[str, float],
) -> dict[str, Any]:
    """Rescale geometry when merged footprint has larger area than stored model."""
    if not isinstance(defn, dict) or not isinstance(target_footprint, dict):
        return defn

    building = defn.get("building")
    if not isinstance(building, dict):
        return defn

    current_fp = building.get("footprint")
    if not isinstance(current_fp, dict):
        return defn

    old_w = _num(current_fp.get("width_m"), 0)
    old_d = _num(current_fp.get("depth_m"), 0)
    new_w = _num(target_footprint.get("width_m"), 0)
    new_d = _num(target_footprint.get("depth_m"), 0)
    if old_w <= 0 or old_d <= 0 or new_w <= 0 or new_d <= 0:
        return defn

    old_area = old_w * old_d
    new_area = new_w * new_d
    if new_area <= old_area:
        return defn

    ratio_w = new_w / old_w
    ratio_d = new_d / old_d
    result = deepcopy(defn)
    result["building"]["footprint"] = {
        "width_m": round(new_w, 2),
        "depth_m": round(new_d, 2),
    }

    levels = result.get("levels")
    if not isinstance(levels, list):
        return result

    for level in levels:
        if not isinstance(level, dict):
            continue
        floorplate = level.get("floorplate")
        if isinstance(floorplate, dict):
            if floorplate.get("width_m"):
                floorplate["width_m"] = round(_num(floorplate["width_m"], 0) * ratio_w, 2)
            if floorplate.get("depth_m"):
                floorplate["depth_m"] = round(_num(floorplate["depth_m"], 0) * ratio_d, 2)

        walls = level.get("walls")
        if isinstance(walls, list):
            for wall in walls:
                if not isinstance(wall, dict):
                    continue
                start = wall.get("start")
                end = wall.get("end")
                if isinstance(start, dict):
                    if start.get("x") is not None:
                        start["x"] = round(_num(start["x"], 0) * ratio_w, 2)
                    if start.get("y") is not None:
                        start["y"] = round(_num(start["y"], 0) * ratio_d, 2)
                if isinstance(end, dict):
                    if end.get("x") is not None:
                        end["x"] = round(_num(end["x"], 0) * ratio_w, 2)
                    if end.get("y") is not None:
                        end["y"] = round(_num(end["y"], 0) * ratio_d, 2)
                openings = wall.get("openings")
                if isinstance(openings, list):
                    for opening in openings:
                        if isinstance(opening, dict) and opening.get("offset_m") is not None:
                            opening["offset_m"] = round(
                                _num(opening["offset_m"], 0) * ratio_w, 2
                            )

        rooms = level.get("rooms")
        if isinstance(rooms, list):
            for room in rooms:
                if not isinstance(room, dict):
                    continue
                polygon = room.get("polygon")
                if isinstance(polygon, list):
                    for point in polygon:
                        if isinstance(point, dict):
                            if point.get("x") is not None:
                                point["x"] = round(_num(point["x"], 0) * ratio_w, 2)
                            if point.get("y") is not None:
                                point["y"] = round(_num(point["y"], 0) * ratio_d, 2)

    return result


def generate_building_definition(
    blueprint: dict[str, Any] | None,
    project_summary: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Create a lightweight, deterministic building model from agent/project metadata."""
    blueprint = deepcopy(blueprint or {})
    project_summary = deepcopy(project_summary or {})
    existing = blueprint.get("building_definition") or blueprint.get("buildingDefinition")
    if is_building_definition_sufficient(existing):
        building_type = blueprint.get("building_type") or _building_type(
            project_summary, blueprint
        )
        if building_type not in SUPPORTED_BUILDING_TYPES:
            building_type = "office_tower"
        stories = _resolve_stories(blueprint, project_summary)
        footprint = _resolve_footprint(
            project_summary, blueprint, stories, str(building_type)
        )
        return patch_building_definition_footprint(existing, footprint)

    building_type = blueprint.get("building_type") or _building_type(project_summary, blueprint)
    if building_type not in SUPPORTED_BUILDING_TYPES:
        building_type = "office_tower"

    stories = _resolve_stories(blueprint, project_summary)
    footprint = _resolve_footprint(project_summary, blueprint, stories, str(building_type))
    width = footprint["width_m"]
    depth = footprint["depth_m"]
    twin_tower = _is_twin_tower_project(project_summary, blueprint)
    facade_def = _facade(str(building_type))
    if twin_tower:
        facade_def = {
            **facade_def,
            "balconies": True,
            "balcony_depth_m": 1.6,
            "material": "cast_stone",
            "face_materials": {
                "front": "cast_stone",
                "back": "cast_stone",
                "left": "cast_stone",
                "right": "cast_stone",
            },
            "balcony_faces": ["front", "back"],
        }

    base_height = 8.5 if building_type == "warehouse" else 4.0
    if twin_tower:
        base_height = 3.6
    elif building_type == "hospital":
        base_height = 4.4
    elif building_type == "mixed_use":
        base_height = 4.2

    level_width = 14.0 if twin_tower else width
    level_depth = depth if twin_tower else depth

    levels: list[dict[str, Any]] = []
    for level in range(stories):
        if twin_tower:
            height = base_height if level == 0 else 3.2
        else:
            height = 5.2 if building_type == "mixed_use" and level < 3 else base_height
        rooms, partitions, stairs = _rooms_and_partitions(
            str(building_type), level, level_width, level_depth, height
        )
        levels.append(
            {
                "level": level,
                "name": "Ground Floor" if level == 0 else f"Level {level + 1}",
                "height_m": round(height, 2),
                "floorplate": {"width_m": level_width, "depth_m": level_depth},
                "rooms": rooms,
                "walls": _exterior_walls(
                    level_width,
                    level_depth,
                    level,
                    str(building_type),
                    window_pattern=str(facade_def.get("window_pattern", "grid")),
                ) + partitions,
                "stairs": stairs,
            }
        )

    total_height = round(sum(level["height_m"] for level in levels), 2)
    building_meta: dict[str, Any] = {
        "type": building_type,
        "stories": stories,
        "totalHeight_m": total_height,
        "footprint": footprint,
        "construction_type": blueprint.get("construction_type"),
        "roof_type": "sawtooth" if building_type == "warehouse" else "flat",
    }
    if twin_tower:
        building_meta["footprint_shape"] = "twin_tower"
        building_meta["cladding_material"] = "stone_white"
        building_meta["roof_type"] = "penthouse"

    return {
        "building": building_meta,
        "levels": levels,
        "facade": facade_def,
    }
