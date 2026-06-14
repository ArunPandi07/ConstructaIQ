export type BuildingType =
  | "residential_tower"
  | "office_tower"
  | "hospital"
  | "mixed_use"
  | "warehouse";

export type BuildingViewMode = "exterior" | "interior" | "exploded" | "section";

export type QualityTier = "low" | "medium" | "high";

export interface Point2D {
  x: number;
  y: number;
}

export interface Footprint {
  width_m: number;
  depth_m: number;
}

export interface OpeningDefinition {
  id?: string | null;
  type: "door" | "window" | "loading_bay";
  offset_m: number;
  width_m: number;
  height_m: number;
  sill_m: number;
}

export interface WallDefinition {
  id: string;
  start: Point2D;
  end: Point2D;
  thickness_m: number;
  type: "exterior" | "interior" | "core" | "partition";
  material?: string | null;
  openings?: OpeningDefinition[];
}

export interface RoomDefinition {
  id: string;
  name: string;
  polygon: Point2D[];
  height_m: number;
  type: string;
}

export interface StairDefinition {
  id?: string | null;
  position: Point2D;
  width_m: number;
  depth_m: number;
  direction: "up" | "down" | "both";
}

export interface LevelDefinition {
  level: number;
  name: string;
  height_m: number;
  floorplate: Footprint;
  rooms: RoomDefinition[];
  walls: WallDefinition[];
  stairs: StairDefinition[];
}

export interface BuildingMeta {
  type: BuildingType;
  stories: number;
  totalHeight_m: number;
  footprint: Footprint;
  construction_type?: string | null;
  roof_type: "flat" | "pitched" | "sawtooth";
}

export interface FacadeDefinition {
  balconies: boolean;
  balcony_depth_m: number;
  railing_height_m: number;
  window_pattern: "grid" | "strip" | "punched" | "industrial";
  material: string;
}

export interface BuildingDefinition {
  building: BuildingMeta;
  levels: LevelDefinition[];
  facade: FacadeDefinition;
}
