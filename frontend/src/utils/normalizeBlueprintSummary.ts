import type { BlueprintSummaryData } from "../types";

export interface FootprintMetrics {
  width_m?: number;
  depth_m?: number;
}

export interface NormalizedBlueprintSummary {
  scalars: Record<string, unknown>;
  mepHighlights: Record<string, unknown> | null;
  footprint: FootprintMetrics | null;
  structuralQuantities: Record<string, unknown>;
  levelCount: number;
}

const WRAPPER_KEYS = new Set(["blueprint_summary", "blueprintSummary"]);

const EXCLUDED_KEYS = new Set([
  "building_definition",
  "buildingDefinition",
  "levels",
  "building",
  "footprint_m",
  "structural_quantities",
  "mep_highlights",
  "stories_above_grade",
  "floor_count",
  "project_name",
]);

const STRUCTURAL_KEYS = new Set([
  "concrete_cy",
  "structural_steel_tons",
  "structural_steel_ton",
  "rebar_tons",
  "rebar_ton",
  "curtain_wall_sf",
  "metal_deck_sf",
  "lateral_system",
]);

const FOOTPRINT_KEYS = new Set(["width_m", "depth_m"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function unwrapBlueprintSummary(raw: Record<string, unknown>): Record<string, unknown> {
  let current = { ...raw };

  for (let depth = 0; depth < 5; depth += 1) {
    const wrapperKey = ["blueprint_summary", "blueprintSummary"].find(
      (key) => key in current && isRecord(current[key]),
    );
    if (!wrapperKey) break;

    const inner = current[wrapperKey] as Record<string, unknown>;
    const { [wrapperKey]: _removed, ...rest } = current;
    current = { ...rest, ...inner };
  }

  return current;
}

function flattenMetricGroups(raw: Record<string, unknown>): Record<string, unknown> {
  const flattened: Record<string, unknown> = { ...raw };

  const footprint = raw.footprint_m;
  if (isRecord(footprint)) {
    for (const [key, value] of Object.entries(footprint)) {
      if (!(key in flattened)) flattened[key] = value;
    }
  }

  const structural = raw.structural_quantities;
  if (isRecord(structural)) {
    for (const [key, value] of Object.entries(structural)) {
      if (!(key in flattened)) flattened[key] = value;
    }
  }

  const buildingDef = raw.building_definition ?? raw.buildingDefinition;
  if (isRecord(buildingDef)) {
    const building = buildingDef.building;
    if (isRecord(building) && isRecord(building.footprint)) {
      if (!flattened.width_m && building.footprint.width_m != null) {
        flattened.width_m = building.footprint.width_m;
      }
      if (!flattened.depth_m && building.footprint.depth_m != null) {
        flattened.depth_m = building.footprint.depth_m;
      }
    }
  }

  if (
    flattened.structural_steel_ton != null &&
    flattened.structural_steel_tons == null
  ) {
    flattened.structural_steel_tons = flattened.structural_steel_ton;
  }
  if (flattened.rebar_ton != null && flattened.rebar_tons == null) {
    flattened.rebar_tons = flattened.rebar_ton;
  }

  return flattened;
}

function countLevels(raw: Record<string, unknown>): number {
  const buildingDef = raw.building_definition ?? raw.buildingDefinition;
  if (isRecord(buildingDef) && Array.isArray(buildingDef.levels)) {
    return buildingDef.levels.length;
  }
  if (Array.isArray(raw.levels)) {
    return raw.levels.length;
  }
  return 0;
}

function extractFootprint(flattened: Record<string, unknown>): FootprintMetrics | null {
  const width = flattened.width_m;
  const depth = flattened.depth_m;
  if (width == null && depth == null) return null;
  return {
    width_m: width != null ? Number(width) : undefined,
    depth_m: depth != null ? Number(depth) : undefined,
  };
}

function extractStructuralQuantities(
  flattened: Record<string, unknown>,
): Record<string, unknown> {
  const quantities: Record<string, unknown> = {};
  for (const key of STRUCTURAL_KEYS) {
    if (flattened[key] != null) {
      quantities[key] = flattened[key];
    }
  }
  return quantities;
}

function isScalar(value: unknown): boolean {
  return (
    value == null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

export function normalizeBlueprintSummary(
  summary: BlueprintSummaryData | Record<string, unknown> | null | undefined,
): NormalizedBlueprintSummary {
  if (!summary || !isRecord(summary)) {
    return {
      scalars: {},
      mepHighlights: null,
      footprint: null,
      structuralQuantities: {},
      levelCount: 0,
    };
  }

  const unwrapped = unwrapBlueprintSummary(summary as Record<string, unknown>);
  const flattened = flattenMetricGroups(unwrapped);
  const levelCount = countLevels(unwrapped);

  const mepRaw = flattened.mep_highlights;
  const mepHighlights = isRecord(mepRaw) ? mepRaw : null;

  const scalars: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flattened)) {
    if (WRAPPER_KEYS.has(key) || EXCLUDED_KEYS.has(key)) continue;
    if (STRUCTURAL_KEYS.has(key) || FOOTPRINT_KEYS.has(key)) continue;
    if (!isScalar(value)) continue;
    scalars[key] = value;
  }

  return {
    scalars,
    mepHighlights,
    footprint: extractFootprint(flattened),
    structuralQuantities: extractStructuralQuantities(flattened),
    levelCount,
  };
}
