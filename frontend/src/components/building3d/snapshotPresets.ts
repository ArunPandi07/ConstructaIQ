import type { BuildingDefinition, BuildingViewMode } from "../../types/building";

export type SnapshotPresentation =
  | "studio_exterior"
  | "street"
  | "aerial"
  | "corner"
  | "dollhouse"
  | "exploded"
  | "section";

export interface SnapshotPreset {
  id: string;
  label: string;
  description?: string;
  presentation: SnapshotPresentation;
  backgroundColor?: string;
  viewMode: BuildingViewMode;
  activeLevel: number;
  sectionPlaneY: number;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  fov: number;
}

/** Fit horizontal distance so building fills ~70% of frame across aspect ratios. */
export function fitHorizontalDistFactor(
  width_m: number,
  depth_m: number,
  totalHeight_m: number,
  baseFactor: number,
): number {
  const footprintMax = Math.max(width_m, depth_m, 1);
  const aspect = totalHeight_m / footprintMax;
  const tallBoost = aspect > 2.5 ? 0.06 * Math.min(aspect - 2.5, 4) : 0;
  const wideShrink = footprintMax / Math.max(totalHeight_m, 1) > 1.8 ? 0.04 : 0;
  return Math.max(0.48, Math.min(1.05, baseFactor + tallBoost - wideShrink));
}

function orbitCamera(
  cx: number,
  cy: number,
  cz: number,
  maxDim: number,
  horizontalDistFactor: number,
  heightFactor: number,
  azimuthRad: number,
  fov: number,
  targetY?: number,
): Pick<SnapshotPreset, "cameraPosition" | "cameraTarget" | "fov"> {
  const dist = Math.max(maxDim * horizontalDistFactor, 12);
  const x = cx + dist * Math.sin(azimuthRad);
  const z = cz + dist * Math.cos(azimuthRad);
  const y = cy + maxDim * heightFactor;
  return {
    cameraPosition: [x, y, z],
    cameraTarget: [cx, targetY ?? cy, cz],
    fov,
  };
}

export function buildSnapshotPresets(definition: BuildingDefinition): SnapshotPreset[] {
  const { width_m, depth_m } = definition.building.footprint;
  const totalHeight = definition.building.totalHeight_m;
  const maxDim = Math.max(width_m, depth_m, totalHeight, 1);
  const cx = width_m / 2;
  const cz = depth_m / 2;
  const cy = totalHeight / 2;
  const groundLevel = definition.levels[0];
  const sectionY = groundLevel ? groundLevel.height_m * 0.55 : totalHeight * 0.35;
  const midLevel = Math.min(
    Math.floor(definition.levels.length / 2),
    definition.levels.length - 1,
  );
  const groundTargetY = definition.levels[midLevel]?.height_m
    ? definition.levels[midLevel].height_m * 0.45
    : sectionY * 0.85;

  const heroDist = fitHorizontalDistFactor(width_m, depth_m, totalHeight, 0.68);
  const streetDist = fitHorizontalDistFactor(width_m, depth_m, totalHeight, 0.54);
  const aerialDist = fitHorizontalDistFactor(width_m, depth_m, totalHeight, 0.92);
  const cornerDist = fitHorizontalDistFactor(width_m, depth_m, totalHeight, 0.76);
  const dollhouseDist = fitHorizontalDistFactor(width_m, depth_m, totalHeight, 0.48);
  const sectionDist = fitHorizontalDistFactor(width_m, depth_m, totalHeight, 0.6);
  const explodedDist = fitHorizontalDistFactor(width_m, depth_m, totalHeight, 0.82);

  return [
    {
      id: "exterior-hero",
      label: "Exterior hero",
      description: "3/4 hero · studio lighting",
      presentation: "studio_exterior",
      backgroundColor: "#f4f6f8",
      viewMode: "exterior",
      activeLevel: 0,
      sectionPlaneY: sectionY,
      ...orbitCamera(cx, cy, cz, maxDim, heroDist, 0.12, 0.72, 36),
    },
    {
      id: "street-elevation",
      label: "Street elevation",
      description: "Ground-level podium read",
      presentation: "street",
      viewMode: "exterior",
      activeLevel: 0,
      sectionPlaneY: sectionY,
      ...orbitCamera(cx, cy * 0.65, cz, maxDim, streetDist, -0.06, 0.05, 34),
    },
    {
      id: "aerial",
      label: "Aerial",
      description: "Roof and massing overview",
      presentation: "aerial",
      viewMode: "exterior",
      activeLevel: 0,
      sectionPlaneY: sectionY,
      ...orbitCamera(cx, cy, cz, maxDim, aerialDist, 0.42, 0.55, 40),
    },
    {
      id: "corner-detail",
      label: "Corner detail",
      description: "Facade depth and corners",
      presentation: "corner",
      viewMode: "exterior",
      activeLevel: 0,
      sectionPlaneY: sectionY,
      ...orbitCamera(cx, cy, cz, maxDim, cornerDist, 0.16, 1.15, 35),
    },
    {
      id: "exploded",
      label: "Exploded",
      description: "Floor stack separation",
      presentation: "exploded",
      viewMode: "exploded",
      activeLevel: 0,
      sectionPlaneY: sectionY,
      ...orbitCamera(cx, cy, cz, maxDim, explodedDist, 0.22, 1.05, 34),
    },
    {
      id: "interior-dollhouse",
      label: "Interior dollhouse",
      description: "Cutaway interior view",
      presentation: "dollhouse",
      viewMode: "interior",
      activeLevel: midLevel,
      sectionPlaneY: sectionY,
      ...orbitCamera(cx, groundTargetY, cz, maxDim, dollhouseDist, 0.28, 0.68, 38, groundTargetY),
    },
    {
      id: "section-cut",
      label: "Section cut",
      description: "Vertical section slice",
      presentation: "section",
      viewMode: "section",
      activeLevel: 0,
      sectionPlaneY: sectionY,
      ...orbitCamera(cx, sectionY, cz, maxDim, sectionDist, 0.08, 0.62, 36, sectionY),
    },
  ];
}

export const SNAPSHOT_PRESET_COUNT = 7;

/** Native capture resolution (16:9). */
export const SNAPSHOT_WIDTH = 1920;
export const SNAPSHOT_HEIGHT = 1080;

export const THUMB_WIDTH = 320;
export const THUMB_HEIGHT = 180;
