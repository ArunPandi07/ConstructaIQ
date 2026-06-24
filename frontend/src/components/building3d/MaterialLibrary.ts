import * as THREE from "three";
import {
  getBrickCladdingMap,
  getConcreteNormalMap,
  getConcreteRoughnessMap,
  getGrassMap,
  getPavingMap,
  getRoadMap,
  getSteelBrushedNormalMap,
  getTileCladdingMap,
  getWoodFloorMap,
} from "./proceduralTextures";

export type MaterialKey =
  | "concrete"
  | "glass"
  | "steel"
  | "wood"
  | "brick"
  | "railing"
  | "partition"
  | "floor"
  | "roof"
  | "ground"
  | "highlight"
  | "selected"
  | "asphalt"
  | "road"
  | "sidewalk"
  | "curtain_wall"
  | "context"
  | "warehouse_metal"
  | "emissive_glow"
  | "tile_cladding"
  | "brick_cladding"
  | "grass_patch"
  | "wood_floor"
  | "slab_band"
  | "wall_cap"
  | "column";

const cache = new Map<MaterialKey, THREE.MeshStandardMaterial>();

function createMaterials(): void {
  // Concrete with procedural normal map
  const concreteNormalMap = getConcreteNormalMap();
  const concreteRoughnessMap = getConcreteRoughnessMap();
  
  cache.set(
    "concrete",
    new THREE.MeshStandardMaterial({
      color: "#dfddd8",
      roughness: 0.85,
      metalness: 0.02,
      normalMap: concreteNormalMap,
      normalScale: new THREE.Vector2(0.3, 0.3),
      roughnessMap: concreteRoughnessMap,
    })
  );

  // Glass - kept simple for now (WindowMesh will use MeshPhysicalMaterial separately)
  cache.set(
    "glass",
    new THREE.MeshStandardMaterial({
      color: "#88ccff",
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.3,
      envMapIntensity: 1.0,
    })
  );

  // Steel with brushed normal map
  const steelNormalMap = getSteelBrushedNormalMap();
  cache.set(
    "steel",
    new THREE.MeshStandardMaterial({
      color: "#4a4a4a",
      roughness: 0.25,
      metalness: 0.95,
      normalMap: steelNormalMap,
      normalScale: new THREE.Vector2(0.2, 0.2),
    })
  );

  // Wood
  cache.set(
    "wood",
    new THREE.MeshStandardMaterial({
      color: "#B8956A",
      roughness: 0.72,
      metalness: 0,
    })
  );

  // Brick
  cache.set(
    "brick",
    new THREE.MeshStandardMaterial({
      color: "#C4725A",
      roughness: 0.92,
      metalness: 0,
    })
  );

  // Railing - polished metal
  cache.set(
    "railing",
    new THREE.MeshStandardMaterial({
      color: "#374151",
      roughness: 0.3,
      metalness: 0.9,
    })
  );

  // Partition
  cache.set(
    "partition",
    new THREE.MeshStandardMaterial({
      color: "#F3F4F6",
      roughness: 0.82,
      metalness: 0,
    })
  );

  // Floor with procedural roughness
  cache.set(
    "floor",
    new THREE.MeshStandardMaterial({
      color: "#e8e4dc",
      roughness: 0.9,
      metalness: 0.02,
      roughnessMap: concreteRoughnessMap,
    })
  );

  // Roof
  cache.set(
    "roof",
    new THREE.MeshStandardMaterial({
      color: "#6b6b6b",
      roughness: 0.8,
      metalness: 0.3,
    })
  );

  // Ground plane (grass-like)
  cache.set(
    "ground",
    new THREE.MeshStandardMaterial({
      color: "#a8b5a0",
      roughness: 0.95,
      metalness: 0,
    })
  );

  // Highlight
  cache.set(
    "highlight",
    new THREE.MeshStandardMaterial({
      color: "#F5C518",
      roughness: 0.45,
      metalness: 0.05,
    })
  );

  // Selected
  cache.set(
    "selected",
    new THREE.MeshStandardMaterial({
      color: "#F5C518",
      roughness: 0.3,
      metalness: 0.05,
      transparent: true,
      opacity: 0.48,
    })
  );

  cache.set(
    "asphalt",
    new THREE.MeshStandardMaterial({
      color: "#2a2a2a",
      roughness: 0.95,
      metalness: 0,
    })
  );

  const roadMap = getRoadMap();
  cache.set(
    "road",
    new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.95,
      metalness: 0,
      map: roadMap,
    })
  );

  const pavingMap = getPavingMap();
  cache.set(
    "sidewalk",
    new THREE.MeshStandardMaterial({
      color: "#c9c4bc",
      map: pavingMap,
      roughness: 0.88,
      metalness: 0.02,
      normalMap: concreteNormalMap,
      normalScale: new THREE.Vector2(0.15, 0.15),
    })
  );

  cache.set(
    "curtain_wall",
    new THREE.MeshStandardMaterial({
      color: "#b8c5d1",
      roughness: 0.35,
      metalness: 0.55,
      normalMap: steelNormalMap,
      normalScale: new THREE.Vector2(0.15, 0.15),
    })
  );

  cache.set(
    "context",
    new THREE.MeshStandardMaterial({
      color: "#9aa3ad",
      roughness: 0.78,
      metalness: 0.12,
    })
  );

  cache.set(
    "warehouse_metal",
    new THREE.MeshStandardMaterial({
      color: "#6b7280",
      roughness: 0.55,
      metalness: 0.7,
      normalMap: steelNormalMap,
      normalScale: new THREE.Vector2(0.25, 0.25),
    })
  );

  cache.set(
    "emissive_glow",
    new THREE.MeshStandardMaterial({
      color: "#ffd9a8",
      emissive: "#ffb347",
      emissiveIntensity: 0.85,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75,
    })
  );

  const tileMap = getTileCladdingMap();
  cache.set(
    "tile_cladding",
    new THREE.MeshStandardMaterial({
      color: "#e2e6ec",
      map: tileMap,
      roughness: 0.72,
      metalness: 0.04,
      normalMap: concreteNormalMap,
      normalScale: new THREE.Vector2(0.12, 0.12),
    })
  );

  const brickMap = getBrickCladdingMap();
  cache.set(
    "brick_cladding",
    new THREE.MeshStandardMaterial({
      color: "#c4725a",
      map: brickMap,
      roughness: 0.88,
      metalness: 0.02,
    })
  );

  const grassMap = getGrassMap();
  cache.set(
    "grass_patch",
    new THREE.MeshStandardMaterial({
      color: "#6b9e5a",
      map: grassMap,
      roughness: 0.95,
      metalness: 0,
    })
  );

  const woodFloorMap = getWoodFloorMap();
  cache.set(
    "wood_floor",
    new THREE.MeshStandardMaterial({
      color: "#a08060",
      map: woodFloorMap,
      roughness: 0.65,
      metalness: 0.02,
    })
  );

  cache.set(
    "slab_band",
    new THREE.MeshStandardMaterial({
      color: "#2a2a2a",
      roughness: 0.85,
      metalness: 0.08,
    })
  );

  cache.set(
    "wall_cap",
    new THREE.MeshStandardMaterial({
      color: "#b8d4e8",
      roughness: 0.55,
      metalness: 0.02,
    })
  );

  cache.set(
    "column",
    new THREE.MeshStandardMaterial({
      color: "#5e5c5a",
      roughness: 0.72,
      metalness: 0.08,
      normalMap: concreteNormalMap,
      normalScale: new THREE.Vector2(0.2, 0.2),
    })
  );
}

