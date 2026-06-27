import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshStandardMaterial } from 'three';
import type { BuildingDefinition, FacadeDefinition } from '../../types/building';
import {
  CLADDING_COLORS,
  darken,
  getCumulativeHeight,
  classifyExteriorWalls,
  getWindowPlacements,
} from './buildingUtils';
import type { WindowPlacement, FaceWallData, WallFace } from './buildingUtils';

// ── Material constants ──────────────────────────────────────────────────────
interface BuildingMaterials {
  wallColor: number;
  wallDarkColor: number;
  glassColor: number;
  glassEmissive: number;
  frameColor: number;
  slabColor: number;
  railingColor: number;
  balcFloorColor: number;
  metalColor: number;
}

function normalizeMaterialKey(material: string): string {
  if (material === 'concrete_with_glass') return 'concrete';
  return material;
}

function resolveFaceColor(
  face: WallFace,
  faceMaterials: FacadeDefinition['face_materials'] | undefined,
  defaultMaterial: string,
): number {
  const mat = faceMaterials?.[face] ?? defaultMaterial;
  const key = normalizeMaterialKey(mat);
  return CLADDING_COLORS[key] ?? CLADDING_COLORS.default;
}

function resolveBalconyFaces(facade: FacadeDefinition): Set<WallFace> {
  if (facade.balcony_faces && facade.balcony_faces.length > 0) {
    const valid: WallFace[] = ['front', 'back', 'left', 'right'];
    return new Set(
      facade.balcony_faces.filter((face): face is WallFace =>
        valid.includes(face as WallFace),
      ),
    );
  }
  return facade.balconies ? new Set(['front']) : new Set();
}

function useMaterialColors(claddingMaterial: string): BuildingMaterials {
  const baseColor =
    CLADDING_COLORS[normalizeMaterialKey(claddingMaterial)] || CLADDING_COLORS.default;
  return useMemo(
    () => ({
      wallColor: baseColor,
      wallDarkColor: darken(baseColor),
      glassColor: 0x1a2a40,
      glassEmissive: 0xff9900,
      frameColor: 0xd0d0d0,
      slabColor: 0xccccca,
      railingColor: 0xe8e5e0,
      balcFloorColor: 0xb89060,
      metalColor: 0x555555,
    }),
    [baseColor],
  );
}

// ── Window pane component ───────────────────────────────────────────────────
function WindowPane({
  placement,
  wallThickness,
  axis,
  faceSign,
  faceOffset,
  isDayMode,
  glassColor,
  glassEmissive,
}: {
  placement: WindowPlacement;
  wallThickness: number;
  axis: 'x' | 'z';
  faceSign: 1 | -1;
  faceOffset: number;
  isDayMode: boolean;
  glassColor: number;
  glassEmissive: number;
}) {
  const matRef = useRef<MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!isDayMode && matRef.current) {
      matRef.current.emissiveIntensity =
        0.85 + Math.sin(state.clock.elapsedTime * 1.2 + placement.posAlongWall) * 0.12;
    }
  });

  const yCenter = placement.sillHeight + placement.height / 2;
  const nudge = (wallThickness / 2 + 0.02) * faceSign;

  const pos: [number, number, number] =
    axis === 'z'
      ? [placement.posAlongWall, yCenter, faceOffset + nudge]
      : [faceOffset + nudge, yCenter, placement.posAlongWall];

  const size: [number, number, number] =
    axis === 'z'
      ? [placement.width - 0.08, placement.height - 0.08, 0.04]
      : [0.04, placement.height - 0.08, placement.width - 0.08];

  return (
    <mesh position={pos} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        ref={matRef}
        color={isDayMode ? 0x4477aa : glassColor}
        roughness={0.05}
        metalness={0.15}
        emissive={isDayMode ? 0x000000 : glassEmissive}
        emissiveIntensity={isDayMode ? 0 : 0.85}
      />
    </mesh>
  );
}

