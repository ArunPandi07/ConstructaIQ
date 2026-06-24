import type { BuildingDefinition, BuildingViewMode } from "../../types/building";
import * as THREE from "three";
import LevelGroup from "./LevelGroup";
import SiteContext from "./SiteContext";

interface Props {
  definition: BuildingDefinition;
  viewMode: BuildingViewMode;
  activeLevel: number;
  clipPlane: THREE.Plane | null;
  qualityTier?: string;
}

export function AnalyticalScene({ definition, viewMode, activeLevel, clipPlane }: Props) {
  const level = definition.levels[activeLevel];
  const elevations = definition.levels.map((_l, i) =>
    definition.levels.slice(0, i).reduce((sum, cl) => sum + cl.height_m, 0)
  );
  
  if (!level) return null;

  return (
    <group>
      <LevelGroup
        level={level}
        elevation={elevations[activeLevel]}
        viewMode={viewMode}
        activeLevel={activeLevel}
        clipPlane={clipPlane}
        facade={definition.facade}
        buildingType={definition.building.type}
      />
      <SiteContext definition={definition} minimal />
    </group>
  );
}
