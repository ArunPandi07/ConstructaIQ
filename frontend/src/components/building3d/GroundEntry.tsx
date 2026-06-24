import { useMemo } from "react";
import * as THREE from "three";
import { getMaterial } from "./MaterialLibrary";
import type { PresentationSpec } from "../../types/presentationModel";

export function GroundEntry({ spec }: { spec: PresentationSpec }) {
  if (!spec.hasEntranceSteps) return null;

  const { width_m } = spec.footprint;

  // Entrance steps at ground floor (center front)
  const stepsCount = 4;
  const stepWidth = 6;
  const stepDepth = 0.4;
  const stepHeight = 0.15;

  const steps = [];
  for (let i = 0; i < stepsCount; i++) {
    steps.push(
      <mesh
        key={`step-${i}`}
        position={[
          width_m / 2,
          i * stepHeight + stepHeight / 2,
          -(stepsCount - i) * stepDepth + stepDepth / 2,
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[stepWidth, stepHeight, stepDepth]} />
        <primitive object={getMaterial("concrete")} attach="material" />
      </mesh>
    );
  }

  // Lobby Glazing
  // A large storefront glass panel behind the steps
  const lobbyHeight = spec.floorHeight_m * 0.8;
  const lobbyZ = 0.05;

  const glassMaterial = useMemo(
    () => new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    }),
    []
  );

  const frameMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1a1f2a", roughness: 0.5, metalness: 0.8 }),
    []
  );

  return (
    <group>
      {/* Entrance Steps */}
      {steps}

      {/* Lobby Glazing */}
      <mesh position={[width_m / 2, lobbyHeight / 2 + stepHeight * stepsCount, lobbyZ]}>
        <boxGeometry args={[stepWidth, lobbyHeight, 0.05]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/* Lobby Frame (Top) */}
      <mesh position={[width_m / 2, lobbyHeight + stepHeight * stepsCount, lobbyZ]}>
        <boxGeometry args={[stepWidth + 0.2, 0.1, 0.1]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {/* Lobby Frame (Left) */}
      <mesh position={[width_m / 2 - stepWidth / 2 - 0.05, lobbyHeight / 2 + stepHeight * stepsCount, lobbyZ]}>
        <boxGeometry args={[0.1, lobbyHeight, 0.1]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {/* Lobby Frame (Right) */}
      <mesh position={[width_m / 2 + stepWidth / 2 + 0.05, lobbyHeight / 2 + stepHeight * stepsCount, lobbyZ]}>
        <boxGeometry args={[0.1, lobbyHeight, 0.1]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
    </group>
  );
}
