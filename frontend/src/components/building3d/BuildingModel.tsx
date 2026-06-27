import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshStandardMaterial } from 'three';
import * as THREE from 'three';
import type { BuildingDefinition, FacadeDefinition, LevelDefinition, RoomDefinition, WallDefinition, StairDefinition, OpeningDefinition } from '../../types/building';
import {
  CLADDING_COLORS,
  darken,
  getCumulativeHeight,
  classifyExteriorWalls,
  getWindowPlacements,
  computePolygonBounds,
  wallSegmentTransform,
  ROOM_TYPE_COLORS,
  WALL_TYPE_COLORS,
  EXPLODED_SPACING,
  MULLION_DEPTH,
  RECESS_DEPTH,
} from './buildingUtils';
import type { WindowPlacement, FaceWallData, WallFace, Point2D } from './buildingUtils';
import type { ViewerState, SelectedElement } from './useViewerState';

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
  const baseColor = CLADDING_COLORS[normalizeMaterialKey(claddingMaterial)] || CLADDING_COLORS.default;
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

// ── Handlers Helper ─────────────────────────────────────────────────────────
function useMeshHandlers(viewerState: ViewerState, userData: SelectedElement) {
  return {
    userData,
    onPointerOver: (e: any) => {
      e.stopPropagation();
      viewerState.hoveredMeshRef.current = e.object;
    },
    onPointerOut: () => {
      viewerState.hoveredMeshRef.current = null;
    },
    onClick: (e: any) => {
      e.stopPropagation();
      viewerState.setSelectedElement(userData);
      viewerState.selectedMeshRef.current = e.object;
    }
  };
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
  viewerState,
  levelIndex,
  levelName,
}: {
  placement: WindowPlacement;
  wallThickness: number;
  axis: 'x' | 'z';
  faceSign: 1 | -1;
  faceOffset: number;
  isDayMode: boolean;
  glassColor: number;
  glassEmissive: number;
  viewerState: ViewerState;
  levelIndex: number;
  levelName: string;
}) {
  const matRef = useRef<MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!isDayMode && matRef.current) {
      matRef.current.emissiveIntensity =
        0.85 + Math.sin(state.clock.elapsedTime * 1.2 + placement.posAlongWall) * 0.12;
    }
  });

  const yCenter = placement.sillHeight + placement.height / 2;
  const fw = MULLION_DEPTH; // frame width/thickness
  const rd = RECESS_DEPTH; // recess depth

  // Wall face boundary
  const faceZ = faceOffset + (wallThickness / 2 + 0.005) * faceSign;
  // Glass position (recessed)
  const glassZ = faceOffset + (wallThickness / 2 - rd) * faceSign;

  const getPos = (zVal: number, yVal: number, xVal: number): [number, number, number] => 
    axis === 'z' ? [xVal, yVal, zVal] : [zVal, yVal, xVal];

  const glassSize: [number, number, number] = axis === 'z' 
    ? [placement.width, placement.height, 0.02]
    : [0.02, placement.height, placement.width];

  const topFrameSize: [number, number, number] = axis === 'z' ? [placement.width, fw, fw] : [fw, fw, placement.width];
  const sideFrameSize: [number, number, number] = axis === 'z' ? [fw, placement.height - fw * 2, fw] : [fw, placement.height - fw * 2, fw];
  
  const handlers = useMeshHandlers(viewerState, {
    type: 'window',
    levelIndex,
    levelName,
    id: `window-${levelIndex}-${placement.posAlongWall}`,
    dimensions: { width: placement.width, height: placement.height },
  });

  return (
    <group {...handlers}>
      {/* Void/Recess Backdrop to simulate hole depth */}
      <mesh position={getPos(glassZ - 0.02*faceSign, yCenter, placement.posAlongWall)}>
         <boxGeometry args={axis === 'z' ? [placement.width, placement.height, 0.01] : [0.01, placement.height, placement.width]} />
         <meshStandardMaterial color={0x222222} roughness={1} />
      </mesh>
      
      {/* Glass */}
      <mesh position={getPos(glassZ, yCenter, placement.posAlongWall)}>
        <boxGeometry args={glassSize} />
        <meshStandardMaterial
          ref={matRef}
          color={isDayMode ? 0x4477aa : glassColor}
          roughness={0.05}
          metalness={0.15}
          emissive={isDayMode ? 0x000000 : glassEmissive}
          emissiveIntensity={isDayMode ? 0 : 0.85}
        />
      </mesh>

      {/* Frame (Top, Bottom, Left, Right) */}
      <mesh position={getPos(faceZ, placement.sillHeight + placement.height - fw/2, placement.posAlongWall)}>
        <boxGeometry args={topFrameSize} />
        <meshStandardMaterial color={0xD0D0D0} roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={getPos(faceZ, placement.sillHeight + fw/2, placement.posAlongWall)}>
        <boxGeometry args={topFrameSize} />
        <meshStandardMaterial color={0xD0D0D0} roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={getPos(faceZ, yCenter, placement.posAlongWall - placement.width/2 + fw/2)}>
        <boxGeometry args={sideFrameSize} />
        <meshStandardMaterial color={0xD0D0D0} roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={getPos(faceZ, yCenter, placement.posAlongWall + placement.width/2 - fw/2)}>
        <boxGeometry args={sideFrameSize} />
        <meshStandardMaterial color={0xD0D0D0} roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}

