import { Html, OrbitControls, Grid } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import * as THREE from "three";

export interface Building3DParams {
  width: number;
  depth: number;
  floorHeight: number;
  totalFloors: number;
  baseColor: string;
  steelTons?: number;
  concreteCY?: number;
  curtainWallSF?: number;
  constructionType?: string;
  lateralSystem?: string;
}

interface Props {
  params: Building3DParams;
  selectedFloor: number | null;
  onFloorClick: (floorIndex: number) => void;
}

const selectedColor = "#F5C518";
const hoverColor = "#F8D84A";

function FloorMesh({
  floorIndex,
  params,
  selectedFloor,
  hoveredFloor,
  onFloorClick,
  onHover,
}: Props & {
  floorIndex: number;
  hoveredFloor: number | null;
  onHover: (floorIndex: number | null) => void;
}) {
  const isSelected = selectedFloor === floorIndex;
  const isHovered = hoveredFloor === floorIndex;
  const y = floorIndex * params.floorHeight + params.floorHeight / 2;
  const materialColor = isSelected
    ? selectedColor
    : isHovered
      ? hoverColor
      : params.baseColor;

  return (
    <group>
      <mesh
        position={[0, y, 0]}
        castShadow
        receiveShadow
        onClick={(event) => {
          event.stopPropagation();
          onFloorClick(floorIndex);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
          onHover(floorIndex);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          onHover(null);
        }}
      >
        <boxGeometry args={[params.width, params.floorHeight * 0.86, params.depth]} />
        <meshStandardMaterial
          color={materialColor}
          opacity={isSelected ? 0.98 : 0.82}
          roughness={0.48}
          metalness={0.12}
          transparent
        />
      </mesh>
      <lineSegments position={[0, y, 0]}>
        <edgesGeometry
          args={[
            new THREE.BoxGeometry(
              params.width,
              params.floorHeight * 0.86,
              params.depth,
            ),
          ]}
        />
        <lineBasicMaterial color={isSelected ? "#111827" : "#64748b"} linewidth={1} />
      </lineSegments>
      <Html
        position={[
          params.width / 2 + 1.25,
          floorIndex * params.floorHeight + params.floorHeight,
          0,
        ]}
        center
        distanceFactor={12}
        occlude
      >
        <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-stone-700 shadow-sm border border-stone-200 whitespace-nowrap">
          Floor {floorIndex + 1}
        </span>
      </Html>
    </group>
  );
}

function BuildingScene({ params, selectedFloor, onFloorClick }: Props) {
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const floors = useMemo(
    () => Array.from({ length: params.totalFloors }, (_, index) => index),
    [params.totalFloors],
  );
  const totalHeight = params.totalFloors * params.floorHeight;

  return (
    <>
      <ambientLight intensity={0.62} />
      <directionalLight
        position={[params.width, totalHeight + 18, params.depth]}
        intensity={1.1}
        castShadow
      />
      <pointLight position={[-params.width, totalHeight, -params.depth]} intensity={0.35} />
      <group position={[0, 0, 0]}>
        {floors.map((floorIndex) => (
          <FloorMesh
            key={floorIndex}
            floorIndex={floorIndex}
            params={params}
            selectedFloor={selectedFloor}
            hoveredFloor={hoveredFloor}
            onFloorClick={onFloorClick}
            onHover={setHoveredFloor}
          />
        ))}
      </group>

      <mesh position={[0, -0.08, 0]} receiveShadow>
        <boxGeometry args={[params.width + 2, 0.16, params.depth + 2]} />
        <meshStandardMaterial color="#d6d3d1" roughness={0.8} />
      </mesh>

      <Html position={[0, totalHeight + 2.25, 0]} center distanceFactor={14}>
        <div className="rounded-xl border border-stone-200 bg-white/95 px-3 py-2 text-center shadow-sm">
          <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">
            {params.constructionType ?? "Parametric Model"}
          </p>
          <p className="text-[11px] font-black text-stone-900">
            {params.totalFloors} floors · {Math.round(totalHeight)}m total height
          </p>
        </div>
      </Html>

      <Html position={[-params.width / 2, totalHeight / 2, -params.depth / 2 - 1.5]} center>
        <span className="rounded-lg bg-stone-900/85 px-2 py-1 text-[10px] font-bold text-white">
          {Math.round(params.width)}m × {Math.round(params.depth)}m footprint
        </span>
      </Html>

      <Grid
        args={[Math.max(params.width, params.depth) * 3, Math.max(params.width, params.depth) * 3]}
        cellSize={2}
        sectionSize={10}
        fadeDistance={80}
        infiniteGrid
        position={[0, -0.1, 0]}
      />
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={Math.max(8, params.width * 0.35)}
        maxDistance={Math.max(80, totalHeight * 3)}
        target={[0, totalHeight / 2, 0]}
      />
    </>
  );
}

export default function BuildingModel3D({
  params,
  selectedFloor,
  onFloorClick,
}: Props) {
  const totalHeight = params.totalFloors * params.floorHeight;
  const cameraDistance = Math.max(params.width, params.depth, totalHeight) * 1.6;

  return (
    <Canvas
      shadows
      camera={{
        position: [cameraDistance, totalHeight * 0.8, cameraDistance],
        fov: 48,
      }}
      className="rounded-2xl"
    >
      <color attach="background" args={["#f8fafc"]} />
      <BuildingScene
        params={params}
        selectedFloor={selectedFloor}
        onFloorClick={onFloorClick}
      />
    </Canvas>
  );
}
