import { useRef } from 'react';
import type { BuildingDefinition } from '../../types/building';

interface SceneLightingProps {
  isDayMode: boolean;
  buildingDefinition?: BuildingDefinition;
}

// Generates uplights around the building perimeter for night mode
function FacadeUplights({ buildingDefinition }: { buildingDefinition: BuildingDefinition }) {
  const footprint = buildingDefinition.building.footprint;
  const halfW = footprint.width_m / 2;
  const halfD = footprint.depth_m / 2;
  
  // Create an array of points around the building base
  const positions = [
    [-halfW + 1, 0, halfD + 2],
    [0, 0, halfD + 2],
    [halfW - 1, 0, halfD + 2],
    [-halfW + 1, 0, -halfD - 2],
    [0, 0, -halfD - 2],
    [halfW - 1, 0, -halfD - 2],
  ];

  return (
    <group>
      {positions.map((pos, i) => (
        <SpotLightObj key={i} position={pos as [number, number, number]} />
      ))}
    </group>
  );
}

// A wrapper to cleanly handle SpotLight targets in React Three Fiber
function SpotLightObj({ position }: { position: [number, number, number] }) {
  const targetRef = useRef<any>(null);
  
  return (
    <>
      <spotLight
        color={0xff8820}
        intensity={3.5}
        distance={40}
        angle={Math.PI * 0.16}
        penumbra={0.35}
        decay={1.5}
        position={[position[0], position[1] + 0.5, position[2]]}
        target={targetRef.current || undefined}
      />
      {/* The target for the spotlight to point at (upwards on the facade) */}
      <object3D
        ref={targetRef}
        position={[position[0], position[1] + 14, position[2] > 0 ? position[2] - 2 : position[2] + 2]}
      />
    </>
  );
}

export function SceneLighting({ isDayMode, buildingDefinition }: SceneLightingProps) {
  return (
    <>
      {/* Ambient Light */}
      <ambientLight 
        intensity={isDayMode ? 1.8 : 0.1} 
        color={isDayMode ? 0xdce8f8 : 0x182040} 
      />
      
      {/* Hemisphere Light */}
      <hemisphereLight 
        args={[
          isDayMode ? 0xd8eeff : 0x334466, 
          isDayMode ? 0x8a9a70 : 0x110d08, 
          isDayMode ? 1.5 : 0.15
        ]} 
      />
      
      {/* Main Directional Light (Sun/Moon) */}
      <directionalLight
        color={isDayMode ? 0xfff8f0 : 0x6080cc}
        intensity={isDayMode ? 2.0 : 0.1}
        position={isDayMode ? [-25, 50, 30] : [-30, 60, 30]}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-45} 
        shadow-camera-right={45}
        shadow-camera-top={55} 
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
      />
      
      {/* Fill light (from Prototype 1) */}
      <directionalLight 
        color={0xc8ddf5} 
        intensity={isDayMode ? 0.7 : 0.0} 
        position={[20, 30, -20]} 
      />
      
      {/* Subtle rim light (from Prototype 1) */}
      <directionalLight 
        color={0xfff4e0} 
        intensity={isDayMode ? 0.35 : 0.0} 
        position={[0, 10, -40]} 
      />
      
      {/* Night-only: SpotLight uplighting (from Prototype 3) */}
      {!isDayMode && buildingDefinition && (
        <FacadeUplights buildingDefinition={buildingDefinition} />
      )}
    </>
  );
}
