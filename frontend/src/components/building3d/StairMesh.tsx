import type { StairDefinition } from "../../types/building";
import { getMaterial } from "./MaterialLibrary";

interface Props {
  stair: StairDefinition;
  elevation: number;
  floorHeight: number;
}

export default function StairMesh({ stair, elevation, floorHeight }: Props) {
  const steps = 8;
  const stepDepth = stair.depth_m / steps;
  const stepHeight = Math.min(floorHeight / steps, 0.28);

  return (
    <group position={[stair.position.x, elevation + 0.05, stair.position.y]}>
      {Array.from({ length: steps }, (_, index) => (
        <mesh
          key={`${stair.id ?? "stair"}_${index}`}
          position={[
            stair.width_m / 2,
            stepHeight * index + stepHeight / 2,
            stepDepth * index + stepDepth / 2,
          ]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[stair.width_m, stepHeight, stepDepth]} />
          <primitive object={getMaterial("concrete")} attach="material" />
        </mesh>
      ))}
      <mesh position={[stair.width_m + 0.08, floorHeight * 0.35, stair.depth_m / 2]}>
        <boxGeometry args={[0.08, floorHeight * 0.7, stair.depth_m]} />
        <primitive object={getMaterial("railing")} attach="material" />
      </mesh>
    </group>
  );
}
