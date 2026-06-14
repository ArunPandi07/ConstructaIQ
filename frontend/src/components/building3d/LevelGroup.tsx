import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type {
  BuildingType,
  BuildingViewMode,
  FacadeDefinition,
  LevelDefinition,
  QualityTier,
} from "../../types/building";
import { useBuildingStore } from "../../stores/buildingStore";
import BalconyMesh from "./BalconyMesh";
import ColumnMesh from "./ColumnMesh";
import CurtainWallMesh from "./CurtainWallMesh";
import DoorMesh from "./DoorMesh";
import OpeningInstances from "./OpeningInstances";
import SlabMesh from "./SlabMesh";
import StairMesh from "./StairMesh";
import WallMesh from "./WallMesh";
import WindowMesh from "./WindowMesh";
import { polygonArea, roomCentroid, wallTransform } from "./geometryUtils";

type WallDef = LevelDefinition["walls"][number];
type OpeningDef = NonNullable<WallDef["openings"]>[number];

function ProceduralWindows({
  wall,
  elevation,
  heroGlass,
}: {
  wall: WallDef;
  elevation: number;
  heroGlass: boolean;
}) {
  if (wall.type !== "exterior") return null;
  const wallLen = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  const existing = (wall.openings ?? []).filter((o) => o.type === "window");
  const targetCount = Math.max(0, Math.floor(wallLen / 2.8) - 1);
  if (existing.length >= targetCount) return null;

  const extra: OpeningDef[] = [];
  for (let i = 0; i < targetCount; i++) {
    const offset = (wallLen / (targetCount + 1)) * (i + 1);
    const conflict = existing.some((w) => Math.abs((w.offset_m ?? 0) - offset) < 1.4);
    if (!conflict) {
      extra.push({
        id: `pw_${wall.id}_${i}`,
        type: "window",
        offset_m: offset,
        width_m: 1.4,
        height_m: 1.5,
        sill_m: 0.9,
      });
    }
  }
  return (
    <>
      {extra.map((o) => (
        <WindowMesh key={o.id} wall={wall} opening={o} elevation={elevation} heroGlass={heroGlass} />
      ))}
    </>
  );
}

interface Props {
  level: LevelDefinition;
  elevation: number;
  facade: FacadeDefinition;
  buildingType: BuildingType;
  viewMode: BuildingViewMode;
  activeLevel: number;
  simplified?: boolean;
  clipPlane?: THREE.Plane | null;
  buildingCenter?: THREE.Vector3;
  heroGlass?: boolean;
  hideLabels?: boolean;
  qualityTierOverride?: QualityTier;
}

function wallCutawayHidden(
  wall: LevelDefinition["walls"][number],
  elevation: number,
  camera: THREE.Vector3,
  buildingCenter: THREE.Vector3,
): boolean {
  if (wall.type !== "exterior") return false;
  const transform = wallTransform(wall, elevation, 1);
  const wallCenter = new THREE.Vector3(
    transform.center[0],
    elevation + 1,
    transform.center[2],
  );
  const toCamera = camera.clone().sub(wallCenter);
  const wallDir = new THREE.Vector3(
    wall.end.x - wall.start.x,
    0,
    wall.end.y - wall.start.y,
  ).normalize();
  const normal = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), wallDir);
  const toBuilding = buildingCenter.clone().sub(wallCenter);
  if (normal.dot(toBuilding) < 0) normal.multiplyScalar(-1);
  return normal.dot(toCamera) > 0;
}

function shouldUseCurtainWall(
  facade: FacadeDefinition,
  buildingType: BuildingType,
  wall: LevelDefinition["walls"][number],
): boolean {
  const material = (facade.material ?? "").toLowerCase();
  if (wall.type !== "exterior") return false;
  if (material.includes("curtain")) return true;
  if (buildingType === "office_tower" || buildingType === "residential_tower") {
    return facade.window_pattern !== "industrial";
  }
  return false;
}

