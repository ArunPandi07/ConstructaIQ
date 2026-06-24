import { useMemo } from "react";
import * as THREE from "three";
import { Instances, Instance } from "@react-three/drei";
import type { PresentationSpec } from "../../types/presentationModel";

export function RooftopPergola({ spec }: { spec: PresentationSpec }) {
  if (!spec.hasPergola) return null;

  const { footprint, totalHeight_m } = spec;
  const { width_m, depth_m } = footprint;

  // Pergola sits above the roof
  const pergolaY = totalHeight_m + 1.2; 
  
  const steelMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2a2f3a", roughness: 0.6, metalness: 0.7 }),
    []
  );

  // Louvres: horizontal blades spanning most of the roof
  const louvreSpacing = 1.5;
  const louvreCount = Math.floor((depth_m - 2) / louvreSpacing);
  
  const louvres = [];
  for (let i = 0; i < louvreCount; i++) {
    const z = 1 + i * louvreSpacing + louvreSpacing / 2;
    // Angles slightly for the louvre look
    louvres.push(
      <Instance 
        key={`louvre-${i}`} 
        position={[width_m / 2, pergolaY, z]} 
        rotation={[Math.PI * 0.1, 0, 0]}
      />
    );
  }

  return (
    <group>
      {/* 4 Corner Posts */}
      <mesh position={[2, totalHeight_m + 0.6, 2]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 1.2, 0.2]} />
        <primitive object={steelMaterial} attach="material" />
      </mesh>
      <mesh position={[width_m - 2, totalHeight_m + 0.6, 2]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 1.2, 0.2]} />
        <primitive object={steelMaterial} attach="material" />
      </mesh>
      <mesh position={[2, totalHeight_m + 0.6, depth_m - 2]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 1.2, 0.2]} />
        <primitive object={steelMaterial} attach="material" />
      </mesh>
      <mesh position={[width_m - 2, totalHeight_m + 0.6, depth_m - 2]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 1.2, 0.2]} />
        <primitive object={steelMaterial} attach="material" />
      </mesh>

      {/* 2 Main Beams */}
      <mesh position={[2, pergolaY - 0.1, depth_m / 2]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.2, depth_m - 4]} />
        <primitive object={steelMaterial} attach="material" />
      </mesh>
      <mesh position={[width_m - 2, pergolaY - 0.1, depth_m / 2]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.2, depth_m - 4]} />
        <primitive object={steelMaterial} attach="material" />
      </mesh>

      {/* Louvre Blades */}
      <Instances limit={louvreCount} material={steelMaterial} castShadow receiveShadow>
        <boxGeometry args={[width_m - 4, 0.05, 0.3]} />
        {louvres}
      </Instances>
    </group>
  );
}