// ── Balcony on a single face ────────────────────────────────────────────────
function BalconyGroup({
  face,
  width,
  depth,
  wallThickness,
  balconyDepth,
  railingHeight,
  colors,
}: {
  face: WallFace;
  width: number;
  depth: number;
  wallThickness: number;
  balconyDepth: number;
  railingHeight: number;
  colors: BuildingMaterials;
}) {
  const halfW = width / 2;
  const halfD = depth / 2;
  const wt = wallThickness;

  const span = face === 'front' || face === 'back' ? width * 0.85 : depth * 0.85;
  const slabSize: [number, number, number] =
    face === 'front' || face === 'back'
      ? [span, 0.16, balconyDepth]
      : [balconyDepth, 0.16, span];

  let slabPos: [number, number, number];
  let railPos: [number, number, number];
  let capPos: [number, number, number];
  let postAPos: [number, number, number];
  let postBPos: [number, number, number];
  let postSize: [number, number, number];
  let railSize: [number, number, number];
  let capSize: [number, number, number];

  switch (face) {
    case 'back':
      slabPos = [0, 0.09, -halfD - wt / 2 - balconyDepth / 2];
      railPos = [0, railingHeight / 2, -halfD - wt / 2 - balconyDepth];
      capPos = [0, railingHeight + 0.05, -halfD - wt / 2 - balconyDepth];
      postAPos = [-span / 2, railingHeight / 2, -halfD - wt / 2 - balconyDepth / 2];
      postBPos = [span / 2, railingHeight / 2, -halfD - wt / 2 - balconyDepth / 2];
      postSize = [0.06, railingHeight, balconyDepth + 0.06];
      railSize = [span, railingHeight, 0.06];
      capSize = [span + 0.1, 0.08, 0.1];
      break;
    case 'right':
      slabPos = [halfW + wt / 2 + balconyDepth / 2, 0.09, 0];
      railPos = [halfW + wt / 2 + balconyDepth, railingHeight / 2, 0];
      capPos = [halfW + wt / 2 + balconyDepth, railingHeight + 0.05, 0];
      postAPos = [halfW + wt / 2 + balconyDepth / 2, railingHeight / 2, -span / 2];
      postBPos = [halfW + wt / 2 + balconyDepth / 2, railingHeight / 2, span / 2];
      postSize = [balconyDepth + 0.06, railingHeight, 0.06];
      railSize = [0.06, railingHeight, span];
      capSize = [0.1, 0.08, span + 0.1];
      break;
    case 'left':
      slabPos = [-halfW - wt / 2 - balconyDepth / 2, 0.09, 0];
      railPos = [-halfW - wt / 2 - balconyDepth, railingHeight / 2, 0];
      capPos = [-halfW - wt / 2 - balconyDepth, railingHeight + 0.05, 0];
      postAPos = [-halfW - wt / 2 - balconyDepth / 2, railingHeight / 2, -span / 2];
      postBPos = [-halfW - wt / 2 - balconyDepth / 2, railingHeight / 2, span / 2];
      postSize = [balconyDepth + 0.06, railingHeight, 0.06];
      railSize = [0.06, railingHeight, span];
      capSize = [0.1, 0.08, span + 0.1];
      break;
    default:
      slabPos = [0, 0.09, halfD + wt / 2 + balconyDepth / 2];
      railPos = [0, railingHeight / 2, halfD + wt / 2 + balconyDepth];
      capPos = [0, railingHeight + 0.05, halfD + wt / 2 + balconyDepth];
      postAPos = [-span / 2, railingHeight / 2, halfD + wt / 2 + balconyDepth / 2];
      postBPos = [span / 2, railingHeight / 2, halfD + wt / 2 + balconyDepth / 2];
      postSize = [0.06, railingHeight, balconyDepth + 0.06];
      railSize = [span, railingHeight, 0.06];
      capSize = [span + 0.1, 0.08, 0.1];
      break;
  }

  return (
    <group>
      <mesh position={slabPos} castShadow receiveShadow>
        <boxGeometry args={slabSize} />
        <meshStandardMaterial color={colors.balcFloorColor} roughness={0.85} />
      </mesh>
      <mesh position={railPos} castShadow>
        <boxGeometry args={railSize} />
        <meshStandardMaterial
          color={colors.railingColor}
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={0.5}
        />
      </mesh>
      <mesh position={capPos} castShadow>
        <boxGeometry args={capSize} />
        <meshStandardMaterial color={colors.frameColor} roughness={0.5} />
      </mesh>
      <mesh position={postAPos} castShadow>
        <boxGeometry args={postSize} />
        <meshStandardMaterial
          color={colors.railingColor}
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={0.5}
        />
      </mesh>
      <mesh position={postBPos} castShadow>
        <boxGeometry args={postSize} />
        <meshStandardMaterial
          color={colors.railingColor}
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}

// ── Single floor group ──────────────────────────────────────────────────────
function FloorGroup({
  width,
  depth,
  height,
  wallThickness,
  faceWalls,
  colors,
  faceColors,
  isDayMode,
  balconyFaces,
  balconyDepth,
  railingHeight,
  isGroundFloor,
}: {
  width: number;
  depth: number;
  height: number;
  wallThickness: number;
  faceWalls: FaceWallData[];
  colors: BuildingMaterials;
  faceColors: Record<WallFace, number>;
  isDayMode: boolean;
  balconyFaces: Set<WallFace>;
  balconyDepth: number;
  railingHeight: number;
  isGroundFloor: boolean;
}) {
  const halfW = width / 2;
  const halfD = depth / 2;
  const wt = wallThickness;

  const faceMap = new Map(faceWalls.map((f) => [f.face, f]));
  const frontWindows = getWindowPlacements(faceMap.get('front')?.openings, width);
  const backWindows = getWindowPlacements(faceMap.get('back')?.openings, width);
  const rightWindows = getWindowPlacements(faceMap.get('right')?.openings, depth);
  const leftWindows = getWindowPlacements(faceMap.get('left')?.openings, depth);

  const showBalconies = !isGroundFloor && balconyFaces.size > 0;

  return (
    <group>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.3, 0.28, depth + 0.3]} />
        <meshStandardMaterial color={colors.slabColor} roughness={0.8} />
      </mesh>

      <mesh position={[0, height / 2, halfD]} castShadow receiveShadow>
        <boxGeometry args={[width, height, wt]} />
        <meshStandardMaterial color={faceColors.front} roughness={0.85} />
      </mesh>

      <mesh position={[0, height / 2, -halfD]} castShadow receiveShadow>
        <boxGeometry args={[width, height, wt]} />
        <meshStandardMaterial color={faceColors.back} roughness={0.85} />
      </mesh>

      <mesh position={[halfW, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wt, height, depth]} />
        <meshStandardMaterial color={faceColors.right} roughness={0.85} />
      </mesh>

      <mesh position={[-halfW, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wt, height, depth]} />
        <meshStandardMaterial color={faceColors.left} roughness={0.85} />
      </mesh>

      <mesh position={[0, 0.14, halfD + wt / 2 + 0.01]} castShadow>
        <boxGeometry args={[width + 0.4, 0.12, 0.06]} />
        <meshStandardMaterial color={darken(faceColors.front)} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.14, -halfD - wt / 2 - 0.01]} castShadow>
        <boxGeometry args={[width + 0.4, 0.12, 0.06]} />
        <meshStandardMaterial color={darken(faceColors.back)} roughness={0.7} />
      </mesh>

      {frontWindows.map((p, i) => (
        <WindowPane
          key={`fw-${i}`}
          placement={p}
          wallThickness={wt}
          axis="z"
          faceSign={1}
          faceOffset={halfD}
          isDayMode={isDayMode}
          glassColor={colors.glassColor}
          glassEmissive={colors.glassEmissive}
        />
      ))}
      {backWindows.map((p, i) => (
        <WindowPane
          key={`bw-${i}`}
          placement={{ ...p, posAlongWall: -p.posAlongWall }}
          wallThickness={wt}
          axis="z"
          faceSign={-1}
          faceOffset={-halfD}
          isDayMode={isDayMode}
          glassColor={colors.glassColor}
          glassEmissive={colors.glassEmissive}
        />
      ))}
      {rightWindows.map((p, i) => (
        <WindowPane
          key={`rw-${i}`}
          placement={p}
          wallThickness={wt}
          axis="x"
          faceSign={1}
          faceOffset={halfW}
          isDayMode={isDayMode}
          glassColor={colors.glassColor}
          glassEmissive={colors.glassEmissive}
        />
      ))}
      {leftWindows.map((p, i) => (
        <WindowPane
          key={`lw-${i}`}
          placement={{ ...p, posAlongWall: -p.posAlongWall }}
          wallThickness={wt}
          axis="x"
          faceSign={-1}
          faceOffset={-halfW}
          isDayMode={isDayMode}
          glassColor={colors.glassColor}
          glassEmissive={colors.glassEmissive}
        />
      ))}

      {showBalconies &&
        Array.from(balconyFaces).map((face) => (
          <BalconyGroup
            key={`balcony-${face}`}
            face={face}
            width={width}
            depth={depth}
            wallThickness={wt}
            balconyDepth={balconyDepth}
            railingHeight={railingHeight}
            colors={colors}
          />
        ))}
    </group>
  );
}

