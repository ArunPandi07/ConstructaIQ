import { describe, expect, it } from "vitest";
import type { BuildingDefinition } from "../../types/building";
import {
  buildSnapshotPresets,
  fitHorizontalDistFactor,
  SNAPSHOT_PRESET_COUNT,
  SNAPSHOT_HEIGHT,
  SNAPSHOT_WIDTH,
} from "./snapshotPresets";
import { hashBuildingDefinition } from "../../services/buildingSnapshotCache";

function stubDefinition(): BuildingDefinition {
  return {
    building: {
      type: "office_tower",
      stories: 8,
      totalHeight_m: 32,
      footprint: { width_m: 68, depth_m: 55 },
      roof_type: "flat",
    },
    levels: Array.from({ length: 8 }, (_, level) => ({
      level,
      name: level === 0 ? "Ground Floor" : `Level ${level + 1}`,
      height_m: 4,
      floorplate: { width_m: 68, depth_m: 55 },
      rooms: [],
      walls: [],
      stairs: [],
    })),
    facade: {
      balconies: true,
      balcony_depth_m: 1.5,
      railing_height_m: 1.1,
      window_pattern: "grid",
      material: "curtain_wall",
    },
  };
}

describe("buildingSnapshot", () => {
  it("hashBuildingDefinition is stable for same geometry", () => {
    const def = stubDefinition();
    expect(hashBuildingDefinition(def)).toBe(hashBuildingDefinition(def));
  });

  it("hashBuildingDefinition changes when footprint changes", () => {
    const a = stubDefinition();
    const b = stubDefinition();
    b.building.footprint.width_m = 70;
    expect(hashBuildingDefinition(a)).not.toBe(hashBuildingDefinition(b));
  });

  it("hashBuildingDefinition uses snapshotV 4 (distinct from legacy v3)", () => {
    const def = stubDefinition();
    const v4Hash = hashBuildingDefinition(def);
    const legacyPayload = {
      snapshotV: 3,
      type: def.building.type,
      stories: def.building.stories,
      totalHeight_m: def.building.totalHeight_m,
      footprint: def.building.footprint,
      levels: def.levels.length,
      roof: def.building.roof_type,
    };
    const str = JSON.stringify(legacyPayload);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const v3Hash = `h${Math.abs(hash)}`;
    expect(v4Hash).not.toBe(v3Hash);
  });

  it("buildSnapshotPresets returns seven unique presets with presentation tags", () => {
    const presets = buildSnapshotPresets(stubDefinition());
    expect(presets.length).toBe(SNAPSHOT_PRESET_COUNT);
    expect(SNAPSHOT_PRESET_COUNT).toBe(7);
    const ids = new Set(presets.map((p) => p.id));
    expect(ids.size).toBe(SNAPSHOT_PRESET_COUNT);
    expect(presets.map((p) => p.viewMode)).toContain("exploded");
    expect(presets.map((p) => p.viewMode)).toContain("interior");
    expect(presets.map((p) => p.viewMode)).toContain("section");
    expect(presets.every((p) => p.presentation && p.description)).toBe(true);
    expect(presets.find((p) => p.id === "corner-detail")).toBeDefined();
    expect(presets.find((p) => p.presentation === "studio_exterior")?.backgroundColor).toBe(
      "#f4f6f8",
    );
  });

  it("fitHorizontalDistFactor scales for tall towers vs wide footprints", () => {
    const tall = fitHorizontalDistFactor(40, 40, 200, 0.68);
    const wide = fitHorizontalDistFactor(120, 80, 24, 0.68);
    expect(tall).toBeGreaterThan(0.68);
    expect(wide).toBeLessThanOrEqual(0.68);
  });

  it("capture resolution constants are 1920x1080", () => {
    expect(SNAPSHOT_WIDTH).toBe(1920);
    expect(SNAPSHOT_HEIGHT).toBe(1080);
  });
});
