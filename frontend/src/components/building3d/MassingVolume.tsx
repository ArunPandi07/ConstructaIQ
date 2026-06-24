import { useMemo } from "react";
import * as THREE from "three";
import { getMaterial } from "./MaterialLibrary";
import type { PresentationSpec } from "../../types/presentationModel";

export function MassingVolume({ spec }: { spec: PresentationSpec }) {
  const { footprint, totalHeight_m, buildingType, floorHeight_m } = spec;
  const { width_m, depth_m } = footprint;

  // Single building body box
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(width_m, totalHeight_m, depth_m);
  }, [width_m, totalHeight_m, depth_m]);

  // Handle two-tone mixed_use massing
  if (buildingType === "mixed_use") {
    const podiumFloors = 3;
    const podiumHeight = podiumFloors * floorHeight_m;
    const towerHeight = totalHeight_m - podiumHeight;

    const podiumGeo = new THREE.BoxGeometry(width_m, podiumHeight, depth_m);
    const towerGeo = new THREE.BoxGeometry(width_m, towerHeight, depth_m);

    return (
      <group>
        <mesh
          position={[width_m / 2, podiumHeight / 2, depth_m / 2]}
          geometry={podiumGeo}
          castShadow
          receiveShadow
        >
          <primitive object={getMaterial("concrete")} attach="material" />
        </mesh>
        <mesh
          position={[width_m / 2, podiumHeight + towerHeight / 2, depth_m / 2]}
          geometry={towerGeo}
          castShadow
          receiveShadow
        >
          <primitive object={getMaterial("white_render") || getMaterial("concrete")} attach="material" />
        </mesh>
      </group>
    );
  }

  // Standard single volume (residential, office, warehouse)
  return (
    <mesh
      position={[width_m / 2, totalHeight_m / 2, depth_m / 2]}
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <primitive object={getMaterial("concrete")} attach="material" />
    </mesh>
  );
}
