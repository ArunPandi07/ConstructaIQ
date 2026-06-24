import { useMemo } from "react";
import * as THREE from "three";
import type { BuildingViewMode, LevelDefinition, QualityTier, RoomDefinition } from "../../types/building";
import { useBuildingStore } from "../../stores/buildingStore";
import { getMaterial, roomColor } from "./MaterialLibrary";
import { polygonShape, roomCentroid } from "./geometryUtils";

interface SlabMeshProps {
  level: LevelDefinition;
  elevation: number;
  visibleRooms?: boolean;
  clipPlane?: THREE.Plane | null;
  viewMode?: BuildingViewMode;
  qualityTier?: QualityTier;
  showFurniture?: boolean;
}

interface RoomSurfaceProps {
  room: RoomDefinition;
  elevation: number;
  clipPlane?: THREE.Plane | null;
  useWoodFloor?: boolean;
}

function RoomSurface({ room, elevation, clipPlane, useWoodFloor = false }: RoomSurfaceProps) {
  const selectedRoom = useBuildingStore((state) => state.selectedRoom);
  const hoveredRoom = useBuildingStore((state) => state.hoveredRoom);
  const setSelectedRoom = useBuildingStore((state) => state.setSelectedRoom);
  const setHoveredRoom = useBuildingStore((state) => state.setHoveredRoom);
  const geometry = useMemo(
    () => new THREE.ShapeGeometry(polygonShape(room.polygon)),
    [room.polygon],
  );
  const isActive = selectedRoom === room.id || hoveredRoom === room.id;

  const material = useMemo(() => {
    if (useWoodFloor && !isActive) {
      const mat = getMaterial("wood_floor").clone();
      if (mat.map) {
        mat.map.repeat.set(4, 4);
        mat.map.needsUpdate = true;
      }
      mat.transparent = true;
      mat.opacity = 0.92;
      mat.side = THREE.DoubleSide;
      if (clipPlane) {
        mat.clippingPlanes = [clipPlane];
        mat.clipShadows = true;
      }
      return mat;
    }
    const mat = new THREE.MeshStandardMaterial({
      color: isActive ? "#F5C518" : roomColor(room.type),
      roughness: 0.72,
      metalness: 0.02,
      transparent: true,
      opacity: isActive ? 0.74 : 0.48,
      side: THREE.DoubleSide,
    });
    if (clipPlane) {
      mat.clippingPlanes = [clipPlane];
      mat.clipShadows = true;
    }
    return mat;
  }, [isActive, room.type, clipPlane, useWoodFloor]);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, elevation + 0.035, 0]}
      receiveShadow
      material={material}
      onClick={(event) => {
        event.stopPropagation();
        setSelectedRoom(selectedRoom === room.id ? null : room.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
        setHoveredRoom(room.id);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
        setHoveredRoom(null);
      }}
    />
  );
}

function SlabEdgeBands({ level, elevation }: { level: LevelDefinition; elevation: number }) {
  const w = level.floorplate.width_m;
  const d = level.floorplate.depth_m;
  const y = elevation - 0.01;
  const bandH = 0.22;
  const bandD = 0.22;
  const mat = getMaterial("slab_band");

  return (
    <group>
      <mesh position={[w / 2, y, -bandD / 2]} receiveShadow material={mat}>
        <boxGeometry args={[w + 0.44, bandH, bandD]} />
      </mesh>
      <mesh position={[w / 2, y, d + bandD / 2]} receiveShadow material={mat}>
        <boxGeometry args={[w + 0.44, bandH, bandD]} />
      </mesh>
      <mesh position={[-bandD / 2, y, d / 2]} receiveShadow material={mat}>
        <boxGeometry args={[bandD, bandH, d + 0.44]} />
      </mesh>
      <mesh position={[w + bandD / 2, y, d / 2]} receiveShadow material={mat}>
        <boxGeometry args={[bandD, bandH, d + 0.44]} />
      </mesh>
    </group>
  );
}

