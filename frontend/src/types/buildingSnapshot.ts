export interface BuildingSnapshotShot {
  id: string;
  label: string;
  description?: string;
  presentation?: string;
  dataUrl: string;
  thumbDataUrl?: string;
}

export interface BuildingSnapshotSet {
  projectId: string;
  hash: string;
  capturedAt: number;
  shots: BuildingSnapshotShot[];
}

export type BuildingSnapshotStatus =
  | "idle"
  | "loading-cache"
  | "capturing"
  | "ready"
  | "error";
