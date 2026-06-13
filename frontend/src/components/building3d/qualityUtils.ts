import type { BuildingDefinition, LevelDefinition, QualityTier } from "../../types/building";

export type EnvironmentPreset =
  | "apartment"
  | "city"
  | "dawn"
  | "forest"
  | "lobby"
  | "night"
  | "park"
  | "studio"
  | "sunset"
  | "warehouse";

export function environmentPreset(buildingType: string): EnvironmentPreset {
  const type = buildingType.toLowerCase();
  if (type.includes("warehouse")) return "warehouse";
  if (type.includes("hospital")) return "park";
  if (type.includes("residential") || type.includes("apartment")) return "dawn";
  if (type.includes("office") || type.includes("tower")) return "city";
  if (type.includes("retail") || type.includes("mixed")) return "sunset";
  return "city";
}

export function lodBand(definition: BuildingDefinition, tier: QualityTier): number {
  const stories = definition.building.stories;
  const footprintArea =
    definition.building.footprint.width_m * definition.building.footprint.depth_m;
  const type = definition.building.type;

  let band =
    tier === "low" ? 1 : tier === "high" ? 3 : 2;

  if (type === "warehouse" || footprintArea > 2500) {
    band = Math.max(1, band - 1);
  }
  if (stories < 6 && tier !== "low") {
    band += 1;
  }
  return band;
}

export function levelWallSignature(level: LevelDefinition): string {
  return level.walls
    .map((wall) => {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const len = Math.round(Math.hypot(dx, dy));
      return `${wall.type ?? "w"}:${len}:${wall.openings?.length ?? 0}`;
    })
    .join("|");
}

export function isRepresentativeMiddleFloor(
  definition: BuildingDefinition,
  levelIndex: number,
): boolean {
  const stories = definition.building.stories;
  if (stories <= 8 || levelIndex <= 1 || levelIndex >= stories - 2) {
    return false;
  }
  const reference = levelWallSignature(definition.levels[1] ?? definition.levels[levelIndex]);
  return levelWallSignature(definition.levels[levelIndex]) === reference;
}

export function postFxSettings(tier: QualityTier) {
  if (tier === "low") {
    return { ao: false, bloom: false, smaa: false, vignette: false, aoQuality: "low" as const };
  }
  if (tier === "high") {
    return {
      ao: true,
      bloom: true,
      smaa: true,
      vignette: true,
      aoQuality: "high" as const,
      bloomIntensity: 0.45,
      bloomThreshold: 0.85,
    };
  }
  return {
    ao: true,
    bloom: true,
    smaa: false,
    vignette: false,
    aoQuality: "medium" as const,
    bloomIntensity: 0.3,
    bloomThreshold: 1.2,
  };
}

export function shadowMapSize(tier: QualityTier): number {
  return tier === "high" ? 2048 : tier === "medium" ? 1536 : 1024;
}

export function canvasDpr(tier: QualityTier): number {
  return tier === "high" ? Math.min(window.devicePixelRatio, 2) : 1;
}
