import { create } from "zustand";
import type {
  BuildingDefinition,
  BuildingViewMode,
  QualityTier,
  RoomDefinition,
} from "../types/building";

interface BuildingStore {
  definition: BuildingDefinition | null;
  activeLevel: number;
  viewMode: BuildingViewMode;
  selectedRoom: string | null;
  hoveredRoom: string | null;
  sectionPlaneY: number;
  measurementsVisible: boolean;
  loading: boolean;
  qualityTier: QualityTier;
  autoQuality: boolean;
  setDefinition: (definition: BuildingDefinition | null) => void;
  setActiveLevel: (level: number) => void;
  setViewMode: (mode: BuildingViewMode) => void;
  setSelectedRoom: (roomId: string | null) => void;
  setHoveredRoom: (roomId: string | null) => void;
  setSectionPlaneY: (height: number) => void;
  setMeasurementsVisible: (visible: boolean) => void;
  setLoading: (loading: boolean) => void;
  setQualityTier: (tier: QualityTier) => void;
  setAutoQuality: (enabled: boolean) => void;
  downgradeQuality: () => void;
  resetView: () => void;
}

function defaultSectionHeight(definition: BuildingDefinition | null): number {
  return definition ? definition.building.totalHeight_m * 0.5 : 0;
}

function defaultQualityTier(definition: BuildingDefinition | null): QualityTier {
  if (!definition) return "medium";
  if (definition.building.stories < 6) return "high";
  const area =
    definition.building.footprint.width_m * definition.building.footprint.depth_m;
  if (definition.building.type === "warehouse" && area > 2000) return "low";
  if (definition.building.stories > 30) return "medium";
  return "medium";
}

export const useBuildingStore = create<BuildingStore>((set) => ({
  definition: null,
  activeLevel: 0,
  viewMode: "exterior",  // Default to exterior view
  selectedRoom: null,
  hoveredRoom: null,
  sectionPlaneY: 0,
  measurementsVisible: true,
  loading: false,
  qualityTier: "medium",  // Default to medium render quality
  autoQuality: true,
  setDefinition: (definition) =>
    set({
      definition,
      activeLevel: 0,
      selectedRoom: null,
      hoveredRoom: null,
      sectionPlaneY: defaultSectionHeight(definition),
      qualityTier: defaultQualityTier(definition),
    }),
  setActiveLevel: (activeLevel) =>
    set((state) => {
      const maxLevel = Math.max((state.definition?.levels.length ?? 1) - 1, 0);
      return {
        activeLevel: Math.min(Math.max(activeLevel, 0), maxLevel),
        selectedRoom: null,
      };
    }),
  setViewMode: (viewMode) => set({ viewMode, selectedRoom: null }),
  setSelectedRoom: (selectedRoom) => set({ selectedRoom }),
  setHoveredRoom: (hoveredRoom) => set({ hoveredRoom }),
  setSectionPlaneY: (sectionPlaneY) => set({ sectionPlaneY }),
  setMeasurementsVisible: (measurementsVisible) => set({ measurementsVisible }),
  setLoading: (loading) => set({ loading }),
  setQualityTier: (qualityTier) => set({ qualityTier, autoQuality: false }),
  setAutoQuality: (autoQuality) => set({ autoQuality }),
  downgradeQuality: () =>
    set((state) => {
      if (state.qualityTier === "high") return { qualityTier: "medium" };
      if (state.qualityTier === "medium") return { qualityTier: "low" };
      return state;
    }),
  resetView: () =>
    set((state) => ({
      activeLevel: 0,
      viewMode: "exterior",  // Reset to exterior view
      selectedRoom: null,
      hoveredRoom: null,
      sectionPlaneY: defaultSectionHeight(state.definition),
      measurementsVisible: true,
    })),
}));

export function findRoom(
  definition: BuildingDefinition | null,
  roomId: string | null,
): RoomDefinition | null {
  if (!definition || !roomId) return null;
  for (const level of definition.levels) {
    const room = level.rooms.find((candidate) => candidate.id === roomId);
    if (room) return room;
  }
  return null;
}
