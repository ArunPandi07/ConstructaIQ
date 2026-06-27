import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

import type { CameraView } from './cameraPresets';
import { computeCameraPreset } from './cameraPresets';
import type { BuildingDefinition } from '../../types/building';

const LERP_DURATION_MS = 400;

interface CameraRigProps {
  activeView: CameraView;
  autoRotate: boolean;
  buildingDefinition: BuildingDefinition;
  twinTower: boolean;
  orbitTarget: [number, number, number];
}

export function CameraRig({
  activeView,
  autoRotate,
  buildingDefinition,
  twinTower,
  orbitTarget,
}: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const animationRef = useRef<{
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    start: number;
  } | null>(null);

  useEffect(() => {
    const preset = computeCameraPreset(activeView, buildingDefinition, twinTower);
    const toPos = new THREE.Vector3(...preset.position);
    const toTarget = new THREE.Vector3(...preset.target);

    animationRef.current = {
      fromPos: camera.position.clone(),
      toPos,
      fromTarget: controlsRef.current
        ? controlsRef.current.target.clone()
        : new THREE.Vector3(...orbitTarget),
      toTarget,
      start: performance.now(),
    };
  }, [activeView, buildingDefinition, twinTower, camera, orbitTarget]);

  useFrame(() => {
    const anim = animationRef.current;
    if (!anim || !controlsRef.current) return;

    const elapsed = performance.now() - anim.start;
    const t = Math.min(elapsed / LERP_DURATION_MS, 1);
    const eased = t * t * (3 - 2 * t);

    camera.position.lerpVectors(anim.fromPos, anim.toPos, eased);
    controlsRef.current.target.lerpVectors(anim.fromTarget, anim.toTarget, eased);
    controlsRef.current.update();

    if (t >= 1) {
      animationRef.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={orbitTarget}
      enableDamping
      dampingFactor={0.06}
      minDistance={8}
      maxDistance={200}
      maxPolarAngle={Math.PI / 2.08}
      autoRotate={autoRotate}
      autoRotateSpeed={0.6}
    />
  );
}
