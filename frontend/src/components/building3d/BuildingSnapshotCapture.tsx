import { Canvas, useThree } from "@react-three/fiber";
import { flushSync } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { BuildingDefinition } from "../../types/building";
import type { BuildingSnapshotShot } from "../../types/buildingSnapshot";
import { SnapshotSceneContent } from "./BuildingScene";
import {
  buildSnapshotPresets,
  SNAPSHOT_HEIGHT,
  SNAPSHOT_WIDTH,
  THUMB_HEIGHT,
  THUMB_WIDTH,
  type SnapshotPreset,
} from "./snapshotPresets";

const WEBP_QUALITY = 0.88;
const JPEG_QUALITY = 0.9;
const THUMB_WEBP_QUALITY = 0.82;
const THUMB_JPEG_QUALITY = 0.85;
const WARMUP_FRAMES = 20;
const FRAMES_PER_SHOT = 4;
const CAPTURE_DPR = 2;

function waitFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    const step = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function encodeSnapshot(canvas: HTMLCanvasElement): { dataUrl: string; thumbDataUrl: string } {
  const webp = canvas.toDataURL("image/webp", WEBP_QUALITY);
  const dataUrl =
    webp.startsWith("data:image/webp") && webp.length > 128
      ? webp
      : canvas.toDataURL("image/jpeg", JPEG_QUALITY);

  const thumbCanvas = document.createElement("canvas");
  thumbCanvas.width = THUMB_WIDTH;
  thumbCanvas.height = THUMB_HEIGHT;
  const ctx = thumbCanvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, THUMB_WIDTH, THUMB_HEIGHT);
  }
  const thumbWebp = thumbCanvas.toDataURL("image/webp", THUMB_WEBP_QUALITY);
  const thumbDataUrl =
    thumbWebp.startsWith("data:image/webp") && thumbWebp.length > 64
      ? thumbWebp
      : thumbCanvas.toDataURL("image/jpeg", THUMB_JPEG_QUALITY);

  return { dataUrl, thumbDataUrl };
}

interface CaptureControllerProps {
  definition: BuildingDefinition;
  onProgress: (index: number, total: number, shots: BuildingSnapshotShot[]) => void;
  onComplete: (shots: BuildingSnapshotShot[]) => void;
  onError: (message: string) => void;
}

function CaptureController({
  definition,
  onProgress,
  onComplete,
  onError,
}: CaptureControllerProps) {
  const { gl, scene, camera, invalidate } = useThree();
  const presets = useMemo(() => buildSnapshotPresets(definition), [definition]);
  const [activePreset, setActivePreset] = useState<SnapshotPreset>(presets[0]);
  const shotsRef = useRef<BuildingSnapshotShot[]>([]);
  const runningRef = useRef(false);

  // Keep callback refs current so changes never retrigger the capture effect
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  onProgressRef.current = onProgress;
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    let cancelled = false;

    async function captureFrame(p: SnapshotPreset): Promise<BuildingSnapshotShot> {
      const cam = camera as THREE.PerspectiveCamera;
      cam.position.set(...p.cameraPosition);
      cam.fov = p.fov;
      cam.updateProjectionMatrix();
      cam.lookAt(new THREE.Vector3(...p.cameraTarget));
      invalidate();
      await waitFrames(FRAMES_PER_SHOT);
      invalidate();
      await waitFrames(FRAMES_PER_SHOT);
      gl.render(scene, camera);
      const { dataUrl, thumbDataUrl } = encodeSnapshot(gl.domElement);
      return {
        id: p.id,
        label: p.label,
        description: p.description,
        presentation: p.presentation,
        dataUrl,
        thumbDataUrl,
      };
    }

    async function captureAll() {
      try {
        shotsRef.current = [];
        await waitFrames(WARMUP_FRAMES);
        if (cancelled) return;

        for (let i = 0; i < presets.length; i++) {
          if (cancelled) return;
          const p = presets[i];
          flushSync(() => setActivePreset(p));
          invalidate();
          await waitFrames(FRAMES_PER_SHOT);
          invalidate();
          await waitFrames(FRAMES_PER_SHOT);
          if (cancelled) return;

          const shot = await captureFrame(p);
          shotsRef.current.push(shot);
          onProgressRef.current(i + 1, presets.length, [...shotsRef.current]);
        }

        if (!cancelled) onCompleteRef.current(shotsRef.current);
      } catch (err) {
        if (!cancelled) {
          onErrorRef.current(err instanceof Error ? err.message : "Snapshot capture failed");
        }
      }
    }

    captureAll();
    return () => {
      cancelled = true;
      runningRef.current = false;
    };
  }, [presets, gl, scene, camera, invalidate]);

  return <SnapshotSceneContent definition={definition} preset={activePreset} />;
}

interface Props {
  definition: BuildingDefinition;
  onProgress: (index: number, total: number, shots: BuildingSnapshotShot[]) => void;
  onComplete: (shots: BuildingSnapshotShot[]) => void;
  onError: (message: string) => void;
}

export default function BuildingSnapshotCapture({
  definition,
  onProgress,
  onComplete,
  onError,
}: Props) {
  const initialPreset = buildSnapshotPresets(definition)[0];
  const bg = initialPreset.backgroundColor ?? "#f4f6f8";

  return (
    <div
      className="pointer-events-none"
      style={{
        position: "fixed",
        left: -9999,
        top: 0,
        width: SNAPSHOT_WIDTH,
        height: SNAPSHOT_HEIGHT,
        visibility: "hidden",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <Canvas
        shadows="percentage"
        frameloop="demand"
        dpr={CAPTURE_DPR}
        camera={{
          position: initialPreset.cameraPosition,
          fov: initialPreset.fov,
        }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
        style={{ width: SNAPSHOT_WIDTH, height: SNAPSHOT_HEIGHT }}
      >
        <color attach="background" args={[bg]} />
        <CaptureController
          definition={definition}
          onProgress={onProgress}
          onComplete={onComplete}
          onError={onError}
        />
      </Canvas>
    </div>
  );
}
