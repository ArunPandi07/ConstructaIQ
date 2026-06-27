import { ContactShadows } from '@react-three/drei';
import type { BuildingDefinition } from '../../types/building';

interface SceneEnvironmentProps {
  isDayMode: boolean;
  buildingDefinition?: BuildingDefinition;
}

// ── Procedural Tree (from Prototype 3) ──────────────────────────────────────
function Tree({
  position,
  height = 7,
  radius = 2.2,
}: {
  position: [number, number, number];
  height?: number;
  radius?: number;
}) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, height * 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.25, height * 0.4, 6]} />
        <meshStandardMaterial color={0x3d2010} roughness={1} />
      </mesh>
      {/* Leaf layers (3 stacked cones) */}
      {[
        { y: 0, r: radius },
        { y: height * 0.2, r: radius * 0.75 },
        { y: height * 0.4, r: radius * 0.5 },
      ].map((layer, i) => (
        <mesh key={i} position={[0, height * 0.4 + layer.y, 0]} castShadow>
          <coneGeometry args={[layer.r, height * 0.38, 8]} />
          <meshStandardMaterial color={0x1e5010} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// ── Streetlamp (from Prototype 3) ───────────────────────────────────────────
function Streetlamp({
  position,
  isDayMode,
}: {
  position: [number, number, number];
  isDayMode: boolean;
}) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[0.1, 5, 0.1]} />
        <meshStandardMaterial color={0x777777} roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.75, 5.1, 0]}>
        <boxGeometry args={[1.6, 0.08, 0.1]} />
        <meshStandardMaterial color={0x777777} roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Point light */}
      <pointLight
        color={0xffee88}
        intensity={isDayMode ? 0 : 2.5}
        distance={20}
        decay={2}
        position={[1.5, 5, 0]}
      />
      {/* Bulb (night only) */}
      {!isDayMode && (
        <mesh position={[1.5, 5, 0]}>
          <sphereGeometry args={[0.13, 8, 6]} />
          <meshStandardMaterial
            color={0xffee88}
            emissive={0xffee88}
            emissiveIntensity={3}
          />
        </mesh>
      )}
    </group>
  );
}

// ── Grass patch ─────────────────────────────────────────────────────────────
function GrassPatch({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number];
}) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={0x3a7a30} roughness={0.95} />
    </mesh>
  );
}

// ── Sidewalk ────────────────────────────────────────────────────────────────
function Sidewalk({
  width,
  depth,
  padding,
}: {
  width: number;
  depth: number;
  padding: number;
}) {
  const totalW = width + padding * 2;
  const totalD = depth + padding * 2;
  return (
    <mesh
      position={[0, -0.12, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[totalW, totalD]} />
      <meshStandardMaterial color={0xa0a098} roughness={0.9} />
    </mesh>
  );
}

// ── Main scene environment ──────────────────────────────────────────────────
export function SceneEnvironment({
  isDayMode,
  buildingDefinition,
}: SceneEnvironmentProps) {
  const width = buildingDefinition?.building.footprint.width_m || 20;
  const depth = buildingDefinition?.building.footprint.depth_m || 20;
  const halfW = width / 2;
  const halfD = depth / 2;

  // Tree positions (around building perimeter)
  const treePositions: [number, number, number][] = [
    [-halfW - 6, 0, halfD + 5],
    [-halfW - 4, 0, -halfD - 6],
    [halfW + 5, 0, -halfD - 4],
    [halfW + 7, 0, halfD + 6],
    [-halfW - 8, 0, 2],
    [halfW + 6, 0, -2],
  ];

  // Lamp positions
  const lampPositions: [number, number, number][] = [
    [-halfW - 4, 0, halfD + 8],
    [halfW + 4, 0, halfD + 8],
    [-halfW - 4, 0, -halfD - 8],
    [halfW + 4, 0, -halfD - 8],
  ];

  // Grass patch positions (visible in Image 2)
  const grassPatches: { pos: [number, number, number]; size: [number, number] }[] = [
    { pos: [-halfW - 5, -0.1, halfD + 5], size: [5, 5] },
    { pos: [halfW + 5, -0.1, halfD + 5], size: [5, 5] },
    { pos: [-halfW - 5, -0.1, -halfD - 5], size: [5, 5] },
    { pos: [halfW + 5, -0.1, -halfD - 5], size: [5, 5] },
  ];

  return (
    <>
      {/* Ground plane */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.15, 0]}
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color={isDayMode ? 0xc8c8c4 : 0x2a2d35}
          roughness={0.95}
        />
      </mesh>

      {/* Grid */}
      <gridHelper
        args={[
          200,
          80,
          isDayMode ? 0xbbbbbb : 0x334455,
          isDayMode ? 0xdddddd : 0x1a2030,
        ]}
        position={[0, -0.14, 0]}
      />

      {/* Sidewalk around the building */}
      <Sidewalk width={width} depth={depth} padding={5} />

      {/* Contact Shadows */}
      <ContactShadows
        position={[0, -0.13, 0]}
        opacity={isDayMode ? 0.35 : 0.55}
        scale={80}
        blur={2}
      />

      {/* Grass patches */}
      {grassPatches.map((g, i) => (
        <GrassPatch key={`grass-${i}`} position={g.pos} size={g.size} />
      ))}

      {/* Trees */}
      {treePositions.map((pos, i) => (
        <Tree
          key={`tree-${i}`}
          position={pos}
          height={5 + (i % 3) * 1.5}
          radius={1.5 + (i % 2) * 0.6}
        />
      ))}

      {/* Streetlamps */}
      {lampPositions.map((pos, i) => (
        <Streetlamp key={`lamp-${i}`} position={pos} isDayMode={isDayMode} />
      ))}
    </>
  );
}
