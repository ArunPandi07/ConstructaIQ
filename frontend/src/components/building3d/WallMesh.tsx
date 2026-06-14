import { useMemo } from "react";
import * as THREE from "three";
import type { WallDefinition } from "../../types/building";
import { Base, Geometry, Subtraction } from "@react-three/csg";
import { claddingMaterialKey, getMaterial } from "./MaterialLibrary";
import { wallTransform } from "./geometryUtils";

interface Props {
  wall: WallDefinition;
  elevation: number;
  height: number;
  simplified?: boolean;
  clipPlane?: THREE.Plane | null;
  cutawayHidden?: boolean;
  showWallCap?: boolean;
  useCladding?: boolean;
  buildingType?: string;
}

export default function WallMesh({
  wall,
  elevation,
  height,
  simplified = false,
  clipPlane = null,
  cutawayHidden = false,
  showWallCap = false,
  useCladding = false,
  buildingType,
}: Props) {
  const transform = wallTransform(wall, elevation, height);
  const materialKey =
    useCladding && wall.type === "exterior"
      ? claddingMaterialKey(buildingType ?? "")
      : (wall.material ?? wall.type);

  const material = useMemo(() => {
    const mat = getMaterial(materialKey).clone();
    if (clipPlane) {
      mat.clippingPlanes = [clipPlane];
      mat.clipShadows = true;
    }
    if (useCladding && wall.type === "exterior" && mat.map) {
      mat.map.repeat.set(transform.length / 2, height / 2);
      mat.map.needsUpdate = true;
    }
    return mat;
  }, [materialKey, clipPlane, useCladding, wall.type, transform.length, height]);

  if (cutawayHidden) return null;

  return (
    <group position={transform.center} rotation={[0, transform.angle, 0]}>
      <mesh castShadow receiveShadow>
        {simplified || !wall.openings?.length ? (
          <boxGeometry args={[transform.length, height, wall.thickness_m]} />
        ) : (
          <Geometry computeVertexNormals>
            <Base>
              <boxGeometry args={[transform.length, height, wall.thickness_m]} />
            </Base>
            {wall.openings.map((opening, index) => (
              <Subtraction
                key={opening.id ?? `${wall.id}_opening_${index}`}
                position={[
                  -transform.length / 2 + opening.offset_m + opening.width_m / 2,
                  -height / 2 + opening.sill_m + opening.height_m / 2,
                  0,
                ]}
              >
                <boxGeometry
                  args={[opening.width_m, opening.height_m, wall.thickness_m + 0.08]}
                />
              </Subtraction>
            ))}
          </Geometry>
        )}
        <primitive object={material} attach="material" />
      </mesh>
      {showWallCap && (
        <mesh position={[0, height / 2 + 0.04, 0]} castShadow receiveShadow>
          <boxGeometry args={[transform.length, 0.08, wall.thickness_m + 0.04]} />
          <primitive object={getMaterial("wall_cap")} attach="material" />
        </mesh>
      )}
    </group>
  );
}
