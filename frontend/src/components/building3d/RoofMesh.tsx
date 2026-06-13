import type { BuildingDefinition } from "../../types/building";
import { getMaterial } from "./MaterialLibrary";

interface Props {
  definition: BuildingDefinition;
}

export default function RoofMesh({ definition }: Props) {
  const { footprint, roof_type, type } = definition.building;
  const topElevation = definition.levels.reduce((sum, level) => sum + level.height_m, 0);
  const isTerraceType =
    type === "office_tower" || type === "residential_tower" || type === "mixed_use";
  const terraceInset = 0.15;
  const terraceW = footprint.width_m * (1 - terraceInset * 2);
  const terraceD = footprint.depth_m * (1 - terraceInset * 2);

  if (roof_type === "pitched") {
    return (
      <group position={[footprint.width_m / 2, topElevation + 0.35, footprint.depth_m / 2]}>
        <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[footprint.width_m * 0.72, 0.42, footprint.depth_m + 1.2]} />
          <primitive object={getMaterial("roof")} attach="material" />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]} castShadow>
          <boxGeometry args={[footprint.width_m * 0.72, 0.42, footprint.depth_m + 1.2]} />
          <primitive object={getMaterial("roof")} attach="material" />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh
        position={[footprint.width_m / 2, topElevation + 0.18, footprint.depth_m / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[footprint.width_m + 0.7, 0.36, footprint.depth_m + 0.7]} />
        <primitive object={getMaterial("roof")} attach="material" />
      </mesh>

      {isTerraceType && (
        <group position={[footprint.width_m / 2, topElevation + 0.42, footprint.depth_m / 2]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[terraceW, 0.12, terraceD]} />
            <primitive object={getMaterial("concrete")} attach="material" />
          </mesh>
          {/* Parapet lip */}
          <mesh position={[0, 0.35, -terraceD / 2]}>
            <boxGeometry args={[terraceW, 0.5, 0.12]} />
            <primitive object={getMaterial("partition")} attach="material" />
          </mesh>
          <mesh position={[0, 0.35, terraceD / 2]}>
            <boxGeometry args={[terraceW, 0.5, 0.12]} />
            <primitive object={getMaterial("partition")} attach="material" />
          </mesh>
          <mesh position={[-terraceW / 2, 0.35, 0]}>
            <boxGeometry args={[0.12, 0.5, terraceD]} />
            <primitive object={getMaterial("partition")} attach="material" />
          </mesh>
          <mesh position={[terraceW / 2, 0.35, 0]}>
            <boxGeometry args={[0.12, 0.5, terraceD]} />
            <primitive object={getMaterial("partition")} attach="material" />
          </mesh>
          {/* Pergola frame */}
          {[-terraceW * 0.3, terraceW * 0.3].map((x, i) => (
            <mesh key={`pergola_post_${i}`} position={[x, 0.75, -terraceD * 0.25]} castShadow>
              <boxGeometry args={[0.1, 1.2, 0.1]} />
              <primitive object={getMaterial("steel")} attach="material" />
            </mesh>
          ))}
          <mesh position={[0, 1.35, -terraceD * 0.25]} castShadow>
            <boxGeometry args={[terraceW * 0.65, 0.08, 0.08]} />
            <primitive object={getMaterial("steel")} attach="material" />
          </mesh>
          <mesh position={[0, 1.35, terraceD * 0.15]} castShadow>
            <boxGeometry args={[terraceW * 0.55, 0.08, 0.08]} />
            <primitive object={getMaterial("steel")} attach="material" />
          </mesh>
          {[-terraceW * 0.25, terraceW * 0.25].map((x, i) => (
            <mesh key={`pergola_beam_${i}`} position={[x, 1.1, 0]} castShadow>
              <boxGeometry args={[0.06, 0.06, terraceD * 0.5]} />
              <primitive object={getMaterial("steel")} attach="material" />
            </mesh>
          ))}
        </group>
      )}

      {!isTerraceType && (
        <mesh
          position={[footprint.width_m / 2, topElevation + 0.62, footprint.depth_m / 2]}
          castShadow
        >
          <boxGeometry args={[Math.min(footprint.width_m * 0.25, 9), 0.5, 0.8]} />
          <primitive object={getMaterial("steel")} attach="material" />
        </mesh>
      )}
    </group>
  );
}
