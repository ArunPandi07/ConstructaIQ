import type { OpeningDefinition, WallDefinition } from "../../types/building";
import { getMaterial } from "./MaterialLibrary";
import { openingPosition, wallAngle } from "./geometryUtils";

interface Props {
  wall: WallDefinition;
  opening: OpeningDefinition;
  elevation: number;
}

export default function DoorMesh({ wall, opening, elevation }: Props) {
  const position = openingPosition(wall, opening, elevation, 0.22);
  const rotationY = wallAngle(wall);
  const isLoadingBay = opening.type === "loading_bay";

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[opening.width_m, opening.height_m, 0.08]} />
        <primitive object={getMaterial(isLoadingBay ? "steel" : "wood")} attach="material" />
      </mesh>
      <mesh position={[0, opening.height_m / 2 + 0.07, 0]}>
        <boxGeometry args={[opening.width_m + 0.24, 0.14, 0.12]} />
        <primitive object={getMaterial("steel")} attach="material" />
      </mesh>
      <mesh position={[-opening.width_m / 2 - 0.07, 0, 0]}>
        <boxGeometry args={[0.14, opening.height_m + 0.22, 0.12]} />
        <primitive object={getMaterial("steel")} attach="material" />
      </mesh>
      <mesh position={[opening.width_m / 2 + 0.07, 0, 0]}>
        <boxGeometry args={[0.14, opening.height_m + 0.22, 0.12]} />
        <primitive object={getMaterial("steel")} attach="material" />
      </mesh>
      {isLoadingBay && (
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[opening.width_m * 0.88, 0.08, 0.1]} />
          <primitive object={getMaterial("railing")} attach="material" />
        </mesh>
      )}
    </group>
  );
}
