import type { BuildingDefinition } from '../../types/building';

export function isTwinTowerBuilding(definition?: BuildingDefinition | null): boolean {
  if (!definition || !definition.building) return false;
  const shape = definition.building.footprint_shape;
  if (shape === 'twin_tower') return true;
  if (!definition.building.footprint) return false;
  const { width_m, depth_m } = definition.building.footprint;
  return (
    definition.building.type === 'residential_tower' &&
    width_m >= 28 &&
    width_m <= 34 &&
    depth_m >= 10 &&
    depth_m <= 14
  );
}
