from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


BuildingType = Literal[
    "residential_tower",
    "office_tower",
    "hospital",
    "mixed_use",
    "warehouse",
]


class Point2D(BaseModel):
    x: float
    y: float


class Footprint(BaseModel):
    width_m: float = Field(gt=0)
    depth_m: float = Field(gt=0)


class OpeningDefinition(BaseModel):
    id: str | None = None
    type: Literal["door", "window", "loading_bay"] = "window"
    offset_m: float = Field(ge=0)
    width_m: float = Field(gt=0)
    height_m: float = Field(gt=0)
    sill_m: float = Field(ge=0, default=0)


class WallDefinition(BaseModel):
    id: str
    start: Point2D
    end: Point2D
    thickness_m: float = Field(gt=0, default=0.25)
    type: Literal["exterior", "interior", "core", "partition"] = "interior"
    material: str | None = None
    openings: list[OpeningDefinition] = Field(default_factory=list)


class RoomDefinition(BaseModel):
    id: str
    name: str
    polygon: list[Point2D]
    height_m: float = Field(gt=0)
    type: str = "room"


class StairDefinition(BaseModel):
    id: str | None = None
    position: Point2D
    width_m: float = Field(gt=0)
    depth_m: float = Field(gt=0)
    direction: Literal["up", "down", "both"] = "up"


class LevelDefinition(BaseModel):
    level: int = Field(ge=0)
    name: str
    height_m: float = Field(gt=0)
    floorplate: Footprint
    rooms: list[RoomDefinition] = Field(default_factory=list)
    walls: list[WallDefinition] = Field(default_factory=list)
    stairs: list[StairDefinition] = Field(default_factory=list)


class BuildingMeta(BaseModel):
    type: BuildingType
    stories: int = Field(ge=1)
    totalHeight_m: float = Field(gt=0)
    footprint: Footprint
    construction_type: str | None = None
    roof_type: Literal["flat", "pitched", "sawtooth"] = "flat"


class FacadeDefinition(BaseModel):
    balconies: bool = False
    balcony_depth_m: float = Field(ge=0, default=0)
    railing_height_m: float = Field(gt=0, default=1.1)
    window_pattern: Literal["grid", "strip", "punched", "industrial"] = "grid"
    material: str = "concrete_with_glass"


class BuildingDefinition(BaseModel):
    building: BuildingMeta
    levels: list[LevelDefinition]
    facade: FacadeDefinition = Field(default_factory=FacadeDefinition)