// ── Roof components ─────────────────────────────────────────────────────────
function FlatRoof({
  width,
  depth,
  colors,
}: {
  width: number;
  depth: number;
  colors: BuildingMaterials;
}) {
  return (
    <>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.5, 0.3, depth + 0.5]} />
        <meshStandardMaterial color={colors.slabColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, depth / 2]} castShadow>
        <boxGeometry args={[width + 0.5, 0.8, 0.15]} />
        <meshStandardMaterial color={colors.wallDarkColor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.55, -depth / 2]} castShadow>
        <boxGeometry args={[width + 0.5, 0.8, 0.15]} />
        <meshStandardMaterial color={colors.wallDarkColor} roughness={0.85} />
      </mesh>
      <mesh position={[width / 2, 0.55, 0]} castShadow>
        <boxGeometry args={[0.15, 0.8, depth]} />
        <meshStandardMaterial color={colors.wallDarkColor} roughness={0.85} />
      </mesh>
      <mesh position={[-width / 2, 0.55, 0]} castShadow>
        <boxGeometry args={[0.15, 0.8, depth]} />
        <meshStandardMaterial color={colors.wallDarkColor} roughness={0.85} />
      </mesh>
      <mesh position={[width * 0.15, 1.8, 0]} castShadow>
        <boxGeometry args={[width * 0.25, 2.5, depth * 0.3]} />
        <meshStandardMaterial color={colors.wallDarkColor} roughness={0.9} />
      </mesh>
    </>
  );
}

