import { useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import type { BuildingDefinition } from '../../types/building';
import { ViewerControls } from './ViewerControls';
import { SceneLighting } from './SceneLighting';
import { SceneEnvironment } from './SceneEnvironment';
import {
  BuildingModel,
} from './BuildingModel';
import { TwinTowerModel, TWIN_TOWER_CAMERA } from './TwinTowerModel';
import { VillaModel } from './VillaModel';
import { AFrameModel } from './AFrameModel';
import { HighRiseModel } from './HighRiseModel';
import { isTwinTowerBuilding, isVillaBuilding, isAFrameBuilding, isHighRiseBuilding } from './buildingProfile';
import { CameraRig } from './CameraRig';
import {
  computeCameraPreset,
  DEFAULT_VIEW,
  type CameraView,
} from './cameraPresets';
import { useViewerState } from './useViewerState';
import { InspectorPanel } from './InspectorPanel';

interface Building3DViewerProps {
  buildingDefinition: BuildingDefinition;
  streamingHint?: {
    isStreaming: boolean;
    currentHeightM: number;
    totalHeightM: number;
  };
}

export function Building3DViewer({ buildingDefinition, streamingHint }: Building3DViewerProps) {
  const [isDayMode, setIsDayMode] = useState(true);
  const [activeView, setActiveView] = useState<CameraView>(DEFAULT_VIEW);
  const [autoRotate, setAutoRotate] = useState(true);
  
  const viewerState = useViewerState();

  const isTwinTower = isTwinTowerBuilding(buildingDefinition);
  const isVilla = isVillaBuilding(buildingDefinition);
  const isAFrame = isAFrameBuilding(buildingDefinition);
  const isHighRise = isHighRiseBuilding(buildingDefinition);

  const { cameraPos, orbitTarget } = useMemo(() => {
    // If in floor-plan mode, override the preset logic
    const view = viewerState.mode === 'floor-plan' ? 'floor-plan' : activeView;
    const preset = computeCameraPreset(view, buildingDefinition, isTwinTower);
    return {
      cameraPos: preset.position,
      orbitTarget: preset.target,
    };
  }, [buildingDefinition, isTwinTower, activeView, viewerState.mode]);

  // Sync mode changes with view/rotate
  useEffect(() => {
    if (viewerState.mode === 'floor-plan') {
      setAutoRotate(false);
    }
  }, [viewerState.mode]);

  return (
    <div className={`relative w-full h-full transition-colors duration-300 ${isDayMode ? 'bg-stone-100' : 'bg-stone-950'}`}>
      <ViewerControls
        buildingDefinition={buildingDefinition}
        isDayMode={isDayMode}
        onToggleDayNight={() => setIsDayMode(!isDayMode)}
        activeView={viewerState.mode === 'floor-plan' ? 'floor-plan' : activeView}
        onViewChange={(view) => {
          if (viewerState.mode === 'floor-plan' && view !== 'floor-plan') {
             viewerState.setMode('exterior');
          }
          setActiveView(view);
        }}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate((prev) => !prev)}
        viewerState={viewerState}
      />
      
      <InspectorPanel viewerState={viewerState} />

      <Canvas
        shadows
        frameloop="demand"
        camera={{
          position: cameraPos,
          fov: isTwinTower ? TWIN_TOWER_CAMERA.fov : 40,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isDayMode ? 1.3 : 0.85,
        }}
        onPointerMissed={() => viewerState.setSelectedElement(null)}
      >
        <color attach="background" args={[isDayMode ? '#f3f4f6' : '#0d0f14']} />

        <SceneLighting
          isDayMode={isDayMode}
          buildingDefinition={buildingDefinition}
        />

        {isTwinTower ? (
          <TwinTowerModel buildingDefinition={buildingDefinition} isDayMode={isDayMode} viewerState={viewerState} />
        ) : isVilla ? (
          <VillaModel buildingDefinition={buildingDefinition} isDayMode={isDayMode} viewerState={viewerState} />
        ) : isAFrame ? (
          <AFrameModel buildingDefinition={buildingDefinition} isDayMode={isDayMode} viewerState={viewerState} />
        ) : isHighRise ? (
          <HighRiseModel buildingDefinition={buildingDefinition} isDayMode={isDayMode} viewerState={viewerState} />
        ) : (
          <>
            <BuildingModel
              buildingDefinition={buildingDefinition}
              isDayMode={isDayMode}
              viewerState={viewerState}
            />
            <SceneEnvironment
              isDayMode={isDayMode}
              buildingDefinition={buildingDefinition}
              viewerState={viewerState}
            />
          </>
        )}

        <CameraRig
          activeView={viewerState.mode === 'floor-plan' ? 'floor-plan' : activeView}
          autoRotate={autoRotate}
          buildingDefinition={buildingDefinition}
          twinTower={isTwinTower}
          orbitTarget={orbitTarget}
          streamingHint={streamingHint}
        />
      </Canvas>
    </div>
  );
}
