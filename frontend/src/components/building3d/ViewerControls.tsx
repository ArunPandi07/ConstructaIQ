import {
  Box,
  Building2,
  Eye,
  Layers3,
  Ruler,
  Scissors,
  Undo2,
} from "lucide-react";
import type { BuildingDefinition, BuildingViewMode, QualityTier } from "../../types/building";
import { findRoom, useBuildingStore } from "../../stores/buildingStore";
import { polygonArea } from "./geometryUtils";

interface Props {
  definition: BuildingDefinition;
}

const modes: Array<{ id: BuildingViewMode; label: string; icon: typeof Eye }> = [
  { id: "exterior", label: "Exterior", icon: Building2 },
  { id: "interior", label: "Interior", icon: Box },
  { id: "exploded", label: "Exploded", icon: Layers3 },
  { id: "section", label: "Section", icon: Scissors },
];

export default function ViewerControls({ definition }: Props) {
  const activeLevel = useBuildingStore((state) => state.activeLevel);
  const viewMode = useBuildingStore((state) => state.viewMode);
  const selectedRoom = useBuildingStore((state) => state.selectedRoom);
  const sectionPlaneY = useBuildingStore((state) => state.sectionPlaneY);
  const measurementsVisible = useBuildingStore((state) => state.measurementsVisible);
  const setActiveLevel = useBuildingStore((state) => state.setActiveLevel);
  const setViewMode = useBuildingStore((state) => state.setViewMode);
  const setSectionPlaneY = useBuildingStore((state) => state.setSectionPlaneY);
  const setMeasurementsVisible = useBuildingStore((state) => state.setMeasurementsVisible);
  const qualityTier = useBuildingStore((state) => state.qualityTier);
  const autoQuality = useBuildingStore((state) => state.autoQuality);
  const setQualityTier = useBuildingStore((state) => state.setQualityTier);
  const setAutoQuality = useBuildingStore((state) => state.setAutoQuality);
  const resetView = useBuildingStore((state) => state.resetView);
  const active = definition.levels[activeLevel] ?? definition.levels[0];
  const room = findRoom(definition, selectedRoom);

  return (
    <aside className="glass-card p-5 h-full space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Blueprint-Derived Model
          </p>
          <h3 className="text-sm font-black text-stone-900 mt-1">
            {definition.building.type.replace(/_/g, " ")}
          </h3>
        </div>
        <button
          type="button"
          onClick={resetView}
          className="rounded-lg bg-stone-100 p-2 text-stone-500 hover:bg-stone-200 hover:text-stone-800 transition"
          aria-label="Reset building viewer"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-stone-50 border border-stone-100 p-3">
          <p className="text-[9px] uppercase tracking-widest text-stone-400">Floors</p>
          <p className="font-black text-stone-900">{definition.building.stories}</p>
        </div>
        <div className="rounded-xl bg-stone-50 border border-stone-100 p-3">
          <p className="text-[9px] uppercase tracking-widest text-stone-400">Height</p>
          <p className="font-black text-stone-900">
            {Math.round(definition.building.totalHeight_m)}m
          </p>
        </div>
        <div className="rounded-xl bg-stone-50 border border-stone-100 p-3 col-span-2">
          <p className="text-[9px] uppercase tracking-widest text-stone-400">Footprint</p>
          <p className="font-black text-stone-900">
            {Math.round(definition.building.footprint.width_m)}m x{" "}
            {Math.round(definition.building.footprint.depth_m)}m
          </p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
          Render Quality
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["low", "medium", "high"] as QualityTier[]).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setQualityTier(tier)}
              className={`rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase transition ${
                qualityTier === tier
                  ? "bg-[#1a2035] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2 text-[10px] text-stone-500">
          <input
            type="checkbox"
            checked={autoQuality}
            onChange={(event) => setAutoQuality(event.target.checked)}
            className="accent-[#F5C518]"
          />
          Auto-adjust quality when FPS drops
        </label>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
          View Mode
        </p>
        <div className="grid grid-cols-2 gap-2">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  viewMode === mode.id
                    ? "bg-[#1a2035] text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">
          Active Floor
        </label>
        <select
          value={activeLevel}
          onChange={(event) => setActiveLevel(Number(event.target.value))}
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-800"
        >
          {definition.levels.map((level) => (
            <option key={level.level} value={level.level}>
              {level.name}
            </option>
          ))}
        </select>
      </div>

      {viewMode === "section" && (
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 block">
            Section Plane: {Math.round(sectionPlaneY)}m
          </label>
          <input
            type="range"
            min={0}
            max={definition.building.totalHeight_m}
            value={sectionPlaneY}
            onChange={(event) => setSectionPlaneY(Number(event.target.value))}
            className="w-full accent-[#F5C518]"
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setMeasurementsVisible(!measurementsVisible)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-200 transition"
      >
        <Ruler className="w-3.5 h-3.5" />
        {measurementsVisible ? "Hide Labels" : "Show Labels"}
      </button>

      <div className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
          {active?.name ?? "Active Level"}
        </p>
        <div className="space-y-1 text-stone-600">
          <p>
            Rooms: <span className="font-bold text-stone-900">{active?.rooms.length ?? 0}</span>
          </p>
          <p>
            Walls: <span className="font-bold text-stone-900">{active?.walls.length ?? 0}</span>
          </p>
          <p>
            Windows/Doors:{" "}
            <span className="font-bold text-stone-900">
              {active?.walls.reduce((sum, wall) => sum + (wall.openings?.length ?? 0), 0) ?? 0}
            </span>
          </p>
        </div>
      </div>

      {room && (
        <div className="rounded-xl border border-[#F5C518]/30 bg-[#F5C518]/10 p-3 text-xs">
          <p className="font-black text-stone-900">{room.name}</p>
          <p className="text-stone-600 mt-1 capitalize">{room.type}</p>
          <p className="text-stone-600 mt-1">
            Area:{" "}
            <span className="font-bold text-stone-900">
              {Math.round(polygonArea(room.polygon))} m²
            </span>
          </p>
        </div>
      )}
    </aside>
  );
}
