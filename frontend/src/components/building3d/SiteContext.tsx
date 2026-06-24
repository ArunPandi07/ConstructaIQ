import { useMemo } from "react";
import * as THREE from "three";
import type { BuildingDefinition } from "../../types/building";
import { useBuildingStore } from "../../stores/buildingStore";
import { getMaterial } from "./MaterialLibrary";

interface Props {
  definition: BuildingDefinition;
  showGrid?: boolean;
  /** Snapshot captures: plain pad only — no neighbors, trees, or site furniture. */
  minimal?: boolean;
}

import { Instances, Instance } from "@react-three/drei";

function TreeInstances({ positions }: { positions: Array<[number, number, number]> }) {
  if (positions.length === 0) return null;

  return (
    <group>
      <Instances limit={positions.length} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.8, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} metalness={0} />
        {positions.map((pos, i) => (
          <Instance
            key={`trunk_${i}`}
            position={[pos[0], pos[1] + 0.9, pos[2]]}
            scale={[0.85 + (i % 3) * 0.15, 0.85 + (i % 3) * 0.15, 0.85 + (i % 3) * 0.15]}
          />
        ))}
      </Instances>
      <Instances limit={positions.length} castShadow>
        <coneGeometry args={[1.4, 2.2, 8]} />
        <meshStandardMaterial color="#4a7c45" roughness={0.85} metalness={0} />
        {positions.map((pos, i) => {
          const s = 0.85 + (i % 3) * 0.15;
          return (
            <Instance
              key={`foliage_${i}`}
              position={[pos[0], pos[1] + 1.8 * s + 1.4 * s * 0.6, pos[2]]}
              scale={[s, s, s]}
            />
          );
        })}
      </Instances>
    </group>
  );
}

