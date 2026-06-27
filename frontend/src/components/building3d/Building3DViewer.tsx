import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import type { BuildingDefinition } from '../../types/building';
import { ViewerControls } from './ViewerControls';
import { SceneLighting } from './SceneLighting';
import { SceneEnvironment } from './SceneEnvironment';
import { BuildingModel } from './BuildingModel';
import { TwinTowerModel, TWIN_TOWER_CAMERA } from './TwinTowerModel';
import { isTwinTowerBuilding } from './buildingProfile';
import { CameraRig } from './CameraRig';
import {
  computeCameraPreset,
  DEFAULT_VIEW,
  type CameraView,
} from './cameraPresets';

interface Building3DViewerProps {
  buildingDefinition: BuildingDefinition;
}

export function Building3DViewer({ buildingDefinition }: Building3DViewerProps) {
  const [isDayMode, setIsDayMode] = useState(true);
  const [activeView, setActiveView] = useState<CameraView>(DEFAULT_VIEW);
  const [autoRotate, setAutoRotate] = useState(false);

  const twinTower = isTwinTowerBuilding(buildingDefinition);

  const { cameraPos, orbitTarget } = useMemo(() => {
    const preset = computeCameraPreset(DEFAULT_VIEW, buildingDefinition, twinTower);
    return {
      cameraPos: preset.position,
      orbitTarget: preset.target,
    };
  }, [buildingDefinition, twinTower]);

  return (
    <div className={`relative w-full h-full transition-colors duration-300 ${isDayMode ? 'bg-stone-100' : 'bg-stone-950'}`}>
      <ViewerControls
        buildingDefinition={buildingDefinition}
        isDayMode={isDayMode}
        onToggleDayNight={() => setIsDayMode(!isDayMode)}
        activeView={activeView}
        onViewChange={setActiveView}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate((prev) => !prev)}
      />

      <Canvas
        shadows
        camera={{
          position: cameraPos,
          fov: twinTower ? TWIN_TOWER_CAMERA.fov : 40,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isDayMode ? 1.3 : 0.85,
        }}
      >
        <color attach="background" args={[isDayMode ? '#f3f4f6' : '#0d0f14']} />

        <SceneLighting
          isDayMode={isDayMode}
          buildingDefinition={buildingDefinition}
        />

        {twinTower ? (
          <TwinTowerModel buildingDefinition={buildingDefinition} isDayMode={isDayMode} />
        ) : (
          <>
            <BuildingModel
              buildingDefinition={buildingDefinition}
              isDayMode={isDayMode}
            />
            <SceneEnvironment
              isDayMode={isDayMode}
              buildingDefinition={buildingDefinition}
            />
          </>
        )}

        <CameraRig
          activeView={activeView}
          autoRotate={autoRotate}
          buildingDefinition={buildingDefinition}
          twinTower={twinTower}
          orbitTarget={orbitTarget}
        />
      </Canvas>
    </div>
  );
}
