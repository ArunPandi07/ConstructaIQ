/**
 * demoBuilding.ts
 *
 * A rich, realistic BuildingDefinition fixture for a 7-floor residential tower.
 * Used by the public /demo3d route so the 3D viewer can be previewed
 * without the backend running.
 *
 * Visual target: clean white facade, full-width balconies, grouped window bays,
 * vertical fins, entrance steps, rooftop pergola — matching the reference images.
 */

import type { BuildingDefinition, LevelDefinition } from "../types/building";

// ── Dimensions ─────────────────────────────────────────────────────────────
const WIDTH  = 28;   // metres
const DEPTH  = 18;   // metres
const FLOOR_H = 3.2; // metres per floor
const STORIES = 7;

// ── Wall helper ─────────────────────────────────────────────────────────────
type WallType = "exterior" | "interior" | "core" | "partition";

function exteriorWalls(level: number) {
  const w = WIDTH;
  const d = DEPTH;

  return [
    // Front facade — rich window openings matching grouped-bay pattern
    {
      id: `l${level}_front`,
      start: { x: 0,     y: 0 },
      end:   { x: w,     y: 0 },
      thickness_m: 0.28,
      type: "exterior" as WallType,
      material: "white_render",
      openings: [
        // Bay 1 — double window group
        { id: `l${level}_f_w1a`, type: "window" as const, offset_m: 1.4,  width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        { id: `l${level}_f_w1b`, type: "window" as const, offset_m: 3.1,  width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        // Bay 2 — double window group
        { id: `l${level}_f_w2a`, type: "window" as const, offset_m: 7.6,  width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        { id: `l${level}_f_w2b`, type: "window" as const, offset_m: 9.3,  width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        // Bay 3 — double window group (right side)
        { id: `l${level}_f_w3a`, type: "window" as const, offset_m: 17.8, width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        { id: `l${level}_f_w3b`, type: "window" as const, offset_m: 19.5, width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        // Bay 4 — right edge pair
        { id: `l${level}_f_w4a`, type: "window" as const, offset_m: 23.4, width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        { id: `l${level}_f_w4b`, type: "window" as const, offset_m: 25.1, width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        // Ground floor: entrance door instead of windows in centre
        ...(level === 0
          ? [{ id: `l0_entrance`, type: "door" as const, offset_m: 12.2, width_m: 2.4, height_m: 2.8, sill_m: 0 }]
          : []),
      ],
    },
    // Right side — strip windows
    {
      id: `l${level}_right`,
      start: { x: w, y: 0 },
      end:   { x: w, y: d },
      thickness_m: 0.28,
      type: "exterior" as WallType,
      material: "white_render",
      openings: [
        { id: `l${level}_r_w1`, type: "window" as const, offset_m: 2.5, width_m: 1.4, height_m: 1.8, sill_m: 0.9 },
        { id: `l${level}_r_w2`, type: "window" as const, offset_m: 7.2, width_m: 1.4, height_m: 1.8, sill_m: 0.9 },
        { id: `l${level}_r_w3`, type: "window" as const, offset_m: 12.4, width_m: 1.4, height_m: 1.8, sill_m: 0.9 },
      ],
    },
    // Rear facade — symmetric to front
    {
      id: `l${level}_rear`,
      start: { x: w, y: d },
      end:   { x: 0, y: d },
      thickness_m: 0.28,
      type: "exterior" as WallType,
      material: "white_render",
      openings: [
        { id: `l${level}_b_w1a`, type: "window" as const, offset_m: 1.4,  width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        { id: `l${level}_b_w1b`, type: "window" as const, offset_m: 3.1,  width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        { id: `l${level}_b_w2a`, type: "window" as const, offset_m: 7.6,  width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        { id: `l${level}_b_w2b`, type: "window" as const, offset_m: 9.3,  width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        { id: `l${level}_b_w3a`, type: "window" as const, offset_m: 17.8, width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        { id: `l${level}_b_w3b`, type: "window" as const, offset_m: 19.5, width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        { id: `l${level}_b_w4a`, type: "window" as const, offset_m: 23.4, width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
        { id: `l${level}_b_w4b`, type: "window" as const, offset_m: 25.1, width_m: 1.5, height_m: 2.0, sill_m: 0.85 },
      ],
    },
    // Left side — strip windows
    {
      id: `l${level}_left`,
      start: { x: 0, y: d },
      end:   { x: 0, y: 0 },
      thickness_m: 0.28,
      type: "exterior" as WallType,
      material: "white_render",
      openings: [
        { id: `l${level}_l_w1`, type: "window" as const, offset_m: 2.5, width_m: 1.4, height_m: 1.8, sill_m: 0.9 },
        { id: `l${level}_l_w2`, type: "window" as const, offset_m: 7.2, width_m: 1.4, height_m: 1.8, sill_m: 0.9 },
        { id: `l${level}_l_w3`, type: "window" as const, offset_m: 12.4, width_m: 1.4, height_m: 1.8, sill_m: 0.9 },
      ],
    },
  ];
}

// ── Interior walls (partition layout per floor type) ────────────────────────
function interiorWalls(level: number) {
  const w = WIDTH;
  const d = DEPTH;

  if (level === 0) {
    // Ground floor: lobby + retail
    return [
      { id: `l0_p1`, start: { x: w * 0.38, y: 0     }, end: { x: w * 0.38, y: d * 0.62 }, thickness_m: 0.15, type: "interior" as WallType, material: "partition", openings: [{ id: `l0_p1_d`, type: "door" as const, offset_m: 1.2, width_m: 0.9, height_m: 2.1, sill_m: 0 }] },
      { id: `l0_p2`, start: { x: w * 0.38, y: d * 0.62 }, end: { x: w,       y: d * 0.62 }, thickness_m: 0.15, type: "interior" as WallType, material: "partition", openings: [] },
      { id: `l0_core_w`, start: { x: w * 0.5, y: d * 0.3 }, end: { x: w * 0.5, y: d * 0.75 }, thickness_m: 0.22, type: "core" as WallType, material: "concrete", openings: [] },
    ];
  }

  // Upper floors: typical residential layout
  return [
    // Corridor wall
    { id: `l${level}_corr`,   start: { x: w * 0.35, y: 0     }, end: { x: w * 0.35, y: d * 0.55 }, thickness_m: 0.15, type: "partition" as WallType, material: "partition", openings: [{ id: `l${level}_corr_d`, type: "door" as const, offset_m: 0.8, width_m: 0.9, height_m: 2.1, sill_m: 0 }] },
    // Living / bedroom divider
    { id: `l${level}_div1`,   start: { x: w * 0.55, y: 0     }, end: { x: w * 0.55, y: d * 0.5  }, thickness_m: 0.12, type: "partition" as WallType, material: "partition", openings: [{ id: `l${level}_div1_d`, type: "door" as const, offset_m: 2.2, width_m: 0.8, height_m: 2.1, sill_m: 0 }] },
    // Bathroom / kitchen spine
    { id: `l${level}_bath`,   start: { x: w * 0.35, y: d * 0.55 }, end: { x: w * 0.55, y: d * 0.55 }, thickness_m: 0.12, type: "partition" as WallType, material: "partition", openings: [] },
    // Core / lift shaft
    { id: `l${level}_core_a`, start: { x: w * 0.62, y: d * 0.28 }, end: { x: w * 0.62, y: d * 0.72 }, thickness_m: 0.22, type: "core" as WallType, material: "concrete", openings: [] },
    { id: `l${level}_core_b`, start: { x: w * 0.62, y: d * 0.28 }, end: { x: w * 0.78, y: d * 0.28 }, thickness_m: 0.22, type: "core" as WallType, material: "concrete", openings: [] },
    { id: `l${level}_core_c`, start: { x: w * 0.78, y: d * 0.28 }, end: { x: w * 0.78, y: d * 0.72 }, thickness_m: 0.22, type: "core" as WallType, material: "concrete", openings: [] },
    { id: `l${level}_core_d`, start: { x: w * 0.62, y: d * 0.72 }, end: { x: w * 0.78, y: d * 0.72 }, thickness_m: 0.22, type: "core" as WallType, material: "concrete", openings: [] },
  ];
}

// ── Room layouts ────────────────────────────────────────────────────────────
function rooms(level: number) {
  const w = WIDTH;
  const d = DEPTH;

  if (level === 0) {
    return [
      {
        id: `l0_lobby`,
        name: "Lobby / Entry Hall",
        type: "lobby",
        height_m: FLOOR_H,
        polygon: [
          { x: 0.3, y: 0.3 }, { x: w * 0.38 - 0.1, y: 0.3 },
          { x: w * 0.38 - 0.1, y: d * 0.62 - 0.1 }, { x: 0.3, y: d * 0.62 - 0.1 },
        ],
      },
      {
        id: `l0_retail`,
        name: "Ground Floor Retail",
        type: "retail",
        height_m: FLOOR_H,
        polygon: [
          { x: w * 0.38 + 0.1, y: 0.3 }, { x: w * 0.62 - 0.1, y: 0.3 },
          { x: w * 0.62 - 0.1, y: d * 0.62 - 0.1 }, { x: w * 0.38 + 0.1, y: d * 0.62 - 0.1 },
        ],
      },
      {
        id: `l0_carpark`,
        name: "Parking / Services",
        type: "parking",
        height_m: FLOOR_H,
        polygon: [
          { x: w * 0.62 + 0.1, y: 0.3 }, { x: w - 0.3, y: 0.3 },
          { x: w - 0.3, y: d - 0.3 }, { x: w * 0.62 + 0.1, y: d - 0.3 },
        ],
      },
    ];
  }

  const isTopFloor = level === STORIES - 1;
  return [
    {
      id: `l${level}_living`,
      name: isTopFloor ? "Penthouse Living" : "Living / Dining",
      type: "living",
      height_m: FLOOR_H,
      polygon: [
        { x: 0.3,          y: 0.3 },
        { x: w * 0.35 - 0.1, y: 0.3 },
        { x: w * 0.35 - 0.1, y: d * 0.55 - 0.1 },
        { x: 0.3,          y: d * 0.55 - 0.1 },
      ],
    },
    {
      id: `l${level}_kitchen`,
      name: "Kitchen",
      type: "kitchen",
      height_m: FLOOR_H,
      polygon: [
        { x: 0.3,            y: d * 0.55 + 0.1 },
        { x: w * 0.35 - 0.1, y: d * 0.55 + 0.1 },
        { x: w * 0.35 - 0.1, y: d - 0.3 },
        { x: 0.3,            y: d - 0.3 },
      ],
    },
    {
      id: `l${level}_bed1`,
      name: isTopFloor ? "Master Bedroom" : "Bedroom 1",
      type: "bedroom",
      height_m: FLOOR_H,
      polygon: [
        { x: w * 0.35 + 0.1, y: 0.3 },
        { x: w * 0.55 - 0.1, y: 0.3 },
        { x: w * 0.55 - 0.1, y: d * 0.5 - 0.1 },
        { x: w * 0.35 + 0.1, y: d * 0.5 - 0.1 },
      ],
    },
    {
      id: `l${level}_bed2`,
      name: "Bedroom 2",
      type: "bedroom",
      height_m: FLOOR_H,
      polygon: [
        { x: w * 0.35 + 0.1, y: d * 0.55 + 0.1 },
        { x: w * 0.55 - 0.1, y: d * 0.55 + 0.1 },
        { x: w * 0.55 - 0.1, y: d - 0.3 },
        { x: w * 0.35 + 0.1, y: d - 0.3 },
      ],
    },
    {
      id: `l${level}_corridor`,
      name: "Corridor",
      type: "corridor",
      height_m: FLOOR_H,
      polygon: [
        { x: w * 0.55 + 0.1, y: 0.3 },
        { x: w * 0.62 - 0.1, y: 0.3 },
        { x: w * 0.62 - 0.1, y: d - 0.3 },
        { x: w * 0.55 + 0.1, y: d - 0.3 },
      ],
    },
  ];
}

// ── Staircase ───────────────────────────────────────────────────────────────
function stairs(level: number) {
  return [
    {
      id: `l${level}_stair_main`,
      position: { x: WIDTH * 0.66, y: DEPTH * 0.32 },
      width_m: 1.8,
      depth_m: 3.8,
      direction: (level === 0 ? "up" : level === STORIES - 1 ? "down" : "both") as "up" | "down" | "both",
    },
  ];
}

// ── Assemble all levels ─────────────────────────────────────────────────────
const levels: LevelDefinition[] = Array.from({ length: STORIES }, (_, i) => ({
  level: i,
  name:
    i === 0
      ? "Ground Floor"
      : i === STORIES - 1
      ? "Penthouse"
      : `Level ${i + 1}`,
  height_m: FLOOR_H,
  floorplate: { width_m: WIDTH, depth_m: DEPTH },
  rooms: rooms(i),
  walls: [...exteriorWalls(i), ...interiorWalls(i)],
  stairs: stairs(i),
}));

// ── Final definition export ─────────────────────────────────────────────────
export const DEMO_BUILDING_DEFINITION: BuildingDefinition = {
  building: {
    type: "residential_tower",
    stories: STORIES,
    totalHeight_m: STORIES * FLOOR_H,
    footprint: { width_m: WIDTH, depth_m: DEPTH },
    construction_type: "Reinforced Concrete",
    roof_type: "flat",
  },
  levels,
  facade: {
    balconies: true,
    balcony_depth_m: 1.6,
    railing_height_m: 1.1,
    window_pattern: "grid",
    material: "white_render",
  },
};

/** Twin Tower Residences — HTML reference (G+6, 30.8×12 m site) */
export const TWIN_TOWER_DEMO: BuildingDefinition = {
  building: {
    type: "residential_tower",
    stories: 7,
    totalHeight_m: 3.6 + 6 * 3.2,
    footprint: { width_m: 30.8, depth_m: 12 },
    construction_type: "Type III-A over Type I Podium",
    roof_type: "penthouse",
    footprint_shape: "twin_tower",
    cladding_material: "stone_white",
  },
  levels: Array.from({ length: 7 }, (_, i) => ({
    level: i,
    name: i === 0 ? "Ground Floor" : i === 6 ? "Penthouse" : `Level ${i + 1}`,
    height_m: i === 0 ? 3.6 : 3.2,
    floorplate: { width_m: 14, depth_m: 12 },
    rooms: [],
    walls: [],
    stairs: [],
  })),
  facade: {
    balconies: true,
    balcony_depth_m: 1.6,
    railing_height_m: 1.1,
    window_pattern: "grid",
    material: "cast_stone",
  },
};

/** Available demo building variants for the selector */
export type DemoVariant = "residential_tower" | "twin_tower" | "office_tower" | "mixed_use" | "villa" | "a_frame" | "high_rise";

export function getDemoVariant(variant: DemoVariant): BuildingDefinition {
  if (variant === "twin_tower") {
    return TWIN_TOWER_DEMO;
  }
  
  if (variant === "villa") {
    return {
      building: { type: "residential_villa", stories: 2, totalHeight_m: 6.4, footprint: { width_m: 20, depth_m: 20 }, construction_type: "Concrete", roof_type: "flat", footprint_shape: "villa" },
      levels: Array.from({ length: 2 }, (_, i) => ({ level: i, name: i === 0 ? "Ground Floor" : "First Floor", height_m: 3.2, floorplate: { width_m: 20, depth_m: 20 }, rooms: [], walls: [], stairs: [] })),
      facade: { balconies: true, balcony_depth_m: 0, railing_height_m: 1.1, window_pattern: "grid", material: "brick" }
    };
  }

  if (variant === "a_frame") {
    return {
      building: { type: "residential_villa", stories: 2, totalHeight_m: 7, footprint: { width_m: 15, depth_m: 12 }, construction_type: "Wood", roof_type: "pitched", footprint_shape: "a_frame" },
      levels: Array.from({ length: 2 }, (_, i) => ({ level: i, name: i === 0 ? "Ground Floor" : "Loft", height_m: 3.5, floorplate: { width_m: 15, depth_m: 12 }, rooms: [], walls: [], stairs: [] })),
      facade: { balconies: true, balcony_depth_m: 0, railing_height_m: 1.1, window_pattern: "punched", material: "wood" }
    };
  }

  if (variant === "high_rise") {
    return {
      building: { type: "residential_tower", stories: 7, totalHeight_m: 22.4, footprint: { width_m: 20, depth_m: 15 }, construction_type: "Concrete", roof_type: "flat", footprint_shape: "high_rise" },
      levels: Array.from({ length: 7 }, (_, i) => ({ level: i, name: i === 0 ? "Ground Floor" : `Level ${i}`, height_m: 3.2, floorplate: { width_m: 20, depth_m: 15 }, rooms: [], walls: [], stairs: [] })),
      facade: { balconies: true, balcony_depth_m: 1.5, railing_height_m: 1.1, window_pattern: "strip", material: "white_render" }
    };
  }

  if (variant === "office_tower") {
    return {
      ...DEMO_BUILDING_DEFINITION,
      building: {
        ...DEMO_BUILDING_DEFINITION.building,
        type: "office_tower",
        stories: 12,
        totalHeight_m: 12 * 3.8,
        footprint: { width_m: 40, depth_m: 24 },
      },
      levels: Array.from({ length: 12 }, (_, i) => ({
        level: i,
        name: i === 0 ? "Lobby" : i === 11 ? "Sky Lounge" : `Floor ${i + 1}`,
        height_m: 3.8,
        floorplate: { width_m: 40, depth_m: 24 },
        rooms: [
          {
            id: `ot_l${i}_open`,
            name: i === 0 ? "Lobby" : "Open Plan Office",
            type: i === 0 ? "lobby" : "office",
            height_m: 3.8,
            polygon: [
              { x: 0.5, y: 0.5 }, { x: 39.5, y: 0.5 },
              { x: 39.5, y: 23.5 }, { x: 0.5, y: 23.5 },
            ],
          },
        ],
        walls: [
          { id: `ot_l${i}_front`,  start: { x: 0, y: 0  }, end: { x: 40, y: 0  }, thickness_m: 0.25, type: "exterior" as WallType, material: "glass", openings: Array.from({ length: 6 }, (_, j) => ({ id: `ot_fw${j}`, type: "window" as const, offset_m: 2 + j * 6, width_m: 4, height_m: 3.2, sill_m: 0.3 })) },
          { id: `ot_l${i}_right`,  start: { x: 40, y: 0 }, end: { x: 40, y: 24 }, thickness_m: 0.25, type: "exterior" as WallType, material: "glass", openings: Array.from({ length: 3 }, (_, j) => ({ id: `ot_rw${j}`, type: "window" as const, offset_m: 2 + j * 7, width_m: 5, height_m: 3.2, sill_m: 0.3 })) },
          { id: `ot_l${i}_rear`,   start: { x: 40, y: 24}, end: { x: 0, y: 24  }, thickness_m: 0.25, type: "exterior" as WallType, material: "glass", openings: Array.from({ length: 6 }, (_, j) => ({ id: `ot_bw${j}`, type: "window" as const, offset_m: 2 + j * 6, width_m: 4, height_m: 3.2, sill_m: 0.3 })) },
          { id: `ot_l${i}_left`,   start: { x: 0, y: 24 }, end: { x: 0, y: 0   }, thickness_m: 0.25, type: "exterior" as WallType, material: "glass", openings: Array.from({ length: 3 }, (_, j) => ({ id: `ot_lw${j}`, type: "window" as const, offset_m: 2 + j * 7, width_m: 5, height_m: 3.2, sill_m: 0.3 })) },
        ],
        stairs: [{ id: `ot_l${i}_stair`, position: { x: 34, y: 10 }, width_m: 2, depth_m: 4, direction: "both" as const }],
      })),
      facade: { balconies: false, balcony_depth_m: 0, railing_height_m: 1.1, window_pattern: "strip", material: "glass_curtain" },
    };
  }

  if (variant === "mixed_use") {
    return {
      ...DEMO_BUILDING_DEFINITION,
      building: {
        ...DEMO_BUILDING_DEFINITION.building,
        type: "mixed_use",
        stories: 9,
        totalHeight_m: 9 * 3.5,
        footprint: { width_m: 32, depth_m: 20 },
      },
      levels: Array.from({ length: 9 }, (_, i) => ({
        level: i,
        name: i === 0 ? "Retail / Ground" : i <= 2 ? `Commercial Floor ${i}` : `Residential Floor ${i - 2}`,
        height_m: 3.5,
        floorplate: { width_m: 32, depth_m: 20 },
        rooms: [
          {
            id: `mu_l${i}_room`,
            name: i <= 2 ? "Commercial Space" : "Apartment Unit",
            type: i === 0 ? "retail" : i <= 2 ? "office" : "living",
            height_m: 3.5,
            polygon: [
              { x: 1, y: 1 }, { x: 31, y: 1 },
              { x: 31, y: 19 }, { x: 1, y: 19 },
            ],
          },
        ],
        walls: [
          { id: `mu_l${i}_front`, start: { x: 0, y: 0 }, end: { x: 32, y: 0 }, thickness_m: 0.25, type: "exterior" as WallType, material: "brick", openings: Array.from({ length: 4 }, (_, j) => ({ id: `mu_fw${j}`, type: "window" as const, offset_m: 3 + j * 7, width_m: 3, height_m: 2.2, sill_m: 0.6 })) },
          { id: `mu_l${i}_right`, start: { x: 32, y: 0 }, end: { x: 32, y: 20 }, thickness_m: 0.25, type: "exterior" as WallType, material: "brick", openings: Array.from({ length: 2 }, (_, j) => ({ id: `mu_rw${j}`, type: "window" as const, offset_m: 3 + j * 8, width_m: 3, height_m: 2.2, sill_m: 0.6 })) },
          { id: `mu_l${i}_rear`, start: { x: 32, y: 20 }, end: { x: 0, y: 20 }, thickness_m: 0.25, type: "exterior" as WallType, material: "brick", openings: Array.from({ length: 4 }, (_, j) => ({ id: `mu_bw${j}`, type: "window" as const, offset_m: 3 + j * 7, width_m: 3, height_m: 2.2, sill_m: 0.6 })) },
          { id: `mu_l${i}_left`, start: { x: 0, y: 20 }, end: { x: 0, y: 0 }, thickness_m: 0.25, type: "exterior" as WallType, material: "brick", openings: Array.from({ length: 2 }, (_, j) => ({ id: `mu_lw${j}`, type: "window" as const, offset_m: 3 + j * 8, width_m: 3, height_m: 2.2, sill_m: 0.6 })) },
        ],
        stairs: [{ id: `mu_l${i}_stair`, position: { x: 26, y: 10 }, width_m: 2.2, depth_m: 4.5, direction: "both" as const }],
      })),
      facade: { balconies: true, balcony_depth_m: 1.5, railing_height_m: 1.1, window_pattern: "punched", material: "brick" },
    };
  }

  return DEMO_BUILDING_DEFINITION;
}
