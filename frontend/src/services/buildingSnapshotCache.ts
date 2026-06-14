import type { BuildingDefinition } from "../types/building";
import type { BuildingSnapshotSet, BuildingSnapshotShot } from "../types/buildingSnapshot";

const DB_NAME = "constructaiq-building-snapshots";
const STORE_NAME = "snapshots";
const MAX_CACHE_BYTES = 8 * 1024 * 1024;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function cacheKey(projectId: string): string {
  return `project:${projectId}`;
}

export function hashBuildingDefinition(defn: BuildingDefinition): string {
  const payload = {
    snapshotV: 4,
    type: defn.building.type,
    stories: defn.building.stories,
    totalHeight_m: defn.building.totalHeight_m,
    footprint: defn.building.footprint,
    levels: defn.levels.length,
    roof: defn.building.roof_type,
  };
  const str = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
}

function estimateBytes(shots: BuildingSnapshotShot[]): number {
  return shots.reduce(
    (sum, shot) => sum + shot.dataUrl.length + (shot.thumbDataUrl?.length ?? 0),
    0,
  );
}

export async function getSnapshots(
  projectId: string,
  definitionHash: string,
): Promise<BuildingSnapshotSet | null> {
  if (!projectId || typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    const entry = await new Promise<BuildingSnapshotSet | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(cacheKey(projectId));
      req.onsuccess = () => resolve((req.result as BuildingSnapshotSet | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!entry || entry.hash !== definitionHash || !entry.shots?.length) return null;
    return entry;
  } catch {
    return null;
  }
}

export async function putSnapshots(
  projectId: string,
  definitionHash: string,
  shots: BuildingSnapshotShot[],
): Promise<void> {
  if (!projectId || typeof indexedDB === "undefined") return;
  if (estimateBytes(shots) > MAX_CACHE_BYTES) {
    console.warn("Building snapshot cache skipped: payload exceeds 8MB");
    return;
  }
  const entry: BuildingSnapshotSet = {
    projectId,
    hash: definitionHash,
    capturedAt: Date.now(),
    shots,
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(entry, cacheKey(projectId));
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  db.close();
}

export async function deleteSnapshots(projectId: string): Promise<void> {
  if (!projectId || typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).delete(cacheKey(projectId));
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    db.close();
  } catch {
    // ignore cache delete failures
  }
}