export default function LevelGroup({
  level,
  elevation,
  facade,
  buildingType,
  viewMode,
  activeLevel,
  simplified = false,
  clipPlane = null,
  buildingCenter,
  heroGlass = false,
  hideLabels = false,
  qualityTierOverride,
}: Props) {
  const measurementsVisible = useBuildingStore((state) => state.measurementsVisible);
  const storeQualityTier = useBuildingStore((state) => state.qualityTier);
  const qualityTier = qualityTierOverride ?? storeQualityTier;
  const selectedRoom = useBuildingStore((state) => state.selectedRoom);
  const { camera } = useThree();
  const active = level.level === activeLevel;
  const showInterior = viewMode !== "exterior" && active;
  const sectionMode = viewMode === "section" && active;
  const wallHeight = sectionMode ? Math.min(level.height_m, 1.35) : level.height_m;
  const showDetails = !simplified || active || viewMode !== "exterior";
  const center = buildingCenter ?? new THREE.Vector3(0, 0, 0);
  const cutawayActive = viewMode === "interior" || viewMode === "section";
  const useCladding = viewMode === "exterior" || viewMode === "exploded";
  const showWallCap = cutawayActive;

  if (viewMode === "interior" && !active) return null;
  if (viewMode === "section" && !active) return null;

  return (
    <group>
      <SlabMesh
        level={level}
        elevation={elevation}
        visibleRooms={showInterior || sectionMode}
        buildingType={buildingType}
        clipPlane={clipPlane}
        viewMode={viewMode}
        qualityTier={qualityTier}
      />
      {viewMode !== "interior" && viewMode !== "section" && (
        <ColumnMesh level={level} elevation={elevation} />
      )}
      {level.walls.map((wall) => {
        const cutawayHidden =
          cutawayActive && wallCutawayHidden(wall, elevation, camera.position, center);
        const curtainWall = shouldUseCurtainWall(facade, buildingType, wall) && !simplified;

        return (
          <group key={wall.id}>
            {curtainWall ? (
              <CurtainWallMesh
                wall={wall}
                elevation={elevation}
                height={wallHeight}
                facade={facade}
                heroGlass={heroGlass}
              />
            ) : (
              <WallMesh
                wall={wall}
                elevation={elevation}
                height={wallHeight}
                simplified={!showDetails}
                clipPlane={clipPlane}
                cutawayHidden={cutawayHidden}
                showWallCap={showWallCap && !cutawayHidden}
                useCladding={useCladding}
                buildingType={buildingType}
              />
            )}
            {showDetails &&
              !curtainWall &&
              wall.openings?.map((opening, index) =>
                opening.type === "window" ? (
                  <WindowMesh
                    key={opening.id ?? `${wall.id}_window_${index}`}
                    wall={wall}
                    opening={opening}
                    elevation={elevation}
                    heroGlass={heroGlass}
                  />
                ) : (
                  <DoorMesh
                    key={opening.id ?? `${wall.id}_door_${index}`}
                    wall={wall}
                    opening={opening}
                    elevation={elevation}
                  />
                ),
              )}
            {showDetails && !curtainWall && (
              <ProceduralWindows wall={wall} elevation={elevation} heroGlass={heroGlass} />
            )}
          </group>
        );
      })}
      {!showDetails && (
        <OpeningInstances walls={level.walls} elevation={elevation} glowWindows={true} />
      )}
      {showDetails &&
        level.stairs.map((stair, index) => (
          <StairMesh
            key={stair.id ?? `${level.level}_stair_${index}`}
            stair={stair}
            elevation={elevation}
            floorHeight={level.height_m}
          />
        ))}
      {showDetails && buildingType !== "warehouse" && (
        <BalconyMesh
          level={level}
          elevation={elevation}
          facade={facade}
          buildingType={buildingType}
        />
      )}
      {!hideLabels &&
        measurementsVisible &&
        (showInterior || sectionMode) &&
        level.rooms
          .filter((room) => polygonArea(room.polygon) > 0)
          .map((room) => {
            const [x, z] = roomCentroid(room);
            const selected = selectedRoom === room.id;
            return (
              <Html
                key={room.id}
                position={[x, elevation + 0.22, z]}
                center
                distanceFactor={20}
                occlude
              >
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold shadow-sm border whitespace-nowrap ${
                    selected
                      ? "bg-[#F5C518] text-stone-950 border-[#E2B30D]"
                      : "bg-white/90 text-stone-700 border-stone-200"
                  }`}
                >
                  {room.name}
                </span>
              </Html>
            );
          })}
    </group>
  );
}
