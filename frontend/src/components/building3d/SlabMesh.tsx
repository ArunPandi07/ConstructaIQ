import { useMemo } from "react";
import * as THREE from "three";
import type { BuildingType, BuildingViewMode, LevelDefinition, QualityTier, RoomDefinition } from "../../types/building";
import { useBuildingStore } from "../../stores/buildingStore";
import { getMaterial, roomColor } from "./MaterialLibrary";
import { polygonArea, polygonShape, roomCentroid } from "./geometryUtils";

interface SlabMeshProps {
  level: LevelDefinition;
  elevation: number;
  visibleRooms?: boolean;
  buildingType?: BuildingType;
  clipPlane?: THREE.Plane | null;
  viewMode?: BuildingViewMode;
  qualityTier?: QualityTier;
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

function CoreShaft({ level, elevation }: { level: LevelDefinition; elevation: number }) {
  const w = level.floorplate.width_m * 0.18;
  const d = level.floorplate.depth_m * 0.22;
  const x = level.floorplate.width_m * 0.38;
  const z = level.floorplate.depth_m * 0.36;
  return (
    <mesh position={[x, elevation + level.height_m * 0.45, z]} castShadow receiveShadow>
      <boxGeometry args={[w, level.height_m * 0.88, d]} />
      <primitive object={getMaterial("steel")} attach="material" />
    </mesh>
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

  if (type.includes("living")) {
    return (
      <group position={[cx, elevation + 0.4, cz]}>
        <mesh position={[-0.6, 0.25, 0]}>
          <boxGeometry args={[1.8, 0.5, 0.7]} />
          <primitive object={getMaterial("wood")} attach="material" />
        </mesh>
        <mesh position={[0.5, 0.2, 0.5]}>
          <boxGeometry args={[0.9, 0.4, 0.6]} />
          <primitive object={getMaterial("wood")} attach="material" />
        </mesh>
        {!simplified && (
          <>
            <mesh position={[0, 0.12, -0.5]}>
              <boxGeometry args={[0.7, 0.24, 0.7]} />
              <primitive object={getMaterial("wood")} attach="material" />
            </mesh>
            <mesh position={[1.2, 0.5, -0.8]}>
              <boxGeometry args={[1.4, 0.9, 0.08]} />
              <primitive object={getMaterial("steel")} attach="material" />
            </mesh>
          </>
        )}
      </group>
    );
  }

  if (type.includes("bedroom")) {
    return (
      <group position={[cx, elevation + 0.35, cz]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[1.6, 0.4, 2]} />
          <primitive object={getMaterial("wood")} attach="material" />
        </mesh>
        {!simplified && (
          <mesh position={[-1.2, 0.6, 0]}>
            <boxGeometry args={[0.5, 1.2, 0.35]} />
            <primitive object={getMaterial("partition")} attach="material" />
          </mesh>
        )}
      </group>
    );
  }

  if (type.includes("kitchen")) {
    return (
      <group position={[cx, elevation + 0.4, cz]}>
        <mesh position={[-0.8, 0.45, 0]}>
          <boxGeometry args={[2.2, 0.9, 0.6]} />
          <primitive object={getMaterial("partition")} attach="material" />
        </mesh>
        {!simplified && (
          <>
            <mesh position={[0.8, 0.35, 0.4]}>
              <boxGeometry args={[0.8, 0.7, 0.8]} />
              <primitive object={getMaterial("wood")} attach="material" />
            </mesh>
            <mesh position={[0.8, 0.2, 0.9]}>
              <cylinderGeometry args={[0.12, 0.12, 0.4, 8]} />
              <primitive object={getMaterial("steel")} attach="material" />
            </mesh>
          </>
        )}
      </group>
    );
  }

  if (type.includes("dining")) {
    return (
      <group position={[cx, elevation + 0.4, cz]}>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.4, 0.08, 0.9]} />
          <primitive object={getMaterial("wood")} attach="material" />
        </mesh>
        {!simplified &&
          [-0.5, 0.5].flatMap((dx) =>
            [-0.35, 0.35].map((dz) => (
              <mesh key={`${dx}_${dz}`} position={[dx, 0.2, dz]}>
                <boxGeometry args={[0.35, 0.4, 0.35]} />
                <primitive object={getMaterial("wood")} attach="material" />
              </mesh>
            )),
          )}
      </group>
    );
  }

  if (type.includes("lobby") || type.includes("retail")) {
    return (
      <group position={[cx, elevation + 0.4, cz]}>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.2, 0.7, 0.6]} />
          <primitive object={getMaterial("wood")} attach="material" />
        </mesh>
        {!simplified && (
          <mesh position={[1.4, 0.2, 0.8]}>
            <cylinderGeometry args={[0.25, 0.25, 0.4, 12]} />
            <primitive object={getMaterial("highlight")} attach="material" />
          </mesh>
        )}
      </group>
    );
  }

  return null;
}

function MepHints({
  level,
  elevation,
  buildingType,
}: {
  level: LevelDefinition;
  elevation: number;
  buildingType?: BuildingType;
}) {
  if (buildingType !== "hospital" && buildingType !== "warehouse") return null;
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
  buildingType,
  clipPlane = null,
  viewMode = "exterior",
  qualityTier = "medium",
}: SlabMeshProps) {
  const slabMaterial = useMemo(() => {
    const mat = getMaterial("floor").clone();
    if (clipPlane) {
      mat.clippingPlanes = [clipPlane];
      mat.clipShadows = true;
    }
    return mat;
  }, [clipPlane]);

  const isTower =
    buildingType === "office_tower" ||
    buildingType === "residential_tower" ||
    buildingType === "mixed_use";
  const dollhouseMode = viewMode === "interior" || viewMode === "section";

  return (
    <group>
      <mesh
        position={[
          level.floorplate.width_m / 2,
          elevation - 0.08,
          level.floorplate.depth_m / 2,
        ]}
        receiveShadow
        material={slabMaterial}
      >
        <boxGeometry args={[level.floorplate.width_m, 0.16, level.floorplate.depth_m]} />
      </mesh>
      <SlabEdgeBands level={level} elevation={elevation} />
      {visibleRooms &&
        level.rooms
          .filter((room) => polygonArea(room.polygon) > 0)
          .map((room) => (
            <RoomSurface
              key={room.id}
              room={room}
              elevation={elevation}
              clipPlane={clipPlane}
              useWoodFloor={dollhouseMode}
            />
          ))}
      {visibleRooms && isTower && <CoreShaft level={level} elevation={elevation} />}
      {visibleRooms &&
        level.rooms.map((room) => (
          <RoomFurniture
            key={`furn_${room.id}`}
            room={room}
            elevation={elevation}
            qualityTier={qualityTier}
          />
        ))}
      {visibleRooms && <MepHints level={level} elevation={elevation} buildingType={buildingType} />}
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
