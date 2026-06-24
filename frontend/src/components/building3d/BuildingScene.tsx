import { Canvas, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Grid,
  OrbitControls,
  PerformanceMonitor,
} from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useMemo } from "react";
import type { ReactElement } from "react";
import * as THREE from "three";
import type { BuildingDefinition } from "../../types/building";
import { useBuildingStore } from "../../stores/buildingStore";
import type { SnapshotPreset } from "./snapshotPresets";
import { PresentationScene } from "./PresentationScene";
import { AnalyticalScene } from "./AnalyticalScene";
import { buildPresentationSpec } from "./buildPresentationModel";
import LevelGroup from "./LevelGroup";
import RoofMesh from "./RoofMesh";
import SiteContext from "./SiteContext";
import {
  canvasDpr,
  environmentPreset,
  isRepresentativeMiddleFloor,
  lodBand,
  postFxSettings,
  shadowMapSize,
} from "./qualityUtils";

interface Props {
  definition: BuildingDefinition;
}

function levelElevations(definition: BuildingDefinition): number[] {
  const elevations: number[] = [];
  let current = 0;
  for (const level of definition.levels) {
    elevations.push(current);
    current += level.height_m;
  }
  return elevations;
}

function SceneContent({ definition }: Props) {
  const viewMode = useBuildingStore((state) => state.viewMode);
  const activeLevel = useBuildingStore((state) => state.activeLevel);
  const sectionPlaneY = useBuildingStore((state) => state.sectionPlaneY);
  const qualityTier = useBuildingStore((state) => state.qualityTier);
  const autoQuality = useBuildingStore((state) => state.autoQuality);
  const downgradeQuality = useBuildingStore((state) => state.downgradeQuality);
  const elevations = useMemo(() => levelElevations(definition), [definition]);
  const totalHeight = definition.building.totalHeight_m;
  const footprint = definition.building.footprint;
  const maxDim = Math.max(footprint.width_m, footprint.depth_m, totalHeight);
  const fx = postFxSettings(qualityTier);
  const envPreset = environmentPreset(definition.building.type);

  const clipPlane = useMemo(() => {
    if (viewMode !== "section") return null;
    return new THREE.Plane(new THREE.Vector3(0, -1, 0), sectionPlaneY);
  }, [viewMode, sectionPlaneY]);

  const { gl, invalidate } = useThree();
  
  useEffect(() => {
    gl.localClippingEnabled = viewMode === "section";
  }, [gl, viewMode]);

  // Trigger re-render on demand when key state changes
  useEffect(() => {
    invalidate();
  }, [viewMode, activeLevel, sectionPlaneY, qualityTier, invalidate]);

  const presentationSpec = useMemo(() => buildPresentationSpec(definition), [definition]);

  const exteriorTargetOffsetX = footprint.width_m * 0.12;
  const target: [number, number, number] =
    viewMode === "interior" || viewMode === "section"
      ? [
          footprint.width_m / 2,
          elevations[activeLevel] + definition.levels[activeLevel]?.height_m * 0.55,
          footprint.depth_m / 2,
        ]
      : [
          footprint.width_m / 2 - exteriorTargetOffsetX,
          totalHeight / 2,
          footprint.depth_m / 2,
        ];

  const postEffects = useMemo(() => {
    const nodes: ReactElement[] = [];
    if (fx.ao) {
      nodes.push(
        <N8AO
          key="n8ao"
          aoRadius={2}
          intensity={1.4}
          aoSamples={qualityTier === "high" ? 8 : 6}
          denoiseSamples={4}
          quality={fx.aoQuality}
        />,
      );
    }
    if (fx.bloom) {
      nodes.push(
        <Bloom
          key="bloom"
          luminanceThreshold={fx.bloomThreshold ?? 1.2}
          mipmapBlur
          intensity={fx.bloomIntensity ?? 0.3}
          radius={0.45}
        />,
      );
    }
    if (fx.smaa) nodes.push(<SMAA key="smaa" />);
    if (fx.vignette) {
      nodes.push(<Vignette key="vignette" eskil={false} offset={0.12} darkness={0.55} />);
    }
    nodes.push(<ToneMapping key="tone" mode={ToneMappingMode.ACES_FILMIC} />);
    return nodes;
  }, [fx, qualityTier]);

  return (
    <>
      {autoQuality && (
        <PerformanceMonitor
          bounds={() => [30, 58]}
          onDecline={() => downgradeQuality()}
          flipflops={3}
        />
      )}

      <fog attach="fog" args={["#e8eef4", maxDim * 2, maxDim * 8]} />
      <Environment preset={envPreset} background backgroundBlurriness={0.55} />
      <hemisphereLight intensity={0.45} color="#d8e8f8" groundColor="#7a9060" />
      <ambientLight intensity={0.18} />
      <directionalLight
        position={[footprint.width_m * 1.2, totalHeight + 40, footprint.depth_m * 0.8]}
        intensity={2.1}
        color="#fff4e6"
        castShadow
        shadow-mapSize={[shadowMapSize(qualityTier), shadowMapSize(qualityTier)]}
        shadow-camera-left={-footprint.width_m * 2}
        shadow-camera-right={footprint.width_m * 2}
        shadow-camera-top={footprint.depth_m * 2}
        shadow-camera-bottom={-footprint.depth_m * 2}
        shadow-camera-near={0.5}
        shadow-camera-far={totalHeight + 120}
      />
      <directionalLight
        position={[-footprint.width_m, totalHeight * 0.4, -footprint.depth_m]}
        intensity={0.5}
        color="#dceeff"
      />

      {viewMode === "exterior" || viewMode === "exploded" ? (
        <PresentationScene 
          spec={presentationSpec} 
          definition={definition} 
          viewMode={viewMode} 
        />
      ) : (
        <AnalyticalScene 
          definition={definition} 
          viewMode={viewMode} 
          activeLevel={activeLevel} 
          clipPlane={clipPlane} 
          qualityTier={qualityTier} 
        />
      )}

      {viewMode === "section" && (
        <mesh position={[footprint.width_m / 2, sectionPlaneY, footprint.depth_m / 2]}>
          <boxGeometry args={[footprint.width_m + 0.5, 0.02, footprint.depth_m + 0.5]} />
          <meshStandardMaterial color="#F5C518" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      )}

      <ContactShadows
        position={[footprint.width_m / 2, -0.23, footprint.depth_m / 2]}
        opacity={qualityTier === "low" ? 0.45 : 0.6}
        scale={Math.max(footprint.width_m, footprint.depth_m) * 3}
        blur={2.5}
        far={50}
        resolution={qualityTier === "high" ? 768 : 512}
        frames={1}
      />

      {qualityTier !== "high" && (
        <Grid
          args={[maxDim * 2.5, maxDim * 2.5]}
          cellSize={2}
          sectionSize={10}
          fadeDistance={maxDim * 3}
          infiniteGrid
          position={[footprint.width_m / 2, -0.18, footprint.depth_m / 2]}
        />
      )}

      <OrbitControls
        makeDefault
        target={target}
        minDistance={Math.max(maxDim * 0.18, 8)}
        maxDistance={Math.max(maxDim * 3, 90)}
        enableDamping
        onChange={() => invalidate()}
      />

      <EffectComposer multisampling={qualityTier === "high" ? 4 : 0}>
        {postEffects}
      </EffectComposer>
    </>
  );
}

