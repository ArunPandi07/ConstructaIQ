import { useMemo } from "react";
import * as THREE from "three";
import { Instances, Instance } from "@react-three/drei";
import type { PresentationSpec } from "../../types/presentationModel";
import type { BuildingDefinition } from "../../types/building";
import { MassingVolume } from "./MassingVolume";
import { FacadeFloorBands } from "./FacadeFloorBands";
import { GroundEntry } from "./GroundEntry";
import { RooftopPergola } from "./RooftopPergola";
import RoofMesh from "./RoofMesh";
import SiteContext from "./SiteContext";
import { getMaterial } from "./MaterialLibrary";

interface Props {
  spec: PresentationSpec;
  definition: BuildingDefinition;
  viewMode: string;
}

export function PresentationScene({ spec, definition, viewMode }: Props) {
  const { totalHeight_m, footprint: { width_m, depth_m }, stories, floorHeight_m } = spec;

  // In exploded mode, we hide the main facade details and show slab outlines
  if (viewMode === "exploded") {
    const explodedGap = Math.max(floorHeight_m * 0.8, 3.0);
    
    // Create an array of slab instances
    const slabs = Array.from({ length: stories }, (_, i) => i);
    
    return (
      <group>
        <SiteContext definition={definition} />
        
        {/* Slightly transparent central core column to anchor the exploded view */}
        <mesh position={[width_m / 2, totalHeight_m / 2, depth_m / 2]}>
          <boxGeometry args={[width_m * 0.3, totalHeight_m + (stories * explodedGap), depth_m * 0.3]} />
          <meshStandardMaterial color="#2d3540" transparent opacity={0.3} roughness={0.9} />
        </mesh>
        
        {/* Stacked slab outlines */}
        <Instances limit={stories}>
          <boxGeometry args={[width_m, 0.3, depth_m]} />
          <primitive object={getMaterial("slab_band")} attach="material" />
          {slabs.map((floor) => {
            const y = floor * floorHeight_m + floor * explodedGap;
            return <Instance key={`exploded-slab-${floor}`} position={[width_m / 2, y, depth_m / 2]} />;
          })}
        </Instances>
      </group>
    );
  }

  // Exterior Mode
  return (
    <group>
      <MassingVolume spec={spec} />
      <FacadeFloorBands spec={spec} />
      <GroundEntry spec={spec} />
      <RooftopPergola spec={spec} />
      
      {/* Existing RoofMesh for the parapet / roof cap, placed exactly on top */}
      <group position={[0, totalHeight_m, 0]}>
        <RoofMesh definition={definition} />
      </group>
      
      <SiteContext definition={definition} />
    </group>
  );
}
