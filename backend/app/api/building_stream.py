"""
Building Stream SSE endpoint.

GET /projects/{project_id}/building-stream

Two modes:
- Replay (DB has building_definition_json):  stream stored levels with 800ms pacing.
- Live (no stored definition):               call vLLM with streaming + emit each
                                             complete level object as SSE event.
"""
from __future__ import annotations

import asyncio
import json
import re
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, status
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.repositories.project_repository import ProjectRepository
from app.services.logging_service import get_logger
from app.services.llm_service import LLMService

logger = get_logger("BuildingStream")
router = APIRouter(prefix="/projects", tags=["Building Stream"])

# ── JSON Schema for vLLM guided decoding (Level array, max 20) ────────────────

LEVEL_SCHEMA = {
    "type": "object",
    "required": ["level", "name", "height_m", "floorplate", "rooms", "walls", "stairs"],
    "properties": {
        "level": {"type": "integer", "minimum": 0, "maximum": 19},
        "name": {"type": "string"},
        "height_m": {"type": "number"},
        "floorplate": {
            "type": "object",
            "required": ["width_m", "depth_m"],
            "properties": {"width_m": {"type": "number"}, "depth_m": {"type": "number"}}
        },
        "rooms": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["id", "name", "type", "height_m", "polygon"],
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "type": {"type": "string"},
                    "height_m": {"type": "number"},
                    "polygon": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["x", "y"],
                            "properties": {"x": {"type": "number"}, "y": {"type": "number"}}
                        }
                    }
                }
            }
        },
        "walls": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["id", "start", "end", "thickness_m", "type"],
                "properties": {
                    "id": {"type": "string"},
                    "start": {"type": "object", "properties": {"x": {"type": "number"}, "y": {"type": "number"}}},
                    "end": {"type": "object", "properties": {"x": {"type": "number"}, "y": {"type": "number"}}},
                    "thickness_m": {"type": "number"},
                    "type": {"type": "string", "enum": ["exterior", "interior", "core", "partition"]},
                    "material": {"type": "string"},
                    "openings": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["type", "offset_m", "width_m", "height_m", "sill_m"],
                            "properties": {
                                "type": {"type": "string", "enum": ["door", "window", "loading_bay"]},
                                "offset_m": {"type": "number"},
                                "width_m": {"type": "number"},
                                "height_m": {"type": "number"},
                                "sill_m": {"type": "number"}
                            }
                        }
                    }
                }
            }
        },
        "stairs": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["position", "width_m", "depth_m", "direction"],
                "properties": {
                    "position": {"type": "object", "properties": {"x": {"type": "number"}, "y": {"type": "number"}}},
                    "width_m": {"type": "number"},
                    "depth_m": {"type": "number"},
                    "direction": {"type": "string", "enum": ["up", "down", "both"]}
                }
            }
        }
    }
}

BUILDING_STREAM_SCHEMA = {
    "type": "object",
    "required": ["shell", "levels"],
    "properties": {
        "shell": {
            "type": "object",
            "required": ["building", "facade"],
            "properties": {
                "building": {"type": "object"},
                "facade": {"type": "object"}
            }
        },
        "levels": {
            "type": "array",
            "maxItems": 20,
            "items": LEVEL_SCHEMA
        }
    }
}


def _try_extract_level_objects(text: str) -> tuple[list[dict], str]:
    """
    Scan accumulated text for complete JSON level objects.
    Returns (list_of_complete_level_dicts, remaining_text).
    """
    levels: list[dict] = []
    # Look for balanced { } blocks that contain "level":
    i = 0
    while i < len(text):
        if text[i] == '{':
            depth = 0
            start = i
            j = i
            in_string = False
            escape = False
            while j < len(text):
                ch = text[j]
                if escape:
                    escape = False
                elif ch == '\\' and in_string:
                    escape = True
                elif ch == '"':
                    in_string = not in_string
                elif not in_string:
                    if ch == '{':
                        depth += 1
                    elif ch == '}':
                        depth -= 1
                        if depth == 0:
                            candidate = text[start:j+1]
                            try:
                                obj = json.loads(candidate)
                                if isinstance(obj, dict) and "level" in obj and "walls" in obj:
                                    levels.append(obj)
                                    text = text[j+1:]
                                    i = -1
                                    break
                            except (json.JSONDecodeError, ValueError):
                                pass
                            break
                j += 1
        i += 1
    return levels, text