export default function BuildingScene({ definition }: Props) {
  const qualityTier = useBuildingStore((state) => state.qualityTier);
  const totalHeight = definition.building.totalHeight_m;
  const { width_m, depth_m } = definition.building.footprint;
  const distance = Math.max(width_m, depth_m, totalHeight) * 1.55;

  return (
    <Canvas
      frameloop="demand"
      shadows="percentage"
      dpr={canvasDpr(qualityTier)}
      camera={{
        position: [width_m + distance, Math.max(totalHeight * 0.75, 18), depth_m + distance],
        fov: 46,
      }}
      className="rounded-2xl"
      gl={{ antialias: qualityTier !== "low" }}
    >
      <color attach="background" args={["#e8eef4"]} />
      <SceneContent definition={definition} />
    </Canvas>
  );
}

interface SnapshotSceneProps {
  definition: BuildingDefinition;
  preset: SnapshotPreset;
}

/** Lightweight scene for offscreen snapshot capture — no store, no postFX, no orbit controls. */
export function SnapshotSceneContent({ definition, preset }: SnapshotSceneProps) {
  const elevations = useMemo(() => levelElevations(definition), [definition]);
  const totalHeight = definition.building.totalHeight_m;
  const footprint = definition.building.footprint;
  const maxDim = Math.max(footprint.width_m, footprint.depth_m, totalHeight);
  const qualityTier = "high" as const;
  const lod = lodBand(definition, qualityTier);
  const envPreset = environmentPreset(definition.building.type);
  const viewMode = preset.viewMode;
  const activeLevel = preset.activeLevel;
  const sectionPlaneY = preset.sectionPlaneY;
  const presentation = preset.presentation;

  const clipPlane = useMemo(() => {
    if (viewMode !== "section") return null;
    return new THREE.Plane(new THREE.Vector3(0, -1, 0), sectionPlaneY);
  }, [viewMode, sectionPlaneY]);

  const { gl, scene } = useThree();
  useEffect(() => {
    gl.localClippingEnabled = viewMode === "section";
  }, [gl, viewMode]);

  useEffect(() => {
    const bg =
      preset.backgroundColor ??
      (presentation === "studio_exterior" ? "#f4f6f8" : "#e8eef4");
    const color = new THREE.Color(bg);
    scene.background = color;
    gl.setClearColor(color);
  }, [gl, scene, preset.backgroundColor, presentation]);

  const buildingCenter = useMemo(
    () => new THREE.Vector3(footprint.width_m / 2, totalHeight / 2, footprint.depth_m / 2),
    [footprint.width_m, footprint.depth_m, totalHeight],
  );

  const useStudioBg = presentation === "studio_exterior";
  const useDollhouseLighting = presentation === "dollhouse";
  const useEnvironment =
    !useStudioBg && presentation !== "dollhouse" && presentation !== "aerial";

  return (
    <>
      {!useStudioBg && presentation !== "aerial" && (
        <fog attach="fog" args={["#e8eef4", maxDim * 1.4, maxDim * 4]} />
      )}
      {useEnvironment && (
        <Environment preset={envPreset} background={false} backgroundBlurriness={0.2} />
      )}
      <hemisphereLight
        intensity={useDollhouseLighting ? 0.55 : useStudioBg ? 0.5 : 0.45}
        color={useDollhouseLighting ? "#fff8f0" : "#d8e8f8"}
        groundColor={useDollhouseLighting ? "#c4a574" : "#7a9060"}
      />
      <ambientLight intensity={useStudioBg ? 0.28 : 0.18} />
      <directionalLight
        position={[footprint.width_m * 1.2, totalHeight + 40, footprint.depth_m * 0.8]}
        intensity={useStudioBg ? 2.4 : 2.1}
        color="#fff4e6"
        castShadow
        shadow-mapSize={[shadowMapSize(qualityTier), shadowMapSize(qualityTier)]}
        shadow-camera-left={-footprint.width_m * 2}
        shadow-camera-right={footprint.width_m * 2}
        shadow-camera-top={footprint.depth_m * 2}
        shadow-camera-bottom={-footprint.depth_m * 2}
        shadow-camera-near={0.5}
        shadow-camera-far={totalHeight + 120}
      />
      <directionalLight
        position={[-footprint.width_m, totalHeight * 0.4, -footprint.depth_m]}
        intensity={useStudioBg ? 0.45 : 0.5}
        color="#dceeff"
      />

      <SiteContext definition={definition} showGrid={false} minimal={presentation === "aerial" || presentation === "studio_exterior"} />

      <group>
        {definition.levels.map((level, index) => {
          const explodedOffset =
            viewMode === "exploded" ? index * Math.max(level.height_m * 0.45, 1.8) : 0;
          const elevation = elevations[index] + explodedOffset;
          const distanceFromActive = Math.abs(index - activeLevel);
          const representative = isRepresentativeMiddleFloor(definition, index);
          const simplified =
            viewMode === "exterior" &&
            (distanceFromActive > lod || (representative && distanceFromActive > 0));

          return (
            <LevelGroup
              key={level.level}
              level={level}
              elevation={elevation}
              facade={definition.facade}
              buildingType={definition.building.type}
              viewMode={viewMode}
              activeLevel={activeLevel}
              simplified={simplified}
              clipPlane={clipPlane}
              buildingCenter={buildingCenter}
              heroGlass={false}
              hideLabels={true}
              qualityTierOverride={qualityTier}
            />
          );
        })}
        {viewMode === "exterior" && <RoofMesh definition={definition} />}
      </group>

      {viewMode === "section" && (
        <mesh position={[footprint.width_m / 2, sectionPlaneY, footprint.depth_m / 2]}>
          <boxGeometry args={[footprint.width_m + 0.5, 0.02, footprint.depth_m + 0.5]} />
          <meshStandardMaterial color="#F5C518" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      )}

      <ContactShadows
        position={[footprint.width_m / 2, -0.23, footprint.depth_m / 2]}
        opacity={useStudioBg ? 0.7 : 0.6}
        scale={Math.max(footprint.width_m, footprint.depth_m) * (useStudioBg ? 3.2 : 2.6)}
        blur={useStudioBg ? 3.5 : 2.8}
        far={useStudioBg ? 60 : 50}
        resolution={768}
        frames={1}
      />
    </>
  );
}
