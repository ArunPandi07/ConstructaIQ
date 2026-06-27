import type { BuildingDefinition } from '../../types/building';
import { TWIN_TOWER_CAMERA } from './TwinTowerModel';

export type CameraView = 'front' | 'angle' | 'side' | 'top';

export const DEFAULT_VIEW: CameraView = 'angle';

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
}

function buildingBounds(buildingDefinition: BuildingDefinition, twinTower: boolean) {
  if (twinTower) {
    return {
      dist: 40,
      target: TWIN_TOWER_CAMERA.target,
      height: 24,
    };
  }

  const h = buildingDefinition.building.totalHeight_m;
  const w = buildingDefinition.building.footprint.width_m;
  const d = buildingDefinition.building.footprint.depth_m;
  const maxDim = Math.max(w, d, h);
  const dist = maxDim * 1.6;

  return {
    dist,
    target: [0, h * 0.4, 0] as [number, number, number],
    height: h,
  };
}

export function computeCameraPreset(
  view: CameraView,
  buildingDefinition: BuildingDefinition,
  twinTower: boolean,
): CameraPreset {
  const { dist, target, height } = buildingBounds(buildingDefinition, twinTower);
  const [tx, ty, tz] = target;
  const eyeY = twinTower ? ty * 0.55 : height * 0.35;

  switch (view) {
    case 'front':
      return {
        position: [tx, eyeY, tz + dist],
        target,
      };
    case 'side':
      return {
        position: [tx + dist, eyeY, tz],
        target,
      };
    case 'top':
      return {
        position: [tx, dist * 1.4, tz + 0.01],
        target,
      };
    case 'angle':
    default:
      if (twinTower) {
        return {
          position: TWIN_TOWER_CAMERA.position,
          target: TWIN_TOWER_CAMERA.target,
        };
      }
      return {
        position: [dist * 0.8, height * 0.6, dist * 0.9],
        target,
      };
  }
}
