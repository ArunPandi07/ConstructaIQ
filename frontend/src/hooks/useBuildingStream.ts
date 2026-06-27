import { useEffect, useState, useCallback, useRef } from "react";
import type { BuildingDefinition, LevelDefinition, FacadeDefinition } from "../types/building";
import type { BuildingMeta } from "../types/building";
import { isBackendProjectId } from "../services/projectApi";

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

export type BuildingStreamStatus = "idle" | "streaming" | "complete" | "error";

export interface BuildingStreamState {
  shell: { building: BuildingMeta; facade: FacadeDefinition } | null;
  levels: LevelDefinition[];
  status: BuildingStreamStatus;
  currentFloor: number;
  totalFloors: number | null;
  partialDefinition: BuildingDefinition | null;
  elapsedMs: number;
  error: string | null;
}

const INITIAL: BuildingStreamState = {
  shell: null,
  levels: [],
  status: "idle",
  currentFloor: 0,
  totalFloors: null,
  partialDefinition: null,
  elapsedMs: 0,
  error: null,
};

export function useBuildingStream(projectId: string, initialDefinition?: BuildingDefinition | null) {
  const [state, setState] = useState<BuildingStreamState>(() => {
    if (initialDefinition && initialDefinition.building) {
      return {
        ...INITIAL,
        status: "complete",
        shell: { building: initialDefinition.building, facade: initialDefinition.facade },
        levels: initialDefinition.levels || [],
        totalFloors: initialDefinition.building.stories || null,
        partialDefinition: initialDefinition
      };
    }
    return INITIAL;
  });

  useEffect(() => {
    if (state.status === "idle" && initialDefinition && initialDefinition.building) {
      setState({
        ...INITIAL,
        status: "complete",
        shell: { building: initialDefinition.building, facade: initialDefinition.facade },
        levels: initialDefinition.levels || [],
        totalFloors: initialDefinition.building.stories || null,
        partialDefinition: initialDefinition
      });
    }
  }, [initialDefinition, state.status]);

  const esRef = useRef<EventSource | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startStream = useCallback(
    (live = false) => {
      if (!projectId || !isBackendProjectId(projectId)) return;
      stopStream();

      setState({ ...INITIAL, status: "streaming" });
      startTimeRef.current = Date.now();

      // Elapsed timer
      timerRef.current = setInterval(() => {
        setState((prev) =>
          prev.status === "streaming"
            ? { ...prev, elapsedMs: Date.now() - startTimeRef.current }
            : prev,
        );
      }, 250);

      const url = `${API_BASE}/api/v1/projects/${projectId}/building-stream${live ? "?live=true" : ""}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener("shell", (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data);
          const payload = msg.payload ?? msg;
          setState((prev) => ({
            ...prev,
            shell: payload,
            totalFloors: payload?.building?.stories ?? null,
          }));
        } catch {
          // ignore
        }
      });

      es.addEventListener("level", (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data);
          const payload: LevelDefinition = msg.payload ?? msg;
          const total: number | null = msg.total_floors ?? null;
          setState((prev) => {
            const levels = [...prev.levels, payload].slice(0, 20);
            const shell = prev.shell;
            const partialDefinition: BuildingDefinition | null = shell
              ? {
                  building: { ...shell.building, stories: levels.length },
                  levels,
                  facade: shell.facade,
                }
              : null;
            return {
              ...prev,
              levels,
              currentFloor: levels.length,
              totalFloors: total ?? prev.totalFloors,
              partialDefinition,
            };
          });
        } catch {
          // ignore
        }
      });

      es.addEventListener("complete", () => {
        stopStream();
        setState((prev) => ({
          ...prev,
          status: "complete",
          elapsedMs: Date.now() - startTimeRef.current,
        }));
      });

      es.addEventListener("error", (e: MessageEvent) => {
        stopStream();
        let msg = "Stream error";
        try {
          msg = JSON.parse(e.data)?.message ?? msg;
        } catch {
          // ignore
        }
        setState((prev) => ({ ...prev, status: "error", error: msg }));
      });

      es.onerror = () => {
        stopStream();
        setState((prev) =>
          prev.status !== "complete"
            ? { ...prev, status: "error", error: "Connection lost" }
            : prev,
        );
      };
    },
    [projectId, stopStream],
  );

  const replay = useCallback(() => {
    startStream(false);
  }, [startStream]);

  // Cleanup on unmount
  useEffect(() => () => stopStream(), [stopStream]);

  return { ...state, startStream, replay };
}