function RoomFurniture({
  room,
  elevation,
  qualityTier = "medium",
}: {
  room: RoomDefinition;
  elevation: number;
  qualityTier?: QualityTier;
}) {
  const [cx, cz] = roomCentroid(room);
  const type = room.type.toLowerCase();
  const simplified = qualityTier === "low";

  const cy = cz;

  if (type.includes("living")) {
    return (
      <group position={[cx, elevation, cy]}>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.45, 0.9]} />
          <primitive object={getMaterial("concrete")} attach="material" />
        </mesh>
        <mesh position={[0.65, 0.22, 0.65]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.45, 1.4]} />
          <primitive object={getMaterial("concrete")} attach="material" />
        </mesh>
        <mesh position={[-0.2, 0.2, 0.8]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.08, 0.5]} />
          <primitive object={getMaterial("wood")} attach="material" />
        </mesh>
        {!simplified && (
          <mesh position={[0, 1.5, -0.45]}>
            <planeGeometry args={[1.2, 0.8]} />
            <meshStandardMaterial color="#e0e0e0" />
          </mesh>
        )}
      </group>
    );
  }

  if (type === "kitchen") {
    return (
      <group position={[cx, elevation, cy]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.9, 0.6]} />
          <primitive object={getMaterial("wood")} attach="material" />
        </mesh>
        <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.45, 0.04, 0.65]} />
          <primitive object={getMaterial("partition")} attach="material" />
        </mesh>
        <mesh position={[0, 2.1, -0.1]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.8, 0.35]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>
    );
  }

  if (type === "bedroom") {
    return (
      <group position={[cx, elevation, cy]}>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.5, 2.0]} />
          <primitive object={getMaterial("partition")} attach="material" />
        </mesh>
        <mesh position={[0, 0.5, -0.9]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.6, 0.1]} />
          <primitive object={getMaterial("wood")} attach="material" />
        </mesh>
        <mesh position={[-1.2, 0.25, -0.8]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.5, 0.4]} />
          <primitive object={getMaterial("wood")} attach="material" />
        </mesh>
        <mesh position={[1.2, 0.25, -0.8]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.5, 0.4]} />
          <primitive object={getMaterial("wood")} attach="material" />
        </mesh>
      </group>
    );
  }

  return null;
}

function MepHints({
  level,
  elevation,
}: {
  level: LevelDefinition;
  elevation: number;
}) {
  const width = level.floorplate.width_m;
  const depth = level.floorplate.depth_m;
  return (
    <group>
      <mesh position={[width * 0.2, elevation + level.height_m - 0.15, depth * 0.5]}>
        <boxGeometry args={[width * 0.55, 0.08, 0.08]} />
        <meshStandardMaterial color="#4ade80" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[width * 0.65, elevation + level.height_m - 0.15, depth * 0.5]}>
        <boxGeometry args={[width * 0.25, 0.08, 0.08]} />
        <meshStandardMaterial color="#60a5fa" roughness={0.6} metalness={0.2} />
      </mesh>
    </group>
  );
}

export default function SlabMesh({
  level,
  elevation,
  visibleRooms = true,
  clipPlane = null,
  viewMode,
  qualityTier = "medium",
  showFurniture = false,
}: SlabMeshProps) {
  const w = level.floorplate.width_m;
  const d = level.floorplate.depth_m;
  const dollhouseMode = viewMode === "interior";
  const measurementsVisible = useBuildingStore((state) => state.measurementsVisible);
  const showDetail = qualityTier !== "low";

  return (
    <group>
      <mesh
        position={[w / 2, elevation - 0.15, d / 2]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[w, 0.3, d]} />
        <primitive object={getMaterial("concrete")} attach="material" />
      </mesh>

      {showDetail && <SlabEdgeBands level={level} elevation={elevation} />}

      {visibleRooms &&
        level.rooms.map((room) => (
          <group key={room.id}>
            <RoomSurface
              room={room}
              elevation={elevation}
              clipPlane={clipPlane}
              useWoodFloor={dollhouseMode}
            />
            {showFurniture && <RoomFurniture room={room} elevation={elevation} />}
            {measurementsVisible && <RoomLabel room={room} elevation={elevation} />}
          </group>
        ))}

      {visibleRooms && showFurniture && <MepHints level={level} elevation={elevation} />}
      
      {dollhouseMode && (
        <mesh position={[w / 2, elevation + level.height_m - 0.06, d / 2]}>
          <boxGeometry args={[w, 0.12, d]} />
          <primitive object={getMaterial("partition")} attach="material" />
        </mesh>
      )}
    </group>
  );
}

export function RoomLabel({ room, elevation }: { room: RoomDefinition; elevation: number }) {
  const [x, z] = roomCentroid(room);
  return (
    <group position={[x, elevation + 0.12, z]}>
      {/* Html labels are added in LevelGroup. */}
    </group>
  );
}
