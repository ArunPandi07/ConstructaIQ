import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ViewerState } from './useViewerState';
import type { BuildingDefinition } from '../../types/building';

export const HIGH_RISE_CAMERA = {
  position: new THREE.Vector3(30, 25, 45),
  target: new THREE.Vector3(0, 10, 0),
};

export function HighRiseModel({
  buildingDefinition,
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
  const { levels } = buildingDefinition;

  const whiteColor = 0xf5f5f5;
  const greyColor = 0x6e7378;
  const glassColor = 0x88b0c4;
  const glassEmissive = 0x4a7a8c;
  const railingColor = 0x333333;

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

  return (
    <group>
      {/* Site / Ground */}
      {viewerState.layers.site && (
        <group>
          {/* Base Platform */}
          <mesh position={[0, -0.2, 0]} receiveShadow>
            <boxGeometry args={[30, 0.4, 25]} />
            <meshStandardMaterial color={0x9aa0a6} roughness={0.9} />
          </mesh>
          <mesh position={[-5, 0.05, 8]} receiveShadow>
            <boxGeometry args={[8, 0.1, 10]} />
            <meshStandardMaterial color={0xaaaaaa} roughness={0.8} />
          </mesh>
          <mesh position={[7, 0.05, 8]} receiveShadow>
            <boxGeometry args={[10, 0.1, 8]} />
            <meshStandardMaterial color={0x658c44} roughness={1} />
          </mesh>
        </group>
      )}

      {/* Floors */}
      {levels.map((level, i) => {
        const h = level.height_m;
        const yBase = i * (h + (isExploded ? 2 : 0));
        
        const vis = isExterior || isExploded || (isIsolate && viewerState.activeLevel === -1) || viewerState.activeLevel === i || (isFloorPlan && viewerState.activeLevel === -1);
        const opacity = getOpacity(viewerState.activeLevel, i);

        if (isFloorPlan && viewerState.activeLevel !== -1 && viewerState.activeLevel !== i) return null;

        return (
          <group key={`hr-${i}`} position={[0, yBase, 0]} visible={vis}>
            {/* Core Building Volumes */}
            {/* Left Block (Grey) */}
            <mesh position={[-4, h/2, 0]} castShadow receiveShadow>
              <boxGeometry args={[10, h, 14]} />
              <meshStandardMaterial color={greyColor} roughness={0.9} transparent opacity={opacity} />
            </mesh>
            {/* Right Block (White) */}
            <mesh position={[5, h/2, 2]} castShadow receiveShadow>
              <boxGeometry args={[8, h, 10]} />
              <meshStandardMaterial color={whiteColor} roughness={0.9} transparent opacity={opacity} />
            </mesh>

            {/* Facade Features */}
            {viewerState.layers.facade && (
              <>
                {/* Balconies on the Left Block */}
                {i > 0 && (
                  <group position={[-5, 0, 7]}>
                     {/* Balcony Slab */}
                     <mesh position={[0, 0.1, 1]} castShadow receiveShadow>
                       <boxGeometry args={[8, 0.2, 2]} />
                       <meshStandardMaterial color={0xcccccc} roughness={0.8} />
                     </mesh>
                     {/* Balcony Glass Railing */}
                     <mesh position={[0, 0.6, 1.95]} castShadow>
                       <boxGeometry args={[8, 1, 0.05]} />
                       <meshStandardMaterial color={0xaacccc} transparent opacity={0.4} roughness={0.1} />
                     </mesh>
                     {/* Window/Door to Balcony */}
                     <mesh position={[1, h/2, -0.01]} castShadow>
                       <boxGeometry args={[3, 2.2, 0.1]} />
                       <meshStandardMaterial ref={glassMatRef} color={isDayMode ? glassColor : 0x000000} emissive={isDayMode ? 0x000000 : glassEmissive} emissiveIntensity={isDayMode ? 0 : 0.8} roughness={0.1} metalness={0.8} transparent opacity={opacity} />
                     </mesh>
                  </group>
                )}

                {/* Awning Windows on the Right Block */}
                {i > 0 && (
                  <group position={[6, h/2, 7.01]}>
                    <mesh position={[0, 0, 0]} castShadow>
                      <boxGeometry args={[2, 1.5, 0.1]} />
                      <meshStandardMaterial color={isDayMode ? glassColor : 0x000000} emissive={isDayMode ? 0x000000 : glassEmissive} emissiveIntensity={isDayMode ? 0 : 0.8} roughness={0.1} metalness={0.8} transparent opacity={opacity} />
                    </mesh>
                    {/* Window Awning */}
                    <mesh position={[0, 0.8, 0.4]} castShadow>
                      <boxGeometry args={[2.4, 0.1, 0.8]} />
                      <meshStandardMaterial color={whiteColor} roughness={0.9} />
                    </mesh>
                  </group>
                )}

                {/* Large structural white frame at entrance */}
                {i === 0 && (
                  <group position={[-2, 0, 8]}>
                     <mesh position={[0, 4, 2]} castShadow receiveShadow>
                       <boxGeometry args={[12, 0.4, 4]} />
                       <meshStandardMaterial color={whiteColor} roughness={0.9} />
                     </mesh>
                     <mesh position={[5.8, 2, 3.8]} castShadow receiveShadow>
                       <boxGeometry args={[0.4, 4, 0.4]} />
                       <meshStandardMaterial color={whiteColor} roughness={0.9} />
                     </mesh>
                     {/* Entrance vertical slats */}
                     <group position={[3, 1.5, 0]}>
                       {Array.from({ length: 8 }).map((_, j) => (
                         <mesh key={`slat-${j}`} position={[j * 0.4, 0, 0]} castShadow>
                           <boxGeometry args={[0.1, 3, 0.2]} />
                           <meshStandardMaterial color={whiteColor} roughness={0.8} />
                         </mesh>
                       ))}
                     </group>
                  </group>
                )}
              </>
            )}
          </group>
        );
      })}
      
      {/* Roof Canopy */}
      {viewerState.layers.facade && !isFloorPlan && (
        <group position={[0, 7 * 3.2, 0]}>
          <mesh position={[5, 1, 2]} castShadow>
            <boxGeometry args={[8, 0.4, 10]} />
            <meshStandardMaterial color={whiteColor} roughness={0.9} />
          </mesh>
          <mesh position={[1.5, 1, 0]} castShadow>
            <boxGeometry args={[0.4, 2, 14]} />
            <meshStandardMaterial color={whiteColor} roughness={0.9} />
          </mesh>
        </group>
      )}
    </group>
  );
}
