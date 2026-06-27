import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ViewerState } from './useViewerState';
import type { BuildingDefinition } from '../../types/building';

export const AFRAME_CAMERA = {
  position: new THREE.Vector3(20, 15, 25),
  target: new THREE.Vector3(0, 4, 0),
};

export function AFrameModel({
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

  const wallColor = 0xf0efe9;
  const woodColor = 0xb48b62;
  const roofColor = 0x4a4a4a;
  const garageColor = 0x5a5c5f;
  const glassColor = 0x88b0c4;
  const glassEmissive = 0x4a7a8c;

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
            <boxGeometry args={[30, 0.4, 24]} />
            <meshStandardMaterial color={0x9aa0a6} roughness={0.9} />
          </mesh>
          {/* Driveway */}
          <mesh position={[-6, 0.05, 7]} receiveShadow>
            <boxGeometry args={[8, 0.1, 10]} />
            <meshStandardMaterial color={0xaaaaaa} roughness={0.8} />
          </mesh>
          {/* Lawns */}
          <mesh position={[6, 0.05, 6]} receiveShadow>
            <boxGeometry args={[14, 0.1, 10]} />
            <meshStandardMaterial color={0x658c44} roughness={1} />
          </mesh>
        </group>
      )}

      {/* Ground Floor */}
      {(groundVis || groundOpacity > 0.1) && (
        <group position={[0, 0, 0]} visible={groundVis}>
          {/* Left Block (Garage & Flat) */}
          <mesh position={[-5, 1.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[10, 3.5, 10]} />
            <meshStandardMaterial color={woodColor} roughness={0.8} transparent opacity={groundOpacity} />
          </mesh>
          
          {/* Garage Door */}
          <mesh position={[-5, 1.5, 5.01]} castShadow>
            <boxGeometry args={[7, 2.5, 0.1]} />
            <meshStandardMaterial color={garageColor} roughness={0.6} transparent opacity={groundOpacity} />
          </mesh>
          
          {/* Right Block (A-Frame Base) */}
          <mesh position={[5, 1.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[10, 3.5, 10]} />
            <meshStandardMaterial color={wallColor} roughness={0.9} transparent opacity={groundOpacity} />
          </mesh>
          
          {/* Right Windows */}
          <mesh position={[5, 1.75, 5.01]} castShadow>
            <boxGeometry args={[4, 2.5, 0.1]} />
            <meshStandardMaterial ref={glassMatRef} color={isDayMode ? glassColor : 0x000000} emissive={isDayMode ? 0x000000 : glassEmissive} emissiveIntensity={isDayMode ? 0 : 0.8} roughness={0.1} metalness={0.8} transparent opacity={groundOpacity} />
          </mesh>
          
          {/* Entrance Door */}
          <mesh position={[1, 1.5, 5.01]} castShadow>
            <boxGeometry args={[1.5, 2.8, 0.1]} />
            <meshStandardMaterial color={0x734a29} roughness={0.7} transparent opacity={groundOpacity} />
          </mesh>
          
          {/* Side Pergola */}
          <group position={[12, 3.5, 0]}>
             <mesh position={[-2, -0.1, 0]} castShadow>
                <boxGeometry args={[4, 0.2, 10]} />
                <meshStandardMaterial color={0xeeeeee} roughness={0.7} />
             </mesh>
             <mesh position={[0, -1.75, 4.8]} castShadow>
                <boxGeometry args={[0.3, 3.5, 0.3]} />
                <meshStandardMaterial color={0xeeeeee} roughness={0.7} />
             </mesh>
             <mesh position={[0, -1.75, -4.8]} castShadow>
                <boxGeometry args={[0.3, 3.5, 0.3]} />
                <meshStandardMaterial color={0xeeeeee} roughness={0.7} />
             </mesh>
          </group>
        </group>
      )}

      {/* First Floor & Roof */}
      {(upperVis || upperOpacity > 0.1) && (
        <group position={[0, isExploded ? 3.5 + 2 : 3.5, 0]} visible={upperVis}>
          {/* Left Block Upper (Flat) */}
          <mesh position={[-5, 1.5, -2]} castShadow receiveShadow>
            <boxGeometry args={[10, 3.0, 6]} />
            <meshStandardMaterial color={wallColor} roughness={0.9} transparent opacity={upperOpacity} />
          </mesh>
          
          {/* Balcony Floor */}
          {!isFloorPlan && (
            <mesh position={[-5, 0.1, 3]} castShadow receiveShadow>
              <boxGeometry args={[10, 0.2, 4]} />
              <meshStandardMaterial color={0x888888} roughness={0.8} />
            </mesh>
          )}

          {/* Glass Railing */}
          <mesh position={[-5, 0.6, 4.9]} castShadow>
             <boxGeometry args={[10, 1.0, 0.05]} />
             <meshStandardMaterial color={0xaacccc} transparent opacity={0.3} roughness={0.1} />
          </mesh>
          
          {/* A-Frame Right Side (Pitched) */}
          <group position={[5, 0, 0]}>
             {/* Core Wall block to support the pitch */}
             <mesh position={[0, 2, 0]} castShadow receiveShadow>
               <boxGeometry args={[9, 4, 9]} />
               <meshStandardMaterial color={wallColor} roughness={0.9} transparent opacity={upperOpacity} />
             </mesh>
             
             {/* Huge front window */}
             <mesh position={[0, 2, 4.51]} castShadow>
               <boxGeometry args={[7, 3, 0.1]} />
               <meshStandardMaterial color={isDayMode ? glassColor : 0x000000} emissive={isDayMode ? 0x000000 : glassEmissive} emissiveIntensity={isDayMode ? 0 : 0.8} roughness={0.1} metalness={0.8} transparent opacity={upperOpacity} />
             </mesh>

             {/* Pitched Roof Panels */}
             {!isFloorPlan && (
               <group>
                 <mesh position={[-4.5, 2.5, 0]} rotation={[0, 0, Math.PI/4]} castShadow receiveShadow>
                   <boxGeometry args={[8, 0.2, 10.4]} />
                   <meshStandardMaterial color={roofColor} roughness={0.7} />
                 </mesh>
                 <mesh position={[4.5, 2.5, 0]} rotation={[0, 0, -Math.PI/4]} castShadow receiveShadow>
                   <boxGeometry args={[8, 0.2, 10.4]} />
                   <meshStandardMaterial color={roofColor} roughness={0.7} />
                 </mesh>
                 
                 {/* Chimney */}
                 <mesh position={[-3.5, 3.5, -2]} castShadow receiveShadow>
                   <boxGeometry args={[1.2, 4, 1.2]} />
                   <meshStandardMaterial color={0x555555} roughness={0.9} />
                 </mesh>
               </group>
             )}
          </group>
        </group>
      )}
    </group>
  );
}
