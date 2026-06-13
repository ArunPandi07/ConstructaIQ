import { describe, expect, it } from "vitest";
import { lodBand, levelWallSignature } from "./qualityUtils";
import { claddingMaterialKey } from "./MaterialLibrary";
import type { BuildingDefinition, LevelDefinition } from "../../types/building";

// Re-export merge for test - actually merge is backend only. Test lodBand and signature.

function stubLevel(level: number): LevelDefinition {
  return {
    level,
    name: `Level ${level}`,
    height_m: 4,
    floorplate: { width_m: 40, depth_m: 35 },
    rooms: [],
    walls: [
      {
        id: `w_${level}`,
        start: { x: 0, y: 0 },
        end: { x: 40, y: 0 },
        thickness_m: 0.3,
        type: "exterior",
        openings: [{ type: "window", offset_m: 5, width_m: 1.4, height_m: 1.8, sill_m: 0.9 }],
      },
    ],
    stairs: [],
  };
}

function stubDefinition(stories: number, type: BuildingDefinition["building"]["type"] = "office_tower"): BuildingDefinition {
  return {
    building: {
      type,
      stories,
      totalHeight_m: stories * 4,
      footprint: { width_m: 40, depth_m: 35 },
      roof_type: "flat",
    },
    levels: Array.from({ length: stories }, (_, i) => stubLevel(i)),
    facade: {
      balconies: false,
      balcony_depth_m: 0,
      railing_height_m: 1.1,
      window_pattern: "grid",
      material: "curtain_wall",
    },
  };
}

describe("qualityUtils", () => {
  it("computes lod band based on tier and building size", () => {
    const def = stubDefinition(42);
    expect(lodBand(def, "low")).toBe(1);
    expect(lodBand(def, "high")).toBeGreaterThanOrEqual(3);
  });

  it("produces stable wall signatures for representative floors", () => {
    const level = stubLevel(2);
    const sig = levelWallSignature(level);
    expect(sig).toContain("exterior");
    expect(levelWallSignature(stubLevel(3))).toBe(sig);
  });

  it("maps building types to cladding materials", () => {
    expect(claddingMaterialKey("office_tower")).toBe("tile_cladding");
    expect(claddingMaterialKey("warehouse")).toBe("brick_cladding");
  });
});

describe("CurtainWallMesh module", () => {
  it("imports without error", async () => {
    const module = await import("./CurtainWallMesh");
    expect(module.default).toBeDefined();
  }, 30000);
});