function PitchedRoof({
  width,
  depth,
  colors,
}: {
  width: number;
  depth: number;
  colors: BuildingMaterials;
}) {
  const pitch = 0.35;
  const ridgeHeight = (depth / 2) * Math.tan(pitch);
  const slopeLength = Math.sqrt((depth / 2) ** 2 + ridgeHeight ** 2);

  return (
    <>
      <mesh position={[0, ridgeHeight / 2, depth / 4]} rotation={[-pitch, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.6, 0.12, slopeLength]} />
        <meshStandardMaterial color={colors.wallDarkColor} roughness={0.85} />
      </mesh>
      <mesh position={[0, ridgeHeight / 2, -depth / 4]} rotation={[pitch, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.6, 0.12, slopeLength]} />
        <meshStandardMaterial color={colors.wallDarkColor} roughness={0.85} />
      </mesh>
      <mesh position={[0, ridgeHeight + 0.08, 0]} castShadow>
        <boxGeometry args={[width + 0.4, 0.12, 0.2]} />
        <meshStandardMaterial color={darken(colors.wallDarkColor, 0.8)} roughness={0.8} />
      </mesh>
    </>
  );
}

// ── Stair core column ───────────────────────────────────────────────────────
function StairCore({
  width,
  depth,
  totalHeight,
  footprintW,
  footprintD,
  colors,
}: {
  width: number;
  depth: number;
  totalHeight: number;
  footprintW: number;
  footprintD: number;
  colors: BuildingMaterials;
}) {
  const coreX = footprintW * 0.2;
  const coreZ = -footprintD * 0.05;

  return (
    <group position={[coreX, 0, coreZ]}>
      <mesh position={[0, totalHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, totalHeight, depth]} />
        <meshStandardMaterial color={colors.wallDarkColor} roughness={0.9} />
      </mesh>
      <mesh position={[width / 2 + 0.02, totalHeight / 2, 0]}>
        <boxGeometry args={[0.03, totalHeight - 1, depth * 0.5]} />
        <meshStandardMaterial
          color={0x2a3a50}
          roughness={0.05}
          metalness={0.2}
          emissive={0x1a2030}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────
export function BuildingModel({
  buildingDefinition,
  isDayMode,
}: {
  buildingDefinition: BuildingDefinition;
  isDayMode: boolean;
}) {
  const { building, levels, facade } = buildingDefinition;
  const cladding = building.cladding_material || facade.material || 'concrete';
  const colors = useMaterialColors(cladding);

  const footprintW = building.footprint.width_m;
  const footprintD = building.footprint.depth_m;
  const wallThickness = 0.28;
  const totalHeight = building.totalHeight_m;
  const balconyFaces = resolveBalconyFaces(facade);
  const defaultMaterial = facade.material || cladding;

  const faceColors = useMemo(
    (): Record<WallFace, number> => ({
      front: resolveFaceColor('front', facade.face_materials, defaultMaterial),
      back: resolveFaceColor('back', facade.face_materials, defaultMaterial),
      left: resolveFaceColor('left', facade.face_materials, defaultMaterial),
      right: resolveFaceColor('right', facade.face_materials, defaultMaterial),
    }),
    [facade.face_materials, defaultMaterial],
  );

  const topLevel = levels[levels.length - 1];
  const roofW = topLevel?.floorplate?.width_m ?? footprintW;
  const roofD = topLevel?.floorplate?.depth_m ?? footprintD;

  return (
    <group>
      {levels.map((level, index) => {
        const yBase = getCumulativeHeight(levels, index);
        const levelW = level.floorplate?.width_m ?? footprintW;
        const levelD = level.floorplate?.depth_m ?? footprintD;
        const faceWalls = classifyExteriorWalls(level.walls, levelW, levelD);

        return (
          <group key={`level-${index}`} position={[0, yBase, 0]}>
            <FloorGroup
              width={levelW}
              depth={levelD}
              height={level.height_m}
              wallThickness={wallThickness}
              faceWalls={faceWalls}
              colors={colors}
              faceColors={faceColors}
              isDayMode={isDayMode}
              balconyFaces={balconyFaces}
              balconyDepth={facade.balcony_depth_m || 1.5}
              railingHeight={facade.railing_height_m || 1.1}
              isGroundFloor={index === 0}
            />
          </group>
        );
      })}

      <group position={[0, totalHeight, 0]}>
        {building.roof_type === 'pitched' ? (
          <PitchedRoof width={roofW} depth={roofD} colors={colors} />
        ) : (
          <FlatRoof width={roofW} depth={roofD} colors={colors} />
        )}
      </group>

      <StairCore
        width={footprintW * 0.15}
        depth={footprintD * 0.35}
        totalHeight={totalHeight}
        footprintW={footprintW}
        footprintD={footprintD}
        colors={colors}
      />

      <mesh
        position={[0, levels[0]?.height_m ?? 3.2, footprintD / 2 + 1.5]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[footprintW * 0.35, 0.12, 3]} />
        <meshStandardMaterial color={colors.slabColor} roughness={0.7} />
      </mesh>
      <mesh
        position={[
          -footprintW * 0.15,
          (levels[0]?.height_m ?? 3.2) / 2,
          footprintD / 2 + 2.8,
        ]}
        castShadow
      >
        <boxGeometry args={[0.12, levels[0]?.height_m ?? 3.2, 0.12]} />
        <meshStandardMaterial color={colors.metalColor} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh
        position={[
          footprintW * 0.15,
          (levels[0]?.height_m ?? 3.2) / 2,
          footprintD / 2 + 2.8,
        ]}
        castShadow
      >
        <boxGeometry args={[0.12, levels[0]?.height_m ?? 3.2, 0.12]} />
        <meshStandardMaterial color={colors.metalColor} roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}