let materialsInitialized = false;

export function getMaterial(key: string | null | undefined): THREE.MeshStandardMaterial {
  if (!materialsInitialized) {
    createMaterials();
    materialsInitialized = true;
  }
  
  const resolved = normalizeMaterialKey(key);
  return cache.get(resolved) as THREE.MeshStandardMaterial;
}

export function normalizeMaterialKey(key: string | null | undefined): MaterialKey {
  const normalized = String(key ?? "").toLowerCase();
  if (normalized.includes("glass") || normalized.includes("curtain")) return "glass";
  if (normalized.includes("steel") || normalized.includes("metal")) return "steel";
  if (normalized.includes("wood") || normalized.includes("timber")) return "wood";
  if (normalized.includes("brick") || normalized.includes("masonry")) return "brick";
  if (normalized.includes("rail")) return "railing";
  if (normalized.includes("partition")) return "partition";
  if (normalized.includes("floor")) return "floor";
  if (normalized.includes("roof")) return "roof";
  if (normalized.includes("ground")) return "ground";
  if (normalized.includes("highlight")) return "highlight";
  if (normalized.includes("selected")) return "selected";
  if (normalized.includes("asphalt")) return "asphalt";
  if (normalized.includes("sidewalk")) return "sidewalk";
  if (normalized.includes("curtain")) return "curtain_wall";
  if (normalized.includes("warehouse")) return "warehouse_metal";
  if (normalized.includes("tile")) return "tile_cladding";
  if (normalized.includes("grass")) return "grass_patch";
  if (normalized.includes("wood_floor")) return "wood_floor";
  if (normalized.includes("slab_band")) return "slab_band";
  if (normalized.includes("wall_cap")) return "wall_cap";
  if (normalized.includes("column")) return "column";
  return "concrete";
}

export function claddingMaterialKey(buildingType: string): MaterialKey {
  const t = buildingType.toLowerCase();
  if (t.includes("warehouse") || t.includes("hospital")) return "brick_cladding";
  if (t.includes("office") || t.includes("residential") || t.includes("mixed")) {
    return "tile_cladding";
  }
  return "concrete";
}

export function roomColor(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized.includes("bedroom"))   return "#dbeafe";
  if (normalized.includes("living"))    return "#fef9ec";
  if (normalized.includes("kitchen"))   return "#f0fdf4";
  if (normalized.includes("bathroom") || normalized.includes("toilet")) return "#e0f7fa";
  if (normalized.includes("lobby"))     return "#fdf4ff";
  if (normalized.includes("open"))      return "#eff6ff";
  if (normalized.includes("dining"))    return "#fff7ed";
  if (normalized.includes("clinical")) return "#dbeafe";
  if (normalized.includes("residential")) return "#fef3c7";
  if (normalized.includes("retail")) return "#fae8ff";
  if (normalized.includes("office")) return "#dcfce7";
  if (normalized.includes("core")) return "#e5e7eb";
  if (normalized.includes("warehouse")) return "#f1f5f9";
  return "#f8fafc";
}