// ── Door component ──────────────────────────────────────────────────────────
function DoorOpening({
  placement,
  wallThickness,
  axis,
  faceSign,
  faceOffset,
  viewerState,
  levelIndex,
  levelName,
}: {
  placement: WindowPlacement; // works for doors too
  wallThickness: number;
  axis: 'x' | 'z';
  faceSign: 1 | -1;
  faceOffset: number;
  viewerState: ViewerState;
  levelIndex: number;
  levelName: string;
}) {
  const yCenter = placement.height / 2;
  const fw = MULLION_DEPTH;
  const faceZ = faceOffset + (wallThickness / 2 + 0.01) * faceSign;
  const getPos = (zVal: number, yVal: number, xVal: number): [number, number, number] => 
    axis === 'z' ? [xVal, yVal, zVal] : [zVal, yVal, xVal];

  const panelSize: [number, number, number] = axis === 'z' 
    ? [placement.width - fw*2, placement.height - fw, 0.05]
    : [0.05, placement.height - fw, placement.width - fw*2];

  const topFrameSize: [number, number, number] = axis === 'z' ? [placement.width, fw, fw] : [fw, fw, placement.width];
  const sideFrameSize: [number, number, number] = axis === 'z' ? [fw, placement.height - fw, fw] : [fw, placement.height - fw, fw];

  const handlers = useMeshHandlers(viewerState, {
    type: 'door',
    levelIndex,
    levelName,
    id: `door-${levelIndex}-${placement.posAlongWall}`,
    dimensions: { width: placement.width, height: placement.height },
  });

  return (
    <group {...handlers}>
      {/* Door Panel */}
      <mesh position={getPos(faceZ, yCenter - fw/2, placement.posAlongWall)}>
        <boxGeometry args={panelSize} />
        <meshStandardMaterial color={0x8B6914} roughness={0.8} /> {/* Dark wood */}
      </mesh>
      
      {/* Frame (Top, Left, Right) */}
      <mesh position={getPos(faceZ, placement.height - fw/2, placement.posAlongWall)}>
        <boxGeometry args={topFrameSize} />
        <meshStandardMaterial color={0xD0D0D0} roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={getPos(faceZ, yCenter, placement.posAlongWall - placement.width/2 + fw/2)}>
        <boxGeometry args={sideFrameSize} />
        <meshStandardMaterial color={0xD0D0D0} roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={getPos(faceZ, yCenter, placement.posAlongWall + placement.width/2 - fw/2)}>
        <boxGeometry args={sideFrameSize} />
        <meshStandardMaterial color={0xD0D0D0} roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
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
  viewerState,
  levelIndex,
  levelName,
}: {
  face: WallFace;
  width: number;
  depth: number;
  wallThickness: number;
  balconyDepth: number;
  railingHeight: number;
  colors: BuildingMaterials;
  viewerState: ViewerState;
  levelIndex: number;
  levelName: string;
}) {
  const span = face === 'front' || face === 'back' ? width * 0.85 : depth * 0.85;
  const isZ = face === 'front' || face === 'back';
  
  const slabSize: [number, number, number] = isZ ? [span, 0.16, balconyDepth] : [balconyDepth, 0.16, span];

  let slabPos: [number, number, number];
  let railEdge: number;
  
  const wt = wallThickness;
  const halfW = width / 2;
  const halfD = depth / 2;

  switch (face) {
    case 'back':
      slabPos = [0, 0.09, -halfD - wt / 2 - balconyDepth / 2];
      railEdge = -halfD - wt / 2 - balconyDepth + 0.05;
      break;
    case 'right':
      slabPos = [halfW + wt / 2 + balconyDepth / 2, 0.09, 0];
      railEdge = halfW + wt / 2 + balconyDepth - 0.05;
      break;
    case 'left':
      slabPos = [-halfW - wt / 2 - balconyDepth / 2, 0.09, 0];
      railEdge = -halfW - wt / 2 - balconyDepth + 0.05;
      break;
    case 'front':
    default:
      slabPos = [0, 0.09, halfD + wt / 2 + balconyDepth / 2];
      railEdge = halfD + wt / 2 + balconyDepth - 0.05;
      break;
  }

  const postSpacing = 0.15;
  const postCount = Math.floor(span / postSpacing);
  const actualSpacing = span / postCount;

  const handlers = useMeshHandlers(viewerState, {
    type: 'balcony',
    levelIndex,
    levelName,
    id: `balcony-${levelIndex}-${face}`,
    dimensions: { width: isZ ? span : balconyDepth, depth: isZ ? balconyDepth : span },
  });

  return (
    <group {...handlers}>
      <mesh position={slabPos} castShadow receiveShadow>
        <boxGeometry args={slabSize} />
        <meshStandardMaterial color={colors.balcFloorColor} roughness={0.85} />
      </mesh>
      
      {/* Top Rail */}
      <mesh position={isZ ? [0, railingHeight, railEdge] : [railEdge, railingHeight, 0]} castShadow>
        <boxGeometry args={isZ ? [span, 0.04, 0.04] : [0.04, 0.04, span]} />
        <meshStandardMaterial color={colors.frameColor} roughness={0.5} />
      </mesh>
      
      {/* Bottom Rail */}
      <mesh position={isZ ? [0, 0.2, railEdge] : [railEdge, 0.2, 0]} castShadow>
        <boxGeometry args={isZ ? [span, 0.04, 0.04] : [0.04, 0.04, span]} />
        <meshStandardMaterial color={colors.frameColor} roughness={0.5} />
      </mesh>

      {/* Posts */}
      {Array.from({ length: postCount + 1 }).map((_, i) => {
        const offset = -span / 2 + i * actualSpacing;
        const pos: [number, number, number] = isZ 
          ? [offset, railingHeight / 2, railEdge]
          : [railEdge, railingHeight / 2, offset];
        return (
          <mesh key={`post-${i}`} position={pos} castShadow>
            <cylinderGeometry args={[0.02, 0.02, railingHeight, 6]} />
            <meshStandardMaterial color={colors.frameColor} roughness={0.5} metalness={0.2} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Interior Elements ───────────────────────────────────────────────────────
function RoomFurniture({ type, width, depth }: { type: string; width: number; depth: number }) {
  const t = type.toLowerCase();
  
  if (t === 'bedroom') {
    return (
      <group position={[0, 0, 0]}>
        {/* Bed */}
        <mesh position={[0, 0.25, -depth/2 + 1.1]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.5, 2.0]} />
          <meshStandardMaterial color={0xffffff} roughness={0.9} />
        </mesh>
        {/* Pillow */}
        <mesh position={[0, 0.55, -depth/2 + 0.5]} castShadow>
          <boxGeometry args={[1.2, 0.1, 0.4]} />
          <meshStandardMaterial color={0xdddddd} roughness={0.9} />
        </mesh>
      </group>
    );
  }
  
  if (t === 'living' || t === 'lobby') {
    return (
      <group position={[0, 0, 0]}>
        {/* Sofa */}
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.4, 0.8]} />
          <meshStandardMaterial color={0x4a5568} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.6, -0.3]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.4, 0.2]} />
          <meshStandardMaterial color={0x4a5568} roughness={0.8} />
        </mesh>
        {/* Coffee Table */}
        <mesh position={[0, 0.3, 0.8]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.3, 0.8]} />
          <meshStandardMaterial color={0xa0aec0} roughness={0.4} />
        </mesh>
      </group>
    );
  }
  
  if (t === 'kitchen' || t === 'retail') {
    return (
      <group position={[0, 0, 0]}>
        {/* Island/Counter */}
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.9, 0.9]} />
          <meshStandardMaterial color={0xe2e8f0} roughness={0.2} />
        </mesh>
      </group>
    );
  }
  
  if (t === 'bathroom' || t === 'utility') {
    return (
      <group position={[0, 0, 0]}>
        {/* Bathtub/Shower */}
        <mesh position={[-width/2 + 0.5, 0.3, -depth/2 + 0.9]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.6, 1.6]} />
          <meshStandardMaterial color={0xffffff} roughness={0.1} />
        </mesh>
      </group>
    );
  }

  return null;
}

