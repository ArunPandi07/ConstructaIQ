import { useCallback, useEffect, useRef, useState } from "react";
import type { BuildingDefinition } from "../types/building";
import type {
  BuildingSnapshotShot,
  BuildingSnapshotStatus,
} from "../types/buildingSnapshot";
import {
  deleteSnapshots,
  getSnapshots,
  hashBuildingDefinition,
  putSnapshots,
} from "../services/buildingSnapshotCache";
import { SNAPSHOT_PRESET_COUNT } from "../components/building3d/snapshotPresets";

interface Options {
  projectId: string | undefined;
  buildingDefinition: BuildingDefinition | null | undefined;
  deferCapture?: boolean;
}

interface Result {
  shots: BuildingSnapshotShot[];
  status: BuildingSnapshotStatus;
  progress: { current: number; total: number };
  shouldCapture: boolean;
  regenerate: () => void;
  onCaptureComplete: (shots: BuildingSnapshotShot[]) => void;
  onCaptureProgress: (
    current: number,
    total: number,
    partialShots: BuildingSnapshotShot[],
  ) => void;
  onCaptureError: (message: string) => void;
}

export function useBuildingSnapshots({
  projectId,
  buildingDefinition,
  deferCapture = false,
}: Options): Result {
  const [shots, setShots] = useState<BuildingSnapshotShot[]>([]);
  const [status, setStatus] = useState<BuildingSnapshotStatus>("idle");
  const [progress, setProgress] = useState({ current: 0, total: SNAPSHOT_PRESET_COUNT });
  const [shouldCapture, setShouldCapture] = useState(false);
  const hashRef = useRef<string | null>(null);
  const captureStartedRef = useRef(false);

  // Compute a stable string hash each render — cheap, avoids object reference churn
  const buildingHash =
    projectId && buildingDefinition?.levels?.length
      ? hashBuildingDefinition(buildingDefinition)
      : null;

  const beginCapture = useCallback(() => {
    if (captureStartedRef.current) return;
    captureStartedRef.current = true;
    setShouldCapture(true);
    setStatus("capturing");
    setProgress({ current: 0, total: SNAPSHOT_PRESET_COUNT });
  }, []);

  useEffect(() => {
    // Building identity changed (or gone) — reset everything
    if (buildingHash !== hashRef.current) {
      captureStartedRef.current = false;
      setShouldCapture(false);
      setShots([]);
      hashRef.current = buildingHash;
    }

    if (!buildingHash || !projectId) {
      setStatus("idle");
      return;
    }

    // Capture already underway — let it finish
    if (captureStartedRef.current) return;

    let cancelled = false;
    setStatus("loading-cache");
    getSnapshots(projectId, buildingHash).then((cached) => {
      if (cancelled) return;
      if (cached?.shots?.length) {
        setShots(cached.shots);
        setStatus("ready");
        return;
      }
      if (!deferCapture) {
        beginCapture();
      } else {
        setStatus("idle");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [buildingHash, projectId, deferCapture, beginCapture]);

  const onCaptureComplete = useCallback(
    async (captured: BuildingSnapshotShot[]) => {
      setShots(captured);
      setShouldCapture(false);
      captureStartedRef.current = false;
      setStatus("ready");
      if (projectId && hashRef.current) {
        await putSnapshots(projectId, hashRef.current, captured);
      }
    },
    [projectId],
  );

  const onCaptureProgress = useCallback(
    (current: number, total: number, partialShots: BuildingSnapshotShot[]) => {
      setProgress({ current, total });
      setShots(partialShots);
    },
    [],
  );

  const onCaptureError = useCallback((message: string) => {
    console.error(message);
    setShouldCapture(false);
    captureStartedRef.current = false;
    setStatus("error");
  }, []);

  const regenerate = useCallback(() => {
    if (!projectId || !buildingDefinition?.levels?.length) return;
    captureStartedRef.current = false;
    setShouldCapture(false);
    setShots([]);
    setProgress({ current: 0, total: SNAPSHOT_PRESET_COUNT });
    hashRef.current = hashBuildingDefinition(buildingDefinition);

    deleteSnapshots(projectId).then(() => {
      captureStartedRef.current = false;
      beginCapture();
    });
  }, [projectId, buildingDefinition, beginCapture]);

  return {
    shots,
    status,
    progress,
    shouldCapture,
    regenerate,
    onCaptureComplete,
    onCaptureProgress,
    onCaptureError,
  };
}
