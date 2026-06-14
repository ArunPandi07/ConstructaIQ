import type { LevelDefinition } from "../../types/building";
import { getMaterial } from "./MaterialLibrary";

interface Props {
  level: LevelDefinition;
  elevation: number;
}

export default function ColumnMesh({ level, elevation }: Props) {
  const w = level.floorplate.width_m;
  const d = level.floorplate.depth_m;
  const h = level.height_m;
  const colW = 0.4;
  const colH = h + 0.04;
  const yCenter = elevation + h / 2;
  const offset = 0.05;

  const corners: [number, number, number][] = [
    [-offset,     yCenter, -offset],
    [w + offset,  yCenter, -offset],
    [-offset,     yCenter, d + offset],
    [w + offset,  yCenter, d + offset],
  ];

  const mat = getMaterial("column");

  return (
    <group>
      {corners.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[colW, colH, colW]} />
          <primitive object={mat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
