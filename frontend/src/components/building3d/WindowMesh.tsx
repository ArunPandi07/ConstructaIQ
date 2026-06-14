import { MeshTransmissionMaterial } from "@react-three/drei";
import type { OpeningDefinition, WallDefinition } from "../../types/building";
import { getMaterial } from "./MaterialLibrary";
import { openingPosition, wallAngle } from "./geometryUtils";

interface Props {
  wall: WallDefinition;
  opening: OpeningDefinition;
  elevation: number;
  heroGlass?: boolean;
}

export default function WindowMesh({ wall, opening, elevation, heroGlass = false }: Props) {
  const position = openingPosition(wall, opening, elevation, 0.2);
  const rotationY = wallAngle(wall);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[opening.width_m, opening.height_m, 0.045]} />
        {heroGlass ? (
          <MeshTransmissionMaterial
            transmission={0.95}
            thickness={0.04}
            roughness={0.03}
            ior={1.52}
            chromaticAberration={0.02}
            samples={3}
            resolution={256}
            color="#a8dfff"
            backside
          />
        ) : (
          <meshPhysicalMaterial
            transmission={0.88}
            thickness={0.02}
            roughness={0.05}
            ior={1.52}
            color="#88ccff"
            envMapIntensity={1.0}
          />
        )}
      </mesh>
      <mesh position={[0, opening.height_m / 2 + 0.05, 0]}>
        <boxGeometry args={[opening.width_m + 0.14, 0.08, 0.08]} />
        <primitive object={getMaterial("steel")} attach="material" />
      </mesh>
      <mesh position={[0, -opening.height_m / 2 - 0.05, 0]}>
        <boxGeometry args={[opening.width_m + 0.14, 0.08, 0.08]} />
        <primitive object={getMaterial("steel")} attach="material" />
      </mesh>
      <mesh position={[-opening.width_m / 2 - 0.05, 0, 0]}>
        <boxGeometry args={[0.08, opening.height_m + 0.16, 0.08]} />
        <primitive object={getMaterial("steel")} attach="material" />
      </mesh>
      <mesh position={[opening.width_m / 2 + 0.05, 0, 0]}>
        <boxGeometry args={[0.08, opening.height_m + 0.16, 0.08]} />
        <primitive object={getMaterial("steel")} attach="material" />
      </mesh>
      <mesh position={[0, -opening.height_m / 2 - 0.05, 0.04]} castShadow>
        <boxGeometry args={[opening.width_m + 0.35, 0.1, 0.2]} />
        <primitive object={getMaterial("tile_cladding")} attach="material" />
      </mesh>
    </group>
  );
}
