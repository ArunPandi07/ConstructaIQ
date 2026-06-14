from __future__ import annotations

import json
from typing import Any


def parse_work_packages(raw: str | None) -> dict[str, list[Any]]:
    """Parse schedules.work_packages JSON with legacy flat-array support."""
    if not raw:
        return {"dependencies": [], "materials": []}
    try:
        parsed = json.loads(raw) if isinstance(raw, str) else raw
    except json.JSONDecodeError:
        return {"dependencies": [], "materials": []}

    if isinstance(parsed, dict):
        deps = parsed.get("dependencies")
        mats = parsed.get("materials")
        return {
            "dependencies": deps if isinstance(deps, list) else [],
            "materials": mats if isinstance(mats, list) else [],
        }

    if isinstance(parsed, list):
        if not parsed:
            return {"dependencies": [], "materials": []}
        first = parsed[0]
        if isinstance(first, dict) and (
            "predecessor" in first or "successor" in first
        ):
            return {"dependencies": parsed, "materials": []}
        return {"dependencies": [], "materials": parsed}

    return {"dependencies": [], "materials": []}