export default function SiteContext({
  definition,
  showGrid = true,
  minimal = false,
}: Props) {
  const qualityTier = useBuildingStore((state) => state.qualityTier);
  const { width_m, depth_m } = definition.building.footprint;
  const type = definition.building.type;
  const padW = width_m + 14;
  const padD = depth_m + 14;

  // All hooks must be declared unconditionally — before any early return
  const contextualBlocks = useMemo(() => {
    if (type === "warehouse" || type === "hospital") return [];
    const offsets: Array<[number, number, number, number, number]> = [
      [width_m + 18, depth_m * 0.35, 14, 22, 16],
      [-14, depth_m * 0.55, 12, 18, 28],
      [width_m * 0.2, depth_m + 16, 16, 20, 14],
      [width_m * 0.7, -12, 11, 16, 20],
    ];
    return offsets;
  }, [type, width_m, depth_m]);

  const grassPatches = useMemo(() => {
    const patches: Array<[number, number, number, number]> = [
      [-padW * 0.35, -padD * 0.35, 5, 4],
      [padW * 0.38, -padD * 0.3, 4.5, 3.5],
      [-padW * 0.3, padD * 0.32, 4, 5],
      [padW * 0.35, padD * 0.38, 5.5, 4],
      [padW * 0.42, padD * 0.05, 3, 3],
    ];
    return patches;
  }, [padW, padD]);

  const treePositions = useMemo(() => {
    if (type === "warehouse" || qualityTier === "low") return [];
    const margin = Math.max(padW, padD) * 0.48;
    return [
      [-margin, 0, -margin * 0.7],
      [margin * 0.9, 0, -margin * 0.85],
      [-margin * 0.85, 0, margin * 0.75],
      [margin, 0, margin * 0.65],
      [-margin * 0.5, 0, margin],
      [margin * 0.55, 0, -margin],
      [-margin, 0, margin * 0.2],
      [margin * 0.7, 0, margin * 0.9],
    ] as Array<[number, number, number]>;
  }, [type, qualityTier, padW, padD]);

  const grassMat = useMemo(() => {
    const mat = getMaterial("grass_patch").clone();
    if (mat.map) {
      mat.map.repeat.set(2, 2);
      mat.map.needsUpdate = true;
    }
    return mat;
  }, []);

  const perimeterGrassMat = useMemo(() => {
    const mat = getMaterial("grass_patch").clone();
    if (mat.map) {
      mat.map.repeat.set(1, 1);
      mat.map.needsUpdate = true;
    }
    return mat;
  }, []);

  if (minimal) {
    return (
      <group position={[width_m / 2, 0, depth_m / 2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.21, 0]} receiveShadow>
          <planeGeometry args={[padW + 2, padD + 2]} />
          <meshStandardMaterial color="#e8eef4" roughness={0.92} metalness={0} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[width_m / 2, 0, depth_m / 2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, 0]} receiveShadow>
        <planeGeometry args={[padW + 24, padD + 24]} />
        <primitive object={getMaterial("asphalt")} attach="material" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
        <planeGeometry args={[padW + 6, padD + 6]} />
        <primitive object={getMaterial("sidewalk")} attach="material" />
      </mesh>

      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[padW, 0.08, padD]} />
        <primitive object={getMaterial("concrete")} attach="material" />
      </mesh>

      {grassPatches.map(([x, z, w, d], index) => (
        <mesh
          key={`grass_${index}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, -0.17, z]}
          receiveShadow
          material={grassMat}
        >
          <planeGeometry args={[w, d]} />
        </mesh>
      ))}

      {type === "warehouse" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.21, padD * 0.35]} receiveShadow>
          <planeGeometry args={[padW * 0.7, padD * 0.45]} />
          <primitive object={getMaterial("asphalt")} attach="material" />
        </mesh>
      )}

      {contextualBlocks.map(([x, z, w, h, d], index) => (
        <mesh key={index} position={[x - width_m / 2, d / 2, z - depth_m / 2]} castShadow receiveShadow>
          <boxGeometry args={[w, d, h]} />
          <primitive object={getMaterial("context")} attach="material" />
        </mesh>
      ))}

      {/* The Road */}
      {!minimal && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.21, padD / 2 + 8]} receiveShadow>
          <planeGeometry args={[padW + 24, 12]} />
          <primitive object={getMaterial("road")} attach="material" />
        </mesh>
      )}

      <TreeInstances positions={treePositions} />

      {type !== "warehouse" && (
        <group>
          {/* Bus Shelter */}
          <mesh position={[0, 0.6, -depth_m / 2 - 0.5]} castShadow>
            <boxGeometry args={[3.5, 0.12, 1.8]} />
            <primitive object={getMaterial("steel")} attach="material" />
          </mesh>
          <mesh position={[-1.6, 0.3, -depth_m / 2 - 0.5]} castShadow>
            <boxGeometry args={[0.1, 0.6, 1.6]} />
            <primitive object={getMaterial("steel")} attach="material" />
          </mesh>
          <mesh position={[1.6, 0.3, -depth_m / 2 - 0.5]} castShadow>
            <boxGeometry args={[0.1, 0.6, 1.6]} />
            <primitive object={getMaterial("steel")} attach="material" />
          </mesh>
        </group>
      )}

      {/* Green perimeter strips between building edge and sidewalk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, -depth_m / 2 - 1.8]} receiveShadow material={perimeterGrassMat}>
        <planeGeometry args={[width_m + 4, 3.2]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, depth_m / 2 + 1.8]} receiveShadow material={perimeterGrassMat}>
        <planeGeometry args={[width_m + 4, 3.2]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-width_m / 2 - 1.8, -0.18, 0]} receiveShadow material={perimeterGrassMat}>
        <planeGeometry args={[3.2, depth_m + 4]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width_m / 2 + 1.8, -0.18, 0]} receiveShadow material={perimeterGrassMat}>
        <planeGeometry args={[3.2, depth_m + 4]} />
      </mesh>

      {showGrid && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.19, 0]}>
          <planeGeometry args={[padW + 40, padD + 40]} />
          <meshStandardMaterial
            color="#d1d5db"
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
