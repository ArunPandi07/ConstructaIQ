/**
 * HTML-accurate Twin Tower Residential exterior (G+6, 14×12 m towers, 2.8 m connector).
 * Ported from the reference Three.js HTML prototype.
 */
import { useMemo, type ReactElement } from 'react';
import type { BuildingDefinition } from '../../types/building';
import type { ViewerState, SelectedElement } from './useViewerState';

const FLOORS = 7;
const FH = 3.2;
const GH = 3.6;
const TW = 14;
const TD = 12;
const WT = 0.3;
const GAP = 2.8;

const COLORS = {
  stone: 0xe8e8e4,
  stoneDk: 0xd0d0cc,
  band: 0xc8c8c4,
  bandDk: 0xb8b8b4,
  metal: 0x1a1a1e,
  winFrame: 0xf0f0ee,
  glass: 0x8aaacc,
  glassLit: 0x9ab8d8,
  balcFloor: 0xb89060,
  penthWall: 0xd8d8d4,
  pavement: 0xc8c8c4,
  road: 0x888884,
  grass: 0x4a7a30,
};

function useMeshHandlers(viewerState: ViewerState | undefined, userData: SelectedElement | undefined) {
  if (!viewerState || !userData) return {};
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

function Box({
  w, h, d, x, y, z, color, roughness = 0.85, metalness = 0, transparent, opacity, emissive, emissiveIntensity,
  viewerState, userData
}: {
  w: number; h: number; d: number; x: number; y: number; z: number; color: number;
  roughness?: number; metalness?: number; transparent?: boolean; opacity?: number;
  emissive?: number; emissiveIntensity?: number;
  viewerState?: ViewerState; userData?: SelectedElement;
}) {
  const handlers = useMeshHandlers(viewerState, userData);
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow {...handlers}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} transparent={transparent} opacity={opacity} emissive={emissive} emissiveIntensity={emissiveIntensity} />
    </mesh>
  );
}

