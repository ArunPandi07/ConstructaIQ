import type { BuildingType, FacadeDefinition } from "./building";

export interface PresentationSpec {
  buildingType: BuildingType;
  stories: number;
  totalHeight_m: number;
  footprint: { width_m: number; depth_m: number };
  floorHeight_m: number;   // average floor-to-floor height
  facade: FacadeDefinition;
  hasBalconies: boolean;   // full-width balcony every floor?
  balconyDepth_m: number;  // how far balcony projects
  windowBayWidth_m: number; // width of a grouped window bay (default 2.8m)
  windowsPerBay: number;   // windows per group (default 2)
  finCount: number;        // vertical fins per facade face
  spandrelHeight_m: number;// dark band height at each slab edge (default 0.4m)
  hasEntranceSteps: boolean;
  roofType: "flat" | "pitched" | "sawtooth";
  hasPergola: boolean;     // rooftop pergola for towers
  windowPattern: FacadeDefinition["window_pattern"];
}
