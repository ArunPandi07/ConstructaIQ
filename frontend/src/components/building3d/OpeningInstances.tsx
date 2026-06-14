import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OpeningDefinition, WallDefinition } from "../../types/building";
import { getMaterial } from "./MaterialLibrary";
import { openingPosition, wallAngle } from "./geometryUtils";

interface InstanceItem {
  wall: WallDefinition;
  opening: OpeningDefinition;
}

interface Props {
  walls: WallDefinition[];
  elevation: number;
  glowWindows?: boolean;
}

function collectOpenings(walls: WallDefinition[], predicate: (opening: OpeningDefinition) => boolean) {
  return walls.flatMap((wall) =>
    (wall.openings ?? [])
      .filter(predicate)
      .map((opening) => ({ wall, opening })),
  );
}

function InstancedOpenings({
  items,
  elevation,
  material,
}: {
  items: InstanceItem[];
  elevation: number;
  material: THREE.Material;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach(({ wall, opening }, index) => {
      const [x, y, z] = openingPosition(wall, opening, elevation, 0.21);
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, wallAngle(wall), 0);
      dummy.scale.set(opening.width_m, opening.height_m, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy, elevation, items]);

  if (items.length === 0) return null;

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} material={material}>
      <boxGeometry args={[1, 1, 0.055]} />
    </instancedMesh>
  );
}

export default function OpeningInstances({ walls, elevation, glowWindows = false }: Props) {
  const windows = useMemo(
    () => collectOpenings(walls, (opening) => opening.type === "window"),
    [walls],
  );
  const doors = useMemo(
    () => collectOpenings(walls, (opening) => opening.type !== "window"),
    [walls],
  );
  const windowMaterial = glowWindows ? getMaterial("emissive_glow") : getMaterial("glass");

  return (
    <>
      <InstancedOpenings items={windows} elevation={elevation} material={windowMaterial} />
      <InstancedOpenings items={doors} elevation={elevation} material={getMaterial("steel")} />
    </>
  );
}