function Cylinder({
  r, h, x, y, z, color, roughness = 0.55, metalness = 0.7,
  viewerState, userData
}: {
  r: number; h: number; x: number; y: number; z: number; color: number;
  roughness?: number; metalness?: number;
  viewerState?: ViewerState; userData?: SelectedElement;
}) {
  const handlers = useMeshHandlers(viewerState, userData);
  return (
    <mesh position={[x, y, z]} castShadow receiveShadow {...handlers}>
      <cylinderGeometry args={[r, r, h, 8]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

function Tower({ cx, glassIntensity = 0.3, viewerState, name }: { cx: number; glassIntensity?: number; viewerState: ViewerState; name: string }) {
  const half = TW / 2;
  const hdep = TD / 2;
  const levelGroups: ReactElement[] = [];

  const isFloorPlan = viewerState.mode === 'floor-plan';
  const isIsolate = viewerState.mode === 'level-isolate';
  const isExploded = viewerState.mode === 'exploded';

  for (let f = 0; f < FLOORS; f++) {
    const isGround = f === 0;
    const yBase = isGround ? 0 : GH + (f - 1) * FH;
    
    let yOffset = 0;
    if (isExploded) yOffset = f * 2.0; // EXPLODED_SPACING

    const isActive = f === viewerState.activeLevel;
                      
    if (isFloorPlan && viewerState.activeLevel !== -1 && !isActive) continue;

    const op = (!isActive && isIsolate && viewerState.activeLevel !== -1) ? 0.08 : 1.0;
    if (op < 0.1 && !isActive) continue; // simplistic opacity handling

    const flElements: ReactElement[] = [];
    const ud = { type: 'wall' as const, levelIndex: f, levelName: `Level ${f}`, id: `${name}-L${f}` };

    if (isGround) {
      flElements.push(<Box key="gf-mass" w={TW} h={GH} d={TD} x={cx} y={GH / 2} z={0} color={COLORS.stone} viewerState={viewerState} userData={ud} />);
      for (let i = -1; i <= 1; i++) {
        const gx = cx + i * 4.2;
        flElements.push(
          <Box key={`gf-w-${i}`} w={3.5} h={2.4} d={WT} x={gx} y={GH / 2 - 0.1} z={hdep - 0.01} color={COLORS.glass} roughness={0.05} metalness={0.1} transparent opacity={0.78} viewerState={viewerState} userData={{...ud, type: 'window'}} />,
          <Box key={`gf-f-${i}`} w={3.75} h={2.6} d={0.05} x={gx} y={GH / 2 - 0.1} z={hdep + 0.02} color={COLORS.winFrame} roughness={0.6} />
        );
      }
      flElements.push(
        <Box key="gf-door-1" w={WT} h={2.2} d={3.5} x={cx + half + 0.01} y={GH / 2} z={-1.5} color={COLORS.glass} roughness={0.05} transparent opacity={0.78} viewerState={viewerState} userData={{...ud, type: 'door'}} />,
        <Box key="gf-door-2" w={WT} h={2.2} d={3.5} x={cx + half + 0.01} y={GH / 2} z={2.5} color={COLORS.glass} roughness={0.05} transparent opacity={0.78} viewerState={viewerState} userData={{...ud, type: 'door'}} />
      );
    } else {
      const wPositions = [cx - 4.2, cx, cx + 4.2];
      flElements.push(
        <Box key={`slab-${f}`} w={TW + 0.2} h={0.28} d={TD + 0.2} x={cx} y={yBase - 0.14} z={0} color={COLORS.band} viewerState={viewerState} userData={{...ud, type: 'slab'}} />,
        <Box key={`mass-${f}`} w={TW} h={FH - 0.28} d={TD} x={cx} y={yBase + (FH - 0.28) / 2} z={0} color={COLORS.stone} viewerState={viewerState} userData={ud} />
      );
      wPositions.forEach((wx, wi) => {
        flElements.push(
          <Box key={`w-${f}-${wi}`} w={3} h={FH - 1.1} d={WT} x={wx} y={yBase + FH / 2} z={hdep - 0.01} color={COLORS.glassLit} roughness={0.05} transparent opacity={0.7} emissive={0x1a3050} emissiveIntensity={glassIntensity} viewerState={viewerState} userData={{...ud, type: 'window'}} />,
          <Box key={`wf-${f}-${wi}`} w={3.15} h={FH - 0.95} d={0.06} x={wx} y={yBase + FH / 2} z={hdep + 0.02} color={COLORS.winFrame} roughness={0.6} />,
          <Box key={`wh-${f}-${wi}`} w={2.85} h={0.06} d={0.06} x={wx} y={yBase + FH / 2} z={hdep + 0.05} color={COLORS.metal} roughness={0.55} metalness={0.7} />,
          <Box key={`wv-${f}-${wi}`} w={0.06} h={FH - 1.05} d={0.06} x={wx} y={yBase + FH / 2} z={hdep + 0.05} color={COLORS.metal} roughness={0.55} metalness={0.7} />
        );
      });
      // Balcony
      flElements.push(<Box key={`balc-slab-${f}`} w={TW + 0.2} h={0.18} d={1.6} x={cx} y={yBase + 0.09} z={hdep + 0.8} color={COLORS.balcFloor} roughness={0.85} viewerState={viewerState} userData={{...ud, type: 'balcony'}} />);
      const postCount = 14;
      for (let p = 0; p <= postCount; p++) {
        flElements.push(<Cylinder key={`balc-p-${f}-${p}`} r={0.04} h={0.9} x={cx - half + p * (TW / postCount)} y={yBase + 0.63} z={hdep + 1.5} color={COLORS.metal} />);
      }
      flElements.push(
        <Box key="br1" w={TW + 0.3} h={0.06} d={0.06} x={cx} y={yBase + 1.1} z={hdep + 1.5} color={COLORS.metal} roughness={0.55} metalness={0.7} />,
        <Box key="br2" w={TW + 0.3} h={0.06} d={0.06} x={cx} y={yBase + 0.25} z={hdep + 1.5} color={COLORS.metal} roughness={0.55} metalness={0.7} />,
        <Box key="br3" w={0.06} h={0.9} d={1.6} x={cx - half - 0.05} y={yBase + 0.63} z={hdep + 0.8} color={COLORS.metal} roughness={0.55} metalness={0.7} />,
        <Box key="br4" w={0.06} h={0.9} d={1.6} x={cx + half + 0.05} y={yBase + 0.63} z={hdep + 0.8} color={COLORS.metal} roughness={0.55} metalness={0.7} />
      );
      // Side windows
      flElements.push(
        <Box key="sw1" w={WT} h={FH - 1.2} d={3.2} x={cx + half - 0.01} y={yBase + FH / 2} z={-2} color={COLORS.glassLit} roughness={0.05} transparent opacity={0.7} emissive={0x1a3050} emissiveIntensity={glassIntensity} viewerState={viewerState} userData={{...ud, type: 'window'}} />,
        <Box key="swa2" w={0.06} h={FH - 1.05} d={3.3} x={cx + half + 0.02} y={yBase + FH / 2} z={-2} color={COLORS.winFrame} roughness={0.6} />,
        <Box key="sw3" w={WT} h={FH - 1.2} d={3.2} x={cx + half - 0.01} y={yBase + FH / 2} z={2} color={COLORS.glassLit} roughness={0.05} transparent opacity={0.7} emissive={0x1a3050} emissiveIntensity={glassIntensity} viewerState={viewerState} userData={{...ud, type: 'window'}} />,
        <Box key="sw4" w={0.06} h={FH - 1.05} d={3.3} x={cx + half + 0.02} y={yBase + FH / 2} z={2} color={COLORS.winFrame} roughness={0.6} />
      );
      [cx - 3.5, cx, cx + 3.5].forEach((bx, bi) => {
        flElements.push(<Box key={`back-${f}-${bi}`} w={2.6} h={FH - 1.3} d={WT} x={bx} y={yBase + FH / 2} z={-hdep + 0.01} color={COLORS.glass} roughness={0.05} transparent opacity={0.78} viewerState={viewerState} userData={{...ud, type: 'window'}} />);
      });
      if (f % 2 !== 0) { // adjusted mod logic for f start
        flElements.push(<Box key={`side-balc-${f}`} w={1.4} h={0.16} d={TD * 0.5} x={cx + half + 0.7} y={yBase + 0.08} z={-1.5} color={COLORS.balcFloor} roughness={0.85} viewerState={viewerState} userData={{...ud, type: 'balcony'}} />);
        const spc2 = 6;
        for (let sp = 0; sp <= spc2; sp++) {
          flElements.push(<Cylinder key={`side-balc-p-${f}-${sp}`} r={0.04} h={0.88} x={cx + half + 0.04} y={yBase + 0.62} z={-hdep / 2 + sp * ((TD * 0.5) / spc2)} color={COLORS.metal} />);
        }
        flElements.push(<Box key="sbr1" w={0.06} h={0.88} d={TD * 0.5 + 0.2} x={cx + half + 1.38} y={yBase + 0.62} z={-1.5} color={COLORS.metal} roughness={0.55} metalness={0.7} />);
      }
      flElements.push(
        <Box key="bd1" w={TW + 0.25} h={0.12} d={0.12} x={cx} y={yBase - 0.01} z={hdep + 0.06} color={COLORS.bandDk} />,
        <Box key="bd2" w={TW + 0.25} h={0.12} d={0.12} x={cx} y={yBase - 0.01} z={-hdep - 0.06} color={COLORS.bandDk} />
      );
    }
    levelGroups.push(<group key={`level-${f}`} position={[0, yOffset, 0]}>{flElements}</group>);
  }

  if (!isFloorPlan) {
    const yRoof = GH + (FLOORS - 1) * FH;
    let yOffset = isExploded ? FLOORS * 2.0 : 0;
    const rfElements: ReactElement[] = [];
    const ud = { type: 'roof' as const, levelIndex: 999, levelName: 'Roof', id: `${name}-roof` };
    
    rfElements.push(
      <Box key="r1" w={TW + 0.5} h={0.35} d={TD + 0.5} x={cx} y={yRoof - 0.175} z={0} color={COLORS.bandDk} viewerState={viewerState} userData={{...ud, type: 'slab'}} />,
      <Box key="r2" w={TW - 2} h={3.6} d={TD - 2} x={cx} y={yRoof + 1.8} z={0} color={COLORS.penthWall} viewerState={viewerState} userData={ud} />,
      <Box key="r3" w={2.8} h={2.2} d={WT} x={cx - 3} y={yRoof + 1.8} z={(TD - 2) / 2 - 0.01} color={COLORS.glassLit} roughness={0.05} transparent opacity={0.7} emissive={0x1a3050} emissiveIntensity={glassIntensity} viewerState={viewerState} userData={{...ud, type: 'window'}} />,
      <Box key="r4" w={3.15} h={2.35} d={0.06} x={cx - 3} y={yRoof + 1.8} z={(TD - 2) / 2 + 0.02} color={COLORS.winFrame} roughness={0.6} />,
      <Box key="r5" w={2.8} h={2.2} d={WT} x={cx + 3} y={yRoof + 1.8} z={(TD - 2) / 2 - 0.01} color={COLORS.glassLit} roughness={0.05} transparent opacity={0.7} emissive={0x1a3050} emissiveIntensity={glassIntensity} viewerState={viewerState} userData={{...ud, type: 'window'}} />,
      <Box key="r6" w={3.15} h={2.35} d={0.06} x={cx + 3} y={yRoof + 1.8} z={(TD - 2) / 2 + 0.02} color={COLORS.winFrame} roughness={0.6} />,
      <Box key="r7" w={TW - 1.5} h={0.4} d={TD - 1.5} x={cx} y={yRoof + 3.8} z={0} color={COLORS.stone} viewerState={viewerState} userData={ud} />,
      <Box key="r8" w={TW + 0.5} h={0.9} d={0.22} x={cx} y={yRoof + 0.45} z={(TD + 0.5) / 2} color={COLORS.stoneDk} />,
      <Box key="r9" w={TW + 0.5} h={0.9} d={0.22} x={cx} y={yRoof + 0.45} z={-(TD + 0.5) / 2} color={COLORS.stoneDk} />,
      <Box key="r10" w={0.22} h={0.9} d={TD + 0.5} x={cx + (TW + 0.5) / 2} y={yRoof + 0.45} z={0} color={COLORS.stoneDk} />,
      <Box key="r11" w={0.22} h={0.9} d={TD + 0.5} x={cx - (TW + 0.5) / 2} y={yRoof + 0.45} z={0} color={COLORS.stoneDk} />
    );
    const yPR = yRoof + 4.0;
    const rPosts = 10;
    for (let rp = 0; rp <= rPosts; rp++) {
      const px = cx - (TW - 1.5) / 2 + rp * ((TW - 1.5) / rPosts);
      rfElements.push(
        <Cylinder key={`roof-p-f-${rp}`} r={0.04} h={0.85} x={px} y={yPR + 0.42} z={(TD - 1.5) / 2 + 0.05} color={COLORS.metal} />,
        <Cylinder key={`roof-p-b-${rp}`} r={0.04} h={0.85} x={px} y={yPR + 0.42} z={-(TD - 1.5) / 2 - 0.05} color={COLORS.metal} />
      );
    }
    rfElements.push(
      <Box key="rr1" w={TW - 1.3} h={0.06} d={0.06} x={cx} y={yPR + 0.88} z={(TD - 1.5) / 2 + 0.05} color={COLORS.metal} roughness={0.55} metalness={0.7} />,
      <Box key="rr2" w={TW - 1.3} h={0.06} d={0.06} x={cx} y={yPR + 0.88} z={-(TD - 1.5) / 2 - 0.05} color={COLORS.metal} roughness={0.55} metalness={0.7} />
    );
    levelGroups.push(<group key="roof" position={[0, yOffset, 0]}>{rfElements}</group>);
  }

  return <group>{levelGroups}</group>;
}

function PodiumConnector({ viewerState }: { viewerState: ViewerState }) {
  if (viewerState.mode === 'floor-plan' || viewerState.activeLevel > 1) return null;

  const podW = GAP;
  const podH = GH;
  const podCX = 0;
  const prCount = 12;
  const elements: ReactElement[] = [
    <Box key="podium" w={podW} h={podH} d={TD} x={podCX} y={podH / 2} z={0} color={COLORS.stoneDk} viewerState={viewerState} userData={{type: 'wall', levelIndex: 0, levelName: 'Ground', id: 'podium'}} />,
    <Box key="arch" w={2.2} h={3} d={WT} x={podCX} y={podH / 2 - 0.3} z={TD / 2} color={COLORS.stone} />,
    <Box key="lintel" w={2.2} h={0.3} d={WT} x={podCX} y={podH - 0.15} z={TD / 2} color={COLORS.band} />,
    <Box key="podium-slab" w={podW + 0.1} h={0.25} d={TD + 0.1} x={podCX} y={podH - 0.12} z={0} color={COLORS.band} viewerState={viewerState} userData={{type: 'slab', levelIndex: 1, levelName: 'Level 1', id: 'podium-slab'}} />,
  ];
  for (let pr = 0; pr <= prCount; pr++) {
    elements.push(
      <Cylinder key={`p-rail-${pr}`} r={0.04} h={0.85} x={podCX - (podW / 2 - 0.1) + pr * (podW / prCount)} y={podH + 0.42} z={TD / 2} color={COLORS.metal} />,
    );
  }
  elements.push(
    <Box key="c1" w={podW + 0.1} h={0.06} d={0.06} x={podCX} y={podH + 0.88} z={TD / 2} color={COLORS.metal} roughness={0.55} metalness={0.7} />,
    <Box key="c2" w={podW + 0.1} h={0.06} d={0.06} x={podCX} y={podH + 0.88} z={-TD / 2} color={COLORS.metal} roughness={0.55} metalness={0.7} />,
  );
  return <group>{elements}</group>;
}

export function TwinTowerSite({ viewerState }: { viewerState: ViewerState }) {
  if (!viewerState.layers.site) return null;

  const grass = useMemo(
    () =>
      [
        [-30, -14],
        [-30, 14],
        [36, -14],
        [36, 14],
        [-30, 0],
        [36, 0],
      ] as [number, number][],
    [],
  );

  return (
    <group>
      <Box w={120} h={0.3} d={80} x={0} y={-0.15} z={0} color={COLORS.road} roughness={0.95} />
      <Box w={55} h={0.15} d={42} x={4} y={0.08} z={0} color={COLORS.pavement} roughness={0.92} />
      {grass.map(([gx, gz], i) => (
        <Box key={`grass-${i}`} w={8} h={0.2} d={6} x={gx} y={0.1} z={gz} color={COLORS.grass} roughness={0.92} />
      ))}
      <Box w={55} h={0.22} d={0.3} x={4} y={0.11} z={-20} color={COLORS.band} />
      <Box w={55} h={0.22} d={0.3} x={4} y={0.11} z={20} color={COLORS.band} />
    </group>
  );
}

export function TwinTowerModel({
  buildingDefinition,
  isDayMode,
  viewerState,
}: {
  buildingDefinition: BuildingDefinition;
  isDayMode: boolean;
  viewerState: ViewerState;
}) {
  const layout = useMemo(() => {
    const gap = 2.8;
    const totalWidth = buildingDefinition.building.footprint?.width_m ?? 30.8;
    const tw = Math.max(8, (totalWidth - gap) / 2);
    const td = buildingDefinition.building.footprint?.depth_m ?? 12;
    const floors = buildingDefinition.building.stories ?? 7;
    return {
      scaleX: tw / TW,
      scaleY: floors / FLOORS,
      scaleZ: td / TD,
      gapScale: gap / GAP,
      txA: -(tw / 2 + gap / 2),
      txB: tw / 2 + gap / 2,
    };
  }, [buildingDefinition]);

  if (!viewerState.layers.facade) return null;

  return (
    <group>
      <ambientLight intensity={isDayMode ? 0.55 : 0.22} />
      <directionalLight
        position={[20, 30, 15]}
        intensity={isDayMode ? 1.1 : 0.45}
        castShadow
      />
      <TwinTowerSite viewerState={viewerState} />
      <group position={[layout.txA, 0, 0]} scale={[layout.scaleX, layout.scaleY, layout.scaleZ]}>
        <Tower cx={0} glassIntensity={isDayMode ? 0.12 : 0.3} viewerState={viewerState} name="Tower A" />
      </group>
      <group position={[layout.txB, 0, 0]} scale={[layout.scaleX, layout.scaleY, layout.scaleZ]}>
        <Tower cx={0} glassIntensity={isDayMode ? 0.12 : 0.3} viewerState={viewerState} name="Tower B" />
      </group>
      <group scale={[layout.gapScale, layout.scaleY, layout.scaleZ]}>
        <PodiumConnector viewerState={viewerState} />
      </group>
    </group>
  );
}

export const TWIN_TOWER_CAMERA = {
  position: [35, 22, 40] as [number, number, number],
  target: [4, 8, 0] as [number, number, number],
  fov: 40,
};
