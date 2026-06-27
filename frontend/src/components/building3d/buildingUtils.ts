import type { LevelDefinition, OpeningDefinition } from '../../types/building';

// ── Material color palette ──────────────────────────────────────────────────
// Maps BuildingMeta.cladding_material to hex colors (from the HTML prototypes)
export const CLADDING_COLORS: Record<string, number> = {
  stone_white: 0xe8e8e4,
  stone_dark:  0x9e8060,
  glass:       0x8aaacc,
  concrete:    0xd8d5ce,
  brick:       0xb07050,
  concrete_with_glass: 0xd8d5ce,
  cast_stone:    0xe8e8e4,
  curtain_wall:  0x6899bb,
  metal_panel:   0x9ab0b8,
  glass_curtain: 0x6899bb,
  default:     0xd8d5ce,
};

// ── Color helpers ───────────────────────────────────────────────────────────
export function darken(hex: number, factor: number = 0.65): number {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return (
    (Math.floor(r * factor) << 16) |
    (Math.floor(g * factor) << 8) |
    Math.floor(b * factor)
  );
}

// ── Cumulative height ───────────────────────────────────────────────────────
export function getCumulativeHeight(
  levels: LevelDefinition[],
  upToIndex: number,
): number {
  let h = 0;
  for (let i = 0; i < upToIndex; i++) {
    h += levels[i].height_m;
  }
  return h;
}

// ── Window position along a wall face ───────────────────────────────────────
// Returns an array of { centerAlongWall, width, height, sillHeight } values
// for each window opening, converted from the offset_m (distance from wall
// start) into a centered coordinate suitable for Three.js positioning.
export interface WindowPlacement {
  /** Position along the wall measured from the wall center (can be negative) */
  posAlongWall: number;
  width: number;
  height: number;
  sillHeight: number;
}

export function getWindowPlacements(
  openings: OpeningDefinition[] | undefined,
  wallLength: number,
): WindowPlacement[] {
  if (!openings) return [];
  return openings
    .filter((o) => o.type === 'window')
    .map((o) => ({
      // offset_m is from the wall start; convert to center-relative
      posAlongWall: o.offset_m + o.width_m / 2 - wallLength / 2,
      width: o.width_m,
      height: o.height_m,
      sillHeight: o.sill_m,
    }));
}

// ── Wall classification helper ──────────────────────────────────────────────
// Given the 4 exterior walls from a level's wall data, identify which is
// front, back, left, right based on start/end coordinates. Falls back to
// generating walls procedurally if the data is empty.
export type WallFace = 'front' | 'back' | 'left' | 'right';

export interface FaceWallData {
  face: WallFace;
  openings: OpeningDefinition[];
  wallLength: number;
}

export function classifyExteriorWalls(
  walls: { start: { x: number; y: number }; end: { x: number; y: number }; type: string; openings?: OpeningDefinition[] }[],
  footprintW: number,
  footprintD: number,
): FaceWallData[] {
  const exterior = walls.filter((w) => w.type === 'exterior');

  if (exterior.length === 0) {
    // No wall data (e.g. from llmParser) → return empty faces so the
    // procedural generator still creates walls, just without windows.
    return [
      { face: 'front', openings: [], wallLength: footprintW },
      { face: 'back',  openings: [], wallLength: footprintW },
      { face: 'right', openings: [], wallLength: footprintD },
      { face: 'left',  openings: [], wallLength: footprintD },
    ];
  }

  // Heuristic: classify by start/end midpoint
  const result: FaceWallData[] = [];
  const used = new Set<number>();

  const findWall = (test: (w: typeof exterior[0]) => boolean, face: WallFace, len: number) => {
    const idx = exterior.findIndex((w, i) => !used.has(i) && test(w));
    if (idx >= 0) {
      used.add(idx);
      result.push({ face, openings: exterior[idx].openings ?? [], wallLength: len });
    } else {
      result.push({ face, openings: [], wallLength: len });
    }
  };

  // Front: y ≈ 0  (min y)
  findWall((w) => Math.abs(w.start.y) < 1 && Math.abs(w.end.y) < 1, 'front', footprintW);
  // Back: y ≈ depth
  findWall((w) => Math.abs(w.start.y - footprintD) < 1 && Math.abs(w.end.y - footprintD) < 1, 'back', footprintW);
  // Right: x ≈ width
  findWall((w) => Math.abs(w.start.x - footprintW) < 1 && Math.abs(w.end.x - footprintW) < 1, 'right', footprintD);
  // Left: x ≈ 0
  findWall((w) => Math.abs(w.start.x) < 1 && Math.abs(w.end.x) < 1, 'left', footprintD);

  return result;
}

// ── Room and Wall Utilities ─────────────────────────────────────────────────

export interface Point2D {
  x: number;
  y: number;
}

export function computePolygonBounds(polygon: Point2D[]): { centerX: number; centerY: number; width: number; depth: number } {
  if (!polygon || polygon.length === 0) {
    return { centerX: 0, centerY: 0, width: 0, depth: 0 };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  
  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: maxX - minX,
    depth: maxY - minY,
  };
}

export function wallSegmentTransform(
  start: Point2D,
  end: Point2D,
  thickness: number = 0.28
): { cx: number; cy: number; length: number; rotationY: number; thickness: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const rotationY = Math.atan2(dy, dx);
  
  return {
    cx: start.x + dx / 2,
    cy: start.y + dy / 2,
    length,
    rotationY,
    thickness,
  };
}

export const ROOM_TYPE_COLORS: Record<string, number> = {
  lobby: 0xFFB347,
  office: 0x5B9BD5,
  residential: 0x7BC67E,
  bedroom: 0x7BC67E,
  bathroom: 0xB4A7D6,
  utility: 0xB4A7D6,
  kitchen: 0xCC6644,
  storage: 0x95A5A6,
  mechanical: 0x95A5A6,
  default: 0xD5D5D5,
};

export const WALL_TYPE_COLORS: Record<string, number> = {
  core: 0x555555,
  interior: 0x888888,
  partition: 0xBBBBBB,
  exterior: 0xD8D5CE,
};

export const EXPLODED_SPACING = 2.0;
export const MULLION_DEPTH = 0.04;
export const RECESS_DEPTH = 0.08;