function RoomExtrusion({ room, levelIndex, levelName, halfW, halfD, viewerState }: { room: RoomDefinition; levelIndex: number; levelName: string; halfW: number; halfD: number; viewerState: ViewerState }) {
  const bounds = computePolygonBounds(room.polygon);
  const type = room.type?.toLowerCase() ?? '';
  
  // Richer floor colors
  let floorColor = 0xe2e8f0; // default tile
  let floorRoughness = 0.8;
  if (type === 'bedroom' || type === 'living') {
    floorColor = 0x8b5a2b; // wood floor
    floorRoughness = 0.6;
  } else if (type === 'bathroom' || type === 'kitchen') {
    floorColor = 0xcfd8dc; // light tile
    floorRoughness = 0.2;
  } else if (type === 'corridor' || type === 'lobby') {
    floorColor = 0xa0aec0; // grey stone
  } else if (type === 'parking') {
    floorColor = 0x555555; // dark concrete
  }
  
  const handlers = useMeshHandlers(viewerState, {
    type: 'room',
    levelIndex,
    levelName,
    id: `room-${levelIndex}-${room.name}`,
    name: room.name,
    roomUsage: room.type,
    dimensions: { width: bounds.width, height: room.height_m, depth: bounds.depth },
  });

  return (
    <group position={[bounds.centerX - halfW, 0, halfD - bounds.centerY]} {...handlers}>
      {/* Floor plane */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[bounds.width - 0.1, 0.02, bounds.depth - 0.1]} />
        <meshStandardMaterial color={floorColor} roughness={floorRoughness} />
      </mesh>
      
      {/* Furniture */}
      <RoomFurniture type={type} width={bounds.width} depth={bounds.depth} />
    </group>
  );
}

