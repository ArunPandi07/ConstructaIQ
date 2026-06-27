import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ViewerState } from './useViewerState';
import type { BuildingDefinition } from '../../types/building';

export const VILLA_CAMERA = {
  position: new THREE.Vector3(25, 20, 35),
  target: new THREE.Vector3(0, 4, 0),
};

export function VillaModel({
  isDayMode,
  viewerState,
}: {
  buildingDefinition: BuildingDefinition;
  isDayMode: boolean;
  viewerState: ViewerState;
}) {
  const isExterior = viewerState.mode === 'exterior';
  const isIsolate = viewerState.mode === 'level-isolate';
  const isFloorPlan = viewerState.mode === 'floor-plan';
  const isExploded = viewerState.mode === 'exploded';

  const brickColor = 0xb2573d;
  const stoneColor = 0xebe8e0;
  const glassColor = 0x88b0c4;
  const glassEmissive = 0x4a7a8c;
  const frameColor = 0x3d3a38;
  const woodColor = 0x967353;
  const poolWaterColor = 0x5dade2;

  const groundVis = isExterior || isExploded || (isIsolate && viewerState.activeLevel === -1) || viewerState.activeLevel === 0 || (isFloorPlan && viewerState.activeLevel === -1);
  const upperVis = isExterior || isExploded || (isIsolate && viewerState.activeLevel === -1) || viewerState.activeLevel === 1 || (isFloorPlan && viewerState.activeLevel === -1);

  const glassMatRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (!isDayMode && glassMatRef.current) {
      glassMatRef.current.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  const getOpacity = (activeLevel: number, level: number) => {
    if (isIsolate && activeLevel !== -1 && activeLevel !== level) return 0.1;
    return 1.0;
  };

  const groundOpacity = getOpacity(viewerState.activeLevel, 0);
  const upperOpacity = getOpacity(viewerState.activeLevel, 1);

  return (
    <group>
      {/* Site / Ground */}
      {viewerState.layers.site && (
        <group>
          {/* Base Platform */}
          <mesh position={[0, -0.2, 0]} receiveShadow>
            <boxGeometry args={[32, 0.4, 28]} />
            <meshStandardMaterial color={0x9aa0a6} roughness={0.9} />
          </mesh>
          
          {/* Lawns */}
          <mesh position={[-10, 0.05, 10]} receiveShadow>
            <boxGeometry args={[8, 0.1, 6]} />
            <meshStandardMaterial color={0x658c44} roughness={1} />
          </mesh>
          <mesh position={[10, 0.05, 10]} receiveShadow>
            <boxGeometry args={[8, 0.1, 6]} />
            <meshStandardMaterial color={0x658c44} roughness={1} />
          </mesh>
          
          {/* Pool */}
          <mesh position={[0, 0.1, 10]} receiveShadow>
            <boxGeometry args={[6, 0.2, 4]} />
            <meshStandardMaterial color={0xdddddd} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.15, 10]}>
            <boxGeometry args={[5.6, 0.1, 3.6]} />
            <meshStandardMaterial color={poolWaterColor} transparent opacity={0.8} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* Ground Floor */}
      {(groundVis || groundOpacity > 0.1) && (
        <group position={[0, 0, 0]} visible={groundVis}>
          {/* Main Block */}
          <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[20, 3.2, 12]} />
            <meshStandardMaterial color={brickColor} roughness={0.8} transparent opacity={groundOpacity} />
          </mesh>
          
          {/* Front Windows */}
          <mesh position={[-5, 1.6, 6.01]} castShadow>
            <boxGeometry args={[6, 2, 0.1]} />
            <meshStandardMaterial ref={glassMatRef} color={isDayMode ? glassColor : 0x000000} emissive={isDayMode ? 0x000000 : glassEmissive} emissiveIntensity={isDayMode ? 0 : 0.8} roughness={0.1} metalness={0.8} transparent opacity={groundOpacity} />
          </mesh>
          <mesh position={[5, 1.6, 6.01]} castShadow>
            <boxGeometry args={[6, 2, 0.1]} />
            <meshStandardMaterial color={isDayMode ? glassColor : 0x000000} emissive={isDayMode ? 0x000000 : glassEmissive} emissiveIntensity={isDayMode ? 0 : 0.8} roughness={0.1} metalness={0.8} transparent opacity={groundOpacity} />
          </mesh>
          
          {/* Entrance Pergola */}
          <group position={[0, 3.2, 6]}>
            <mesh position={[0, -0.1, 2]} castShadow>
              <boxGeometry args={[4, 0.2, 4]} />
              <meshStandardMaterial color={woodColor} roughness={0.7} />
            </mesh>
            {/* Pillars */}
            <mesh position={[-1.8, -1.6, 3.8]} castShadow>
              <boxGeometry args={[0.2, 3.2, 0.2]} />
              <meshStandardMaterial color={woodColor} roughness={0.7} />
            </mesh>
            <mesh position={[1.8, -1.6, 3.8]} castShadow>
              <boxGeometry args={[0.2, 3.2, 0.2]} />
              <meshStandardMaterial color={woodColor} roughness={0.7} />
            </mesh>
          </group>
          
          {/* Side Pergola */}
          <group position={[-11, 1.6, 0]}>
            <mesh position={[0, 1.5, 0]} castShadow>
              <boxGeometry args={[2, 0.2, 8]} />
              <meshStandardMaterial color={woodColor} roughness={0.7} />
            </mesh>
            {Array.from({ length: 5 }).map((_, i) => (
              <mesh key={`p-${i}`} position={[-0.8, 0, -3 + i * 1.5]} castShadow>
                <boxGeometry args={[0.2, 3.2, 0.2]} />
                <meshStandardMaterial color={woodColor} roughness={0.7} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* First Floor */}
      {(upperVis || upperOpacity > 0.1) && (
        <group position={[0, isExploded ? 3.2 + 2 : 3.2, 0]} visible={upperVis}>
          {/* Main Block */}
          <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[18, 3.2, 10]} />
            <meshStandardMaterial color={stoneColor} roughness={0.6} transparent opacity={upperOpacity} />
          </mesh>
          
          {/* Balcony Floor */}
          <mesh position={[0, 0.1, 6]} castShadow receiveShadow>
            <boxGeometry args={[20, 0.2, 4]} />
            <meshStandardMaterial color={0x555555} roughness={0.8} />
          </mesh>
          <mesh position={[-10, 0.1, 0]} castShadow receiveShadow>
            <boxGeometry args={[2, 0.2, 12]} />
            <meshStandardMaterial color={0x555555} roughness={0.8} />
          </mesh>
          <mesh position={[10, 0.1, 0]} castShadow receiveShadow>
            <boxGeometry args={[2, 0.2, 12]} />
            <meshStandardMaterial color={0x555555} roughness={0.8} />
          </mesh>

          {/* Glass Railings */}
          <mesh position={[0, 0.7, 7.9]} castShadow>
            <boxGeometry args={[20, 1.2, 0.05]} />
            <meshStandardMaterial color={0xaacccc} transparent opacity={0.4} roughness={0.1} />
          </mesh>
          <mesh position={[-9.9, 0.7, 0]} castShadow>
            <boxGeometry args={[0.05, 1.2, 16]} />
            <meshStandardMaterial color={0xaacccc} transparent opacity={0.4} roughness={0.1} />
          </mesh>
          <mesh position={[9.9, 0.7, 0]} castShadow>
            <boxGeometry args={[0.05, 1.2, 16]} />
            <meshStandardMaterial color={0xaacccc} transparent opacity={0.4} roughness={0.1} />
          </mesh>

          {/* Stone Chimneys/Features */}
          <mesh position={[-4, 1.6, 5.2]} castShadow>
            <boxGeometry args={[2, 4.2, 1]} />
            <meshStandardMaterial color={0x7d736a} roughness={0.9} />
          </mesh>
          <mesh position={[6, 1.6, 5.2]} castShadow>
            <boxGeometry args={[1.5, 4.2, 1]} />
            <meshStandardMaterial color={0x7d736a} roughness={0.9} />
          </mesh>

          {/* Central Glass Cylinder */}
          <mesh position={[1.5, 1.6, 4.5]} castShadow>
            <cylinderGeometry args={[2, 2, 3.8, 16, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color={isDayMode ? glassColor : 0x000000} emissive={isDayMode ? 0x000000 : glassEmissive} emissiveIntensity={isDayMode ? 0 : 0.8} roughness={0.1} metalness={0.8} transparent opacity={upperOpacity} />
          </mesh>
          {/* Cylinder Mullions */}
          {Array.from({ length: 7 }).map((_, i) => (
             <mesh key={`cm-${i}`} position={[1.5 + Math.cos(i * Math.PI/6) * 2.05, 1.6, 4.5 + Math.sin(i * Math.PI/6) * 2.05]} castShadow>
                <boxGeometry args={[0.05, 3.8, 0.05]} />
                <meshStandardMaterial color={frameColor} />
             </mesh>
          ))}

          {/* Upper Windows */}
          <mesh position={[-6, 1.6, 5.01]} castShadow>
             <boxGeometry args={[3, 2, 0.1]} />
             <meshStandardMaterial color={isDayMode ? glassColor : 0x000000} emissive={isDayMode ? 0x000000 : glassEmissive} emissiveIntensity={isDayMode ? 0 : 0.8} roughness={0.1} metalness={0.8} transparent opacity={upperOpacity} />
          </mesh>
          <mesh position={[4, 1.6, 5.01]} castShadow>
             <boxGeometry args={[1.5, 2, 0.1]} />
             <meshStandardMaterial color={isDayMode ? glassColor : 0x000000} emissive={isDayMode ? 0x000000 : glassEmissive} emissiveIntensity={isDayMode ? 0 : 0.8} roughness={0.1} metalness={0.8} transparent opacity={upperOpacity} />
          </mesh>
          
          {/* Roof Slab */}
          {!isFloorPlan && (
            <mesh position={[0, 3.3, 0]} castShadow receiveShadow>
              <boxGeometry args={[18.4, 0.2, 10.4]} />
              <meshStandardMaterial color={0xdddddd} roughness={0.7} />
            </mesh>
          )}
        </group>
      )}
    </group>
  );
}
