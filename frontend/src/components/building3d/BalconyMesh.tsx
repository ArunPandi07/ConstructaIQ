import type { BuildingType, FacadeDefinition, LevelDefinition } from "../../types/building";
import { getMaterial } from "./MaterialLibrary";

interface Props {
  level: LevelDefinition;
  elevation: number;
  facade: FacadeDefinition;
  buildingType?: BuildingType;
}

function SteelBarRailing({
  width,
  depth,
  railingHeight,
  frontEdgeZ,
}: {
  width: number;
  depth: number;
  railingHeight: number;
  frontEdgeZ: number;
}) {
  const postCount = Math.max(2, Math.floor(width / 0.9) + 1);
  const railMat = getMaterial("railing");

  return (
    <group>
      {Array.from({ length: postCount }, (_, i) => {
        const x = -width / 2 + (width / (postCount - 1)) * i;
        return (
          <mesh key={`post_${i}`} position={[x, railingHeight / 2, frontEdgeZ]} castShadow>
            <boxGeometry args={[0.06, railingHeight, 0.06]} />
            <primitive object={railMat} attach="material" />
          </mesh>
        );
      })}
      {[0.3, 0.62, 0.96].map((pct, i) => (
        <mesh key={`rail_${i}`} position={[0, railingHeight * pct, frontEdgeZ]} castShadow>
          <boxGeometry args={[width + 0.06, 0.05, 0.05]} />
          <primitive object={railMat} attach="material" />
        </mesh>
      ))}
      <mesh position={[-width / 2, railingHeight / 2, 0]} castShadow>
        <boxGeometry args={[0.06, railingHeight, depth]} />
        <primitive object={railMat} attach="material" />
      </mesh>
      <mesh position={[width / 2, railingHeight / 2, 0]} castShadow>
        <boxGeometry args={[0.06, railingHeight, depth]} />
        <primitive object={railMat} attach="material" />
      </mesh>
    </group>
  );
}

function BalconyUnit({
  position,
  width,
  depth,
  slabY,
  railingHeight,
  frontZ,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  slabY: number;
  railingHeight: number;
  frontZ: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, slabY, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.22, depth]} />
        <primitive object={getMaterial("concrete")} attach="material" />
      </mesh>
      <SteelBarRailing
        width={width}
        depth={depth}
        railingHeight={railingHeight}
        frontEdgeZ={frontZ}
      />
    </group>
  );
}

export default function BalconyMesh({ level, elevation, facade, buildingType }: Props) {
  if (!facade.balconies && facade.balcony_depth_m <= 0) {
    const isTower =
      buildingType === "office_tower" || buildingType === "residential_tower";
    if (!isTower || level.level === 0) return null;
  }

  const depth = Math.max(facade.balcony_depth_m, 1.2);
  const railingHeight = facade.railing_height_m || 1.1;
  const width = Math.min(level.floorplate.width_m * 0.38, 14);
  const y = elevation + Math.min(level.height_m * 0.42, 1.8);
  const slabY = 0;
  const frontZ = -depth / 2;
  const rearZ = level.floorplate.depth_m + depth / 2;
  const midX = level.floorplate.width_m / 2;

  const balconies: Array<{
    pos: [number, number, number];
    w: number;
    d: number;
    frontEdge: number;
  }> = [
    { pos: [midX, y, frontZ], w: width, d: depth, frontEdge: -depth / 2 },
    { pos: [midX, y, rearZ], w: width, d: depth, frontEdge: depth / 2 },
  ];

  const isTower =
    buildingType === "office_tower" || buildingType === "residential_tower";
  if (isTower && level.floorplate.width_m > 40) {
    const sideW = Math.min(level.floorplate.depth_m * 0.32, 10);
    const sideD = depth;
    balconies.push(
      {
        pos: [-sideD / 2, y, level.floorplate.depth_m * 0.55],
        w: sideW,
        d: sideD,
        frontEdge: -sideD / 2,
      },
      {
        pos: [level.floorplate.width_m + sideD / 2, y, level.floorplate.depth_m * 0.45],
        w: sideW,
        d: sideD,
        frontEdge: sideD / 2,
      },
    );
  }

  return (
    <group>
      {balconies.map((b, index) => (
        <BalconyUnit
          key={index}
          position={b.pos}
          width={b.w}
          depth={b.d}
          slabY={slabY}
          railingHeight={railingHeight}
          frontZ={b.frontEdge}
        />
      ))}
    </group>
  );
}