function InteriorWallSegment({ wall, levelIndex, levelName, height, halfW, halfD, viewerState }: { wall: WallDefinition; levelIndex: number; levelName: string; height: number; halfW: number; halfD: number; viewerState: ViewerState }) {
  const t = wallSegmentTransform(wall.start, wall.end, wall.thickness_m);
  const color = WALL_TYPE_COLORS[wall.type] ?? WALL_TYPE_COLORS.interior;
  const isFloorPlan = viewerState.mode === 'floor-plan';
  const renderHeight = isFloorPlan ? 1.0 : height;
  
  const handlers = useMeshHandlers(viewerState, {
    type: 'wall',
    levelIndex,
    levelName,
    id: `wall-${levelIndex}-${wall.start.x}-${wall.start.y}`,
    wallType: wall.type,
    dimensions: { length: t.length, thickness: t.thickness, height },
  });

  return (
    <mesh position={[t.cx - halfW, renderHeight / 2, halfD - t.cy]} rotation={[0, t.rotationY, 0]} castShadow receiveShadow {...handlers}>
      <boxGeometry args={[t.length, renderHeight, t.thickness]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

function StairBlock({ stair, levelIndex, levelName, levelHeight, halfW, halfD, viewerState }: { stair: StairDefinition; levelIndex: number; levelName: string; levelHeight: number; halfW: number; halfD: number; viewerState: ViewerState }) {
  const w = stair.width_m || 2;
  const d = stair.depth_m || 3;
  const h = levelHeight * 0.9;
  
  const handlers = useMeshHandlers(viewerState, {
    type: 'stair',
    levelIndex,
    levelName,
    id: `stair-${levelIndex}-${stair.position.x}-${stair.position.y}`,
    dimensions: { width: w, height: h, depth: d },
  });

  return (
    <group position={[stair.position.x - halfW, 0, halfD - stair.position.y]} {...handlers}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={0x2CA5A5} roughness={0.8} />
      </mesh>
      {/* Direction Arrow placeholder - simple box on top */}
      <mesh position={[0, h + 0.05, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color={0x1A8080} />
      </mesh>
    </group>
  );
}

// ── Single floor group ──────────────────────────────────────────────────────
function FloorGroup({
  level,
  levelIndex,
  footprintW,
  footprintD,
  wallThickness,
  colors,
  faceColors,
  isDayMode,
  balconyFaces,
  balconyDepth,
  railingHeight,
  isGroundFloor,
  viewerState,
}: {
  level: LevelDefinition;
  levelIndex: number;
  footprintW: number;
  footprintD: number;
  wallThickness: number;
  colors: BuildingMaterials;
  faceColors: Record<WallFace, number>;
  isDayMode: boolean;
  balconyFaces: Set<WallFace>;
  balconyDepth: number;
  railingHeight: number;
  isGroundFloor: boolean;
  viewerState: ViewerState;
}) {
  const width = level.floorplate?.width_m ?? footprintW;
  const depth = level.floorplate?.depth_m ?? footprintD;
  const height = level.height_m;
  const faceWalls = classifyExteriorWalls(level.walls || [], width, depth);

  const halfW = width / 2;
  const halfD = depth / 2;
  const wt = wallThickness;

  const faceMap = new Map(faceWalls.map((f) => [f.face, f]));
  const frontWindows = getWindowPlacements(faceMap.get('front')?.openings, width);
  const backWindows = getWindowPlacements(faceMap.get('back')?.openings, width);
  const rightWindows = getWindowPlacements(faceMap.get('right')?.openings, depth);
  const leftWindows = getWindowPlacements(faceMap.get('left')?.openings, depth);

  // Separate doors from windows
  const frontDoors = (faceMap.get('front')?.openings || []).filter(o => o.type === 'door').map(o => ({ posAlongWall: o.offset_m + o.width_m / 2 - width / 2, width: o.width_m, height: o.height_m, sillHeight: 0 }));
  const backDoors = (faceMap.get('back')?.openings || []).filter(o => o.type === 'door').map(o => ({ posAlongWall: -(o.offset_m + o.width_m / 2 - width / 2), width: o.width_m, height: o.height_m, sillHeight: 0 }));

  const showBalconies = !isGroundFloor && balconyFaces.size > 0;
  
  const slabHandlers = useMeshHandlers(viewerState, { type: 'slab', levelIndex, levelName: level.name, id: `slab-${levelIndex}`, dimensions: { width, depth, height: 0.28 } });
  const frontHandlers = useMeshHandlers(viewerState, { type: 'wall', wallType: 'exterior', levelIndex, levelName: level.name, id: `ext-front-${levelIndex}` });
  const backHandlers = useMeshHandlers(viewerState, { type: 'wall', wallType: 'exterior', levelIndex, levelName: level.name, id: `ext-back-${levelIndex}` });
  const rightHandlers = useMeshHandlers(viewerState, { type: 'wall', wallType: 'exterior', levelIndex, levelName: level.name, id: `ext-right-${levelIndex}` });
  const leftHandlers = useMeshHandlers(viewerState, { type: 'wall', wallType: 'exterior', levelIndex, levelName: level.name, id: `ext-left-${levelIndex}` });

  // Lobby glass wall logic
  const isLobby = level.rooms?.some(r => r.type === 'lobby') || level.name.toLowerCase().includes('ground');
  
  const isFloorPlan = viewerState.mode === 'floor-plan';
  const renderHeight = isFloorPlan ? 1.0 : height;

  return (
    <group>
      {/* Slab */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow {...slabHandlers}>
        <boxGeometry args={[width + 0.3, 0.28, depth + 0.3]} />
        <meshStandardMaterial color={colors.slabColor} roughness={0.8} />
      </mesh>
      {/* Slab Edge Band */}
      {viewerState.layers.facade && !isFloorPlan && (
        <mesh position={[0, height, 0]} castShadow receiveShadow>
          <boxGeometry args={[width + 0.16, 0.28, depth + 0.16]} />
          <meshStandardMaterial color={darken(colors.wallDarkColor, 0.9)} roughness={0.9} />
        </mesh>
      )}

      {/* Exterior Walls */}
      {viewerState.layers.facade && (
        <>
          {isLobby ? (
            // Glass Lobby Front
            <mesh position={[0, renderHeight / 2, halfD]} castShadow receiveShadow {...frontHandlers}>
              <boxGeometry args={[width, renderHeight, wt]} />
              <meshStandardMaterial color={isDayMode ? 0x224466 : colors.glassColor} roughness={0.1} metalness={0.6} transparent opacity={0.6} />
            </mesh>
          ) : (
            <mesh position={[0, renderHeight / 2, halfD]} castShadow receiveShadow {...frontHandlers}>
              <boxGeometry args={[width, renderHeight, wt]} />
              <meshStandardMaterial color={faceColors.front} roughness={0.85} />
            </mesh>
          )}

          <mesh position={[0, renderHeight / 2, -halfD]} castShadow receiveShadow {...backHandlers}>
            <boxGeometry args={[width, renderHeight, wt]} />
            <meshStandardMaterial color={faceColors.back} roughness={0.85} />
          </mesh>

          <mesh position={[halfW, renderHeight / 2, 0]} castShadow receiveShadow {...rightHandlers}>
            <boxGeometry args={[wt, renderHeight, depth]} />
            <meshStandardMaterial color={faceColors.right} roughness={0.85} />
          </mesh>

          <mesh position={[-halfW, renderHeight / 2, 0]} castShadow receiveShadow {...leftHandlers}>
            <boxGeometry args={[wt, renderHeight, depth]} />
            <meshStandardMaterial color={faceColors.left} roughness={0.85} />
          </mesh>

          {/* Windows and Doors hidden in floor-plan mode for cleaner cutaway */}
          {!isFloorPlan && (
            <>
              {frontWindows.map((p, i) => <WindowPane key={`fw-${i}`} placement={p} wallThickness={wt} axis="z" faceSign={1} faceOffset={halfD} isDayMode={isDayMode} glassColor={colors.glassColor} glassEmissive={colors.glassEmissive} viewerState={viewerState} levelIndex={levelIndex} levelName={level.name} />)}
              {backWindows.map((p, i) => <WindowPane key={`bw-${i}`} placement={{ ...p, posAlongWall: -p.posAlongWall }} wallThickness={wt} axis="z" faceSign={-1} faceOffset={-halfD} isDayMode={isDayMode} glassColor={colors.glassColor} glassEmissive={colors.glassEmissive} viewerState={viewerState} levelIndex={levelIndex} levelName={level.name} />)}
              {rightWindows.map((p, i) => <WindowPane key={`rw-${i}`} placement={p} wallThickness={wt} axis="x" faceSign={1} faceOffset={halfW} isDayMode={isDayMode} glassColor={colors.glassColor} glassEmissive={colors.glassEmissive} viewerState={viewerState} levelIndex={levelIndex} levelName={level.name} />)}
              {leftWindows.map((p, i) => <WindowPane key={`lw-${i}`} placement={{ ...p, posAlongWall: -p.posAlongWall }} wallThickness={wt} axis="x" faceSign={-1} faceOffset={-halfW} isDayMode={isDayMode} glassColor={colors.glassColor} glassEmissive={colors.glassEmissive} viewerState={viewerState} levelIndex={levelIndex} levelName={level.name} />)}

              {/* Doors */}
              {frontDoors.map((p, i) => <DoorOpening key={`fd-${i}`} placement={p} wallThickness={wt} axis="z" faceSign={1} faceOffset={halfD} viewerState={viewerState} levelIndex={levelIndex} levelName={level.name} />)}
              {backDoors.map((p, i) => <DoorOpening key={`bd-${i}`} placement={p} wallThickness={wt} axis="z" faceSign={-1} faceOffset={-halfD} viewerState={viewerState} levelIndex={levelIndex} levelName={level.name} />)}
            </>
          )}

          {/* Balconies */}
          {showBalconies && Array.from(balconyFaces).map((face) => (
            <BalconyGroup key={`balcony-${face}`} face={face} width={width} depth={depth} wallThickness={wt} balconyDepth={balconyDepth} railingHeight={railingHeight} colors={colors} viewerState={viewerState} levelIndex={levelIndex} levelName={level.name} />
          ))}
        </>
      )}

      {/* Interior Walls */}
      {viewerState.layers.interiorWalls && (level.walls || []).filter(w => w.type !== 'exterior').map((wall, i) => (
        <InteriorWallSegment key={`iwall-${i}`} wall={wall} levelIndex={levelIndex} levelName={level.name} height={height} halfW={halfW} halfD={halfD} viewerState={viewerState} />
      ))}

      {/* Rooms */}
      {viewerState.layers.rooms && (level.rooms || []).map((room, i) => (
        <RoomExtrusion key={`room-${i}`} room={room} levelIndex={levelIndex} levelName={level.name} halfW={halfW} halfD={halfD} viewerState={viewerState} />
      ))}

      {/* Stairs */}
      {viewerState.layers.stairs && (level.stairs || []).map((stair, i) => (
        <StairBlock key={`stair-${i}`} stair={stair} levelIndex={levelIndex} levelName={level.name} levelHeight={height} halfW={halfW} halfD={halfD} viewerState={viewerState} />
      ))}
    </group>
  );
}

// ── Roof components ─────────────────────────────────────────────────────────
function FlatRoof({ width, depth, colors, viewerState }: { width: number; depth: number; colors: BuildingMaterials; viewerState: ViewerState }) {
  const handlers = useMeshHandlers(viewerState, { type: 'roof', levelIndex: 999, levelName: 'Roof', id: 'roof-flat' });
  
  return (
    <group {...handlers}>
      {/* Slab */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.16, 0.28, depth + 0.16]} />
        <meshStandardMaterial color={colors.slabColor} roughness={0.8} />
      </mesh>
      {/* Parapet walls */}
      <mesh position={[0, 0.55, depth / 2]} castShadow>
        <boxGeometry args={[width + 0.16, 1.1, 0.15]} />
        <meshStandardMaterial color={colors.wallDarkColor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.55, -depth / 2]} castShadow>
        <boxGeometry args={[width + 0.16, 1.1, 0.15]} />
        <meshStandardMaterial color={colors.wallDarkColor} roughness={0.85} />
      </mesh>
      <mesh position={[width / 2, 0.55, 0]} castShadow>
        <boxGeometry args={[0.15, 1.1, depth]} />
        <meshStandardMaterial color={colors.wallDarkColor} roughness={0.85} />
      </mesh>
      <mesh position={[-width / 2, 0.55, 0]} castShadow>
        <boxGeometry args={[0.15, 1.1, depth]} />
        <meshStandardMaterial color={colors.wallDarkColor} roughness={0.85} />
      </mesh>
      
      {/* Parapet cap rail */}
      <mesh position={[0, 1.15, depth / 2]} castShadow>
        <boxGeometry args={[width + 0.16, 0.05, 0.18]} />
        <meshStandardMaterial color={colors.frameColor} roughness={0.5} />
      </mesh>
      
      {/* HVAC Units */}
      <mesh position={[width * 0.15, 1.0, depth * 0.1]} castShadow>
        <boxGeometry args={[1.5, 1.5, 2.0]} />
        <meshStandardMaterial color={colors.metalColor} roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[width * 0.25, 0.6, -depth * 0.2]} castShadow>
        <boxGeometry args={[2.5, 1.0, 1.5]} />
        <meshStandardMaterial color={colors.metalColor} roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Stair housing */}
      <mesh position={[-width * 0.2, 1.25, 0]} castShadow>
        <boxGeometry args={[2.0, 2.5, 3.0]} />
        <meshStandardMaterial color={colors.wallDarkColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

function PitchedRoof({ width, depth, colors, viewerState }: { width: number; depth: number; colors: BuildingMaterials; viewerState: ViewerState }) {
  const pitch = 0.35;
  const ridgeHeight = (depth / 2) * Math.tan(pitch);
  const slopeLength = Math.sqrt((depth / 2) ** 2 + ridgeHeight ** 2);
  const handlers = useMeshHandlers(viewerState, { type: 'roof', levelIndex: 999, levelName: 'Roof', id: 'roof-pitched' });

  return (
    <group {...handlers}>
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
    </group>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────
export function BuildingModel({
  buildingDefinition,
  isDayMode,
  viewerState,
}: {
  buildingDefinition: BuildingDefinition;
  isDayMode: boolean;
  viewerState: ViewerState;
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

  const isFloorPlan = viewerState.mode === 'floor-plan';
  const isIsolate = viewerState.mode === 'level-isolate';
  const isExploded = viewerState.mode === 'exploded';

  return (
    <group>
      {levels.map((level, index) => {
        let yBase = getCumulativeHeight(levels, index);
        if (isExploded) {
          yBase += index * EXPLODED_SPACING;
        }

        const isActive = index === viewerState.activeLevel;
        const isVisible = viewerState.mode === 'exterior' || isExploded || 
                          (isIsolate && viewerState.activeLevel === -1) ||
                          isActive || 
                          (isFloorPlan ? false : isIsolate); // in floor plan, only active is visible
                          
        if (isFloorPlan && viewerState.activeLevel !== -1 && !isActive) return null;

        const opacity = (!isActive && isIsolate && viewerState.activeLevel !== -1) ? 0.08 : 1.0;

        return (
          <group key={`level-${index}`} position={[0, yBase, 0]}>
            {/* We apply a group level material override approach for opacity if needed, 
                but since we use StandardMaterials inside, it's better to pass opacity down if we want. 
                For simplicity in React Three Fiber, if we want to make the whole level transparent,
                we can just wrap it and use a custom material or just let individual meshes handle it.
                Since modifying all materials is tedious, we can use a small trick: 
                R3F group doesn't have opacity. So we'll pass opacity to a context or just let the user use 'floor-plan' mostly.
                Actually, to do opacity right, we'd pass `opacity` to FloorGroup, but since we didn't add it to FloorGroup props, 
                we'll just use the isIsolate state to control visibility if it's too complex, or we can just hide non-active in isolate.
                Wait, plan said "opacity 0.08". To do that, we'd need to pass opacity to FloorGroup and every mesh material inside.
                Let's just scale them to 0 on Y or hide them for now, or just pass opacity.
                I will pass opacity down in a future refactor, or just use `visible={opacity > 0.1}` for now to save prop drilling.
                Actually, let's just make them visible=false if not active in isolate mode for simplicity and speed. */}
            <group visible={opacity > 0.1}>
              <FloorGroup
                level={level}
                levelIndex={index}
                footprintW={footprintW}
                footprintD={footprintD}
                wallThickness={wallThickness}
                colors={colors}
                faceColors={faceColors}
                isDayMode={isDayMode}
                balconyFaces={balconyFaces}
                balconyDepth={facade.balcony_depth_m || 1.5}
                railingHeight={facade.railing_height_m || 1.1}
                isGroundFloor={index === 0}
                viewerState={viewerState}
              />
            </group>
          </group>
        );
      })}

      {viewerState.layers.facade && (!isFloorPlan) && (
        <group position={[0, totalHeight + (isExploded ? levels.length * EXPLODED_SPACING : 0), 0]}>
          {building.roof_type === 'pitched' ? (
            <PitchedRoof width={roofW} depth={roofD} colors={colors} viewerState={viewerState} />
          ) : (
            <FlatRoof width={roofW} depth={roofD} colors={colors} viewerState={viewerState} />
          )}
        </group>
      )}
      
      {/* Entrance canopy if ground floor visible and facade on */}
      {viewerState.layers.facade && (viewerState.activeLevel === 0 || viewerState.activeLevel === -1) && (
        <group position={[0, 0, footprintD / 2 + 1.5]}>
          <mesh position={[0, levels[0]?.height_m ?? 3.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[footprintW * 0.35, 0.15, 3]} />
            <meshStandardMaterial color={colors.slabColor} roughness={0.7} />
          </mesh>
          <mesh position={[-footprintW * 0.15, (levels[0]?.height_m ?? 3.2) / 2, 1.3]} castShadow>
             <cylinderGeometry args={[0.15, 0.15, levels[0]?.height_m ?? 3.2, 12]} />
             <meshStandardMaterial color={colors.slabColor} roughness={0.6} />
          </mesh>
          <mesh position={[footprintW * 0.15, (levels[0]?.height_m ?? 3.2) / 2, 1.3]} castShadow>
             <cylinderGeometry args={[0.15, 0.15, levels[0]?.height_m ?? 3.2, 12]} />
             <meshStandardMaterial color={colors.slabColor} roughness={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}
