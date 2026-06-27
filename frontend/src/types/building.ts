export type BuildingType =
  | "residential_tower"
  | "office_tower"
  | "hospital"
  | "mixed_use"
  | "warehouse"
  | "villa"
  | "residential_villa"
  | "a_frame"
  | "high_rise"
  | "twin_tower"
  | "rectangular"
  | "l_shape"
  | "u_shape";

export type BuildingViewMode = "exterior";

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
  roof_type: "flat" | "pitched" | "sawtooth" | "pergola" | "penthouse";
  footprint_shape?: "rectangular" | "l_shape" | "u_shape" | "twin_tower" | "villa" | "a_frame" | "high_rise";
  cladding_material?: "stone_white" | "stone_dark" | "glass" | "concrete";
  primary_color?: string;
}

export interface FacadeDefinition {
  balconies: boolean;
  balcony_depth_m: number;
  railing_height_m: number;
  window_pattern: "grid" | "strip" | "punched" | "industrial";
  material: string;
  face_materials?: {
    front?: string;
    back?: string;
    left?: string;
    right?: string;
  };
  balcony_faces?: string[];
}

export interface BuildingDefinition {
  building: BuildingMeta;
  levels: LevelDefinition[];
  facade: FacadeDefinition;
}
