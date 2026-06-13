import { useMemo } from "react";
import { MeshTransmissionMaterial } from "@react-three/drei";
import type { FacadeDefinition, WallDefinition } from "../../types/building";
import { getMaterial } from "./MaterialLibrary";
import { wallAngle, wallTransform } from "./geometryUtils";

interface Props {
  wall: WallDefinition;
  elevation: number;
  height: number;
  facade: FacadeDefinition;
  heroGlass?: boolean;
}

function mullionCount(length: number, pattern: FacadeDefinition["window_pattern"]): number {
  if (pattern === "strip") return Math.max(2, Math.floor(length / 4));
  if (pattern === "punched") return Math.max(2, Math.floor(length / 6));
  if (pattern === "industrial") return Math.max(1, Math.floor(length / 10));
  return Math.max(3, Math.floor(length / 2.8));
}

export default function CurtainWallMesh({
  wall,
  elevation,
  height,
  facade,
  heroGlass = false,
}: Props) {
  const transform = wallTransform(wall, elevation, height);
  const pattern = facade.window_pattern ?? "grid";
  const mullions = mullionCount(transform.length, pattern);
  const panelHeight = height * 0.92;
  const panelDepth = wall.thickness_m + 0.04;

  const mullionPositions = useMemo(() => {
    const margin = 0.4;
    const usable = Math.max(transform.length - margin * 2, 1);
    const step = usable / mullions;
    return Array.from(
      { length: mullions + 1 },
      (_, index) => -transform.length / 2 + margin + step * index,
    );
  }, [transform.length, mullions]);

  return (
    <group position={transform.center} rotation={[0, wallAngle(wall), 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[transform.length, height, panelDepth]} />
        <primitive object={getMaterial("curtain_wall")} attach="material" />
      </mesh>

      {pattern === "strip" ? (
        <mesh position={[0, height * 0.15, panelDepth * 0.35]}>
          <boxGeometry args={[transform.length * 0.96, panelHeight * 0.55, 0.03]} />
          {heroGlass ? (
            <MeshTransmissionMaterial
              transmission={0.92}
              thickness={0.04}
              roughness={0.04}
              ior={1.5}
              chromaticAberration={0.02}
              samples={3}
              resolution={256}
              color="#a8d8ff"
              backside
            />
          ) : (
            <primitive object={getMaterial("glass")} attach="material" />
          )}
        </mesh>
      ) : (
        mullionPositions.slice(0, -1).map((x, index) => {
          const next = mullionPositions[index + 1];
          const panelWidth = Math.max(next - x - 0.08, 0.4);
          const centerX = x + panelWidth / 2 + 0.04;
          return (
            <group key={`panel_${index}`} position={[centerX, height * 0.12, panelDepth * 0.35]}>
              <mesh>
                <boxGeometry args={[panelWidth, panelHeight * 0.75, 0.03]} />
                {heroGlass ? (
                  <MeshTransmissionMaterial
                    transmission={0.9}
                    thickness={0.03}
                    roughness={0.05}
                    ior={1.48}
                    chromaticAberration={0.015}
                    samples={3}
                    resolution={256}
                    color="#a8d8ff"
                    backside
                  />
                ) : (
                  <primitive object={getMaterial("glass")} attach="material" />
                )}
              </mesh>
              <mesh position={[0, panelHeight * 0.38, 0]}>
                <boxGeometry args={[panelWidth, 0.05, 0.05]} />
                <primitive object={getMaterial("steel")} attach="material" />
              </mesh>
            </group>
          );
        })
      )}

      {mullionPositions.map((x, index) => (
        <mesh key={`mullion_${index}`} position={[x, height * 0.1, panelDepth * 0.4]}>
          <boxGeometry args={[0.06, panelHeight, 0.06]} />
          <primitive object={getMaterial("steel")} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
