import type { BuildingDefinition } from "../../types/building";
import type { PresentationSpec } from "../../types/presentationModel";

export function buildPresentationSpec(definition: BuildingDefinition): PresentationSpec {
  const { building, levels, facade } = definition;

  // Compute average floor height
  const floorHeight_m =
    levels.length > 0
      ? levels.reduce((sum, level) => sum + level.height_m, 0) / levels.length
      : 3.5;

  // Determine balconies
  // Full-width balconies for residential and mixed use
  const hasBalconies =
    facade.balconies &&
    (building.type === "residential_tower" || building.type === "mixed_use");

  // Balcony depth
  const balconyDepth_m = hasBalconies ? facade.balcony_depth_m || 1.5 : 0;

  // Spandrel band height (typically ~10-15% of floor height)
  const spandrelHeight_m = Math.min(0.5, floorHeight_m * 0.12);

  // Grouped window bays logic
  // Estimate window bay width based on building width to get ~N bays per face
  const avgWidth = (building.footprint.width_m + building.footprint.depth_m) / 2;
  const desiredBays = Math.max(2, Math.floor(avgWidth / 4)); // ~4m per bay max
  const windowBayWidth_m = avgWidth / desiredBays;

  const windowsPerBay = facade.window_pattern === "punched" ? 1 : 2;

  // Vertical fins (primarily for office or modern curtain walls)
  const finCount =
    building.type === "office_tower" || facade.material === "glass_curtain"
      ? Math.max(4, Math.floor(avgWidth / 2))
      : 0;

  // Entrance steps (exclude warehouse)
  const hasEntranceSteps = building.type !== "warehouse";

  // Rooftop pergola for towers
  const hasPergola =
    building.type === "office_tower" || building.type === "residential_tower";

  return {
    buildingType: building.type,
    stories: building.stories,
    totalHeight_m: building.totalHeight_m,
    footprint: building.footprint,
    floorHeight_m,
    facade,
    hasBalconies,
    balconyDepth_m,
    windowBayWidth_m,
    windowsPerBay,
    finCount,
    spandrelHeight_m,
    hasEntranceSteps,
    roofType: building.roof_type,
    hasPergola,
    windowPattern: facade.window_pattern,
  };
}