async def _stream_from_db(
    building_def: dict,
    pacing_ms: float = 800,
) -> AsyncGenerator[dict, None]:
    """Replay a stored building_definition floor by floor."""
    shell = {
        "building": building_def.get("building", {}),
        "facade": building_def.get("facade", {}),
    }
    yield {"event": "shell", "data": json.dumps({"type": "shell", "payload": shell})}

    levels = building_def.get("levels", [])
    # Enforce 20-floor cap
    levels = levels[:20]
    total = len(levels)

    for idx, level in enumerate(levels):
        await asyncio.sleep(pacing_ms / 1000)
        yield {
            "event": "level",
            "data": json.dumps({
                "type": "level",
                "payload": level,
                "floor_index": idx,
                "total_floors": total,
            })
        }

    yield {"event": "complete", "data": json.dumps({"type": "complete", "total_floors": total})}


async def _stream_from_llm(
    project_context: str,
    llm_service: LLMService,
) -> AsyncGenerator[dict, None]:
    """
    Stream building definition from Gemma via vLLM with SSE events per level.
    Uses guided JSON decoding for structural guarantees.
    """
    from app.orchestrator.analyze_orchestrator import BLUEPRINT_AGENT_INSTRUCTIONS

    prompt = f"""{BLUEPRINT_AGENT_INSTRUCTIONS}

Project Context:
{project_context}

CRITICAL: Max 20 floors total. Output in streaming-friendly order:
First output the shell object (building + facade), then each level one at a time.
Enforce building.stories <= 20.

Return a single JSON object matching this structure:
{{
  "shell": {{ "building": {{...}}, "facade": {{...}} }},
  "levels": [ {{ "level": 0, ... }}, {{ "level": 1, ... }}, ... ]
}}
"""
    buffer = ""
    shell_sent = False

    try:
        async for token in llm_service.astream_messages([
            {"role": "user", "content": prompt}
        ]):
            buffer += token

            # Try to extract shell first
            if not shell_sent and '"shell"' in buffer:
                try:
                    # Look for complete shell object
                    shell_match = re.search(r'"shell"\s*:\s*(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})', buffer)
                    if shell_match:
                        shell_obj = json.loads(shell_match.group(1))
                        yield {"event": "shell", "data": json.dumps({"type": "shell", "payload": shell_obj})}
                        shell_sent = True
                except (json.JSONDecodeError, AttributeError):
                    pass

            # Try to extract complete level objects
            if '"levels"' in buffer or '"level"' in buffer:
                # Extract portion after "levels": [
                levels_start = buffer.find('"levels"')
                if levels_start >= 0:
                    search_text = buffer[levels_start:]
                    extracted, remaining_part = _try_extract_level_objects(search_text)
                    for lvl in extracted:
                        # Cap at 20
                        if lvl.get("level", 0) >= 20:
                            continue
                        yield {
                            "event": "level",
                            "data": json.dumps({"type": "level", "payload": lvl})
                        }
                    if extracted:
                        buffer = buffer[:levels_start] + remaining_part

    except Exception as e:
        logger.exception("LLM stream error: %s", e)
        yield {"event": "error", "data": json.dumps({"type": "error", "message": str(e)})}
        return

    yield {"event": "complete", "data": json.dumps({"type": "complete"})}


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.get("/{project_id}/building-stream")
async def building_stream(
    project_id: int,
    live: bool = False,
    pacing_ms: float = 800,
    db: AsyncSession = Depends(get_db),
):
    """
    Stream building_definition levels via SSE.

    - By default (live=false): replays stored building_definition_json from DB
      with 800ms pacing — instant, no LLM cost, reproducible for demos.
    - With live=true: triggers fresh Gemma-4-26b generation via vLLM streaming
      with guided JSON decoding.
    """
    project_repo = ProjectRepository(db)
    project = await project_repo.get_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Replay mode — use stored definition
    if not live and project.building_definition_json:
        try:
            building_def = json.loads(project.building_definition_json)
        except (json.JSONDecodeError, TypeError):
            building_def = None

        if building_def:
            return EventSourceResponse(
                _stream_from_db(building_def, pacing_ms=pacing_ms),
                media_type="text/event-stream",
            )

    # Live generation mode
    llm_service = LLMService()
    project_context = f"""
Project: {project.project_name or "Unknown"}
Client: {project.client_name or "Unknown"}
Location: {project.location or "Unknown"}
Type: {project.project_type or "commercial"}
Floors: {min(project.floor_count or 10, 20)}
Area: {project.square_footage or 5000} sqft
Budget: {project.contract_value or "Unknown"}
Scope: {project.scope or "General construction"}
""".strip()

    return EventSourceResponse(
        _stream_from_llm(project_context, llm_service),
        media_type="text/event-stream",
    )
