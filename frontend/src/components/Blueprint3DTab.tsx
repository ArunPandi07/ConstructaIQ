import { Component, useEffect, useMemo, type ReactNode } from "react";
import { Box, MousePointerClick, ScanLine } from "lucide-react";
import BuildingInfoBadge from "./building3d/BuildingInfoBadge";
import { BuildingScene, ViewerControls } from "./building3d";
import { useBuildingStore } from "../stores/buildingStore";
import type { BlueprintSummaryData, BuildingDefinition } from "../types";

interface Props {
  summary: BlueprintSummaryData | null | undefined;
  buildingDefinition?: BuildingDefinition | null;
  floors: number;
  squareFootage: string;
  complexity: string;
}

const defaultSquareFootage = 150000;
const defaultFloors = 3;

function numericValue(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSquareFootage(value: string): number {
  return numericValue(value) ?? defaultSquareFootage;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getConstructionColor(type: string | undefined): string {
  const normalized = type?.toLowerCase() ?? "";
  if (normalized.includes("steel")) return "#9CA3AF";
  if (normalized.includes("concrete")) return "#D4B896";
  if (normalized.includes("wood") || normalized.includes("timber")) return "#8B7355";
  if (normalized.includes("masonry")) return "#BFA58A";
  return "#E0E7EF";
}

function fallbackBuildingDefinition(
  summary: BlueprintSummaryData | null | undefined,
  floors: number,
  squareFootage: string,
): BuildingDefinition {
  const totalFloors = clamp(
    Math.round(summary?.stories_above_grade ?? floors ?? defaultFloors),
    1,
    120,
  );
  const sfNum = parseSquareFootage(squareFootage);
  const squareMetersPerFloor = (sfNum * 0.0929) / totalFloors;
  const depth = clamp(Math.sqrt(squareMetersPerFloor * 0.75), 12, 90);
  const width = clamp(squareMetersPerFloor / depth, 14, 120);
  const constructionType =
    typeof summary?.construction_type === "string"
      ? summary.construction_type
      : undefined;
  const floorHeight = 4;
  const levels = Array.from({ length: totalFloors }, (_, level) => ({
    level,
    name: level === 0 ? "Ground Floor" : `Level ${level + 1}`,
    height_m: floorHeight,
    floorplate: { width_m: width, depth_m: depth },
    rooms: [
      {
        id: `l${level}_open_plan`,
        name: level === 0 ? "Entry / Lobby" : "Open Floor Plate",
        type: level === 0 ? "lobby" : "office",
        height_m: floorHeight,
        polygon: [
          { x: 0.8, y: 0.8 },
          { x: width - 0.8, y: 0.8 },
          { x: width - 0.8, y: depth - 0.8 },
          { x: 0.8, y: depth - 0.8 },
        ],
      },
    ],
    walls: [
      {
        id: `l${level}_front`,
        start: { x: 0, y: 0 },
        end: { x: width, y: 0 },
        thickness_m: 0.3,
        type: "exterior" as const,
        material: getConstructionColor(constructionType),
        openings: [
          {
            id: `l${level}_front_window`,
            type: "window" as const,
            offset_m: Math.max(width * 0.2, 1),
            width_m: Math.min(3, width * 0.2),
            height_m: 1.7,
            sill_m: 0.9,
          },
        ],
      },
      {
        id: `l${level}_right`,
        start: { x: width, y: 0 },
        end: { x: width, y: depth },
        thickness_m: 0.3,
        type: "exterior" as const,
        material: "concrete",
        openings: [],
      },
      {
        id: `l${level}_rear`,
        start: { x: width, y: depth },
        end: { x: 0, y: depth },
        thickness_m: 0.3,
        type: "exterior" as const,
        material: "concrete",
        openings: [],
      },
      {
        id: `l${level}_left`,
        start: { x: 0, y: depth },
        end: { x: 0, y: 0 },
        thickness_m: 0.3,
        type: "exterior" as const,
        material: "concrete",
        openings: [],
      },
    ],
    stairs: [
      {
        id: `l${level}_stair`,
        position: { x: width * 0.72, y: depth * 0.42 },
        width_m: 2.4,
        depth_m: 4,
        direction: "both" as const,
      },
    ],
  }));

  return {
    building: {
      type: "office_tower",
      stories: totalFloors,
      totalHeight_m: totalFloors * floorHeight,
      footprint: { width_m: width, depth_m: depth },
      construction_type: constructionType ?? null,
      roof_type: "flat",
    },
    levels,
    facade: {
      balconies: false,
      balcony_depth_m: 0,
      railing_height_m: 1.1,
      window_pattern: "grid",
      material: "concrete_with_glass",
    },
  };
}

function hasBlueprintData(summary: BlueprintSummaryData | null | undefined): boolean {
  return Boolean(summary && Object.values(summary).some((value) => value != null));
}

class WebGLErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-stone-500 gap-3">
          <p className="text-sm font-semibold text-stone-700">3D view failed to load</p>
          <p className="text-xs text-stone-400 text-center max-w-xs">
            WebGL context could not be initialized. This can happen if too many 3D views are open.
          </p>
          <button
            onClick={() => this.setState({ failed: false })}
            className="text-xs px-3 py-1.5 bg-stone-100 rounded-lg hover:bg-stone-200 transition font-semibold"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Blueprint3DTab({
  summary,
  buildingDefinition,
  floors,
  squareFootage,
}: Props) {
  const setDefinition = useBuildingStore((state) => state.setDefinition);
  const definition = useMemo(
    () =>
      buildingDefinition ??
      (hasBlueprintData(summary)
        ? fallbackBuildingDefinition(summary, floors, squareFootage)
        : null),
    [buildingDefinition, summary, floors, squareFootage],
  );

  const definitionSource = buildingDefinition
    ? "API buildingDefinition"
    : hasBlueprintData(summary)
      ? "fallback heuristic"
      : "none";

  useEffect(() => {
    setDefinition(definition);
    return () => setDefinition(null);
  }, [definition, setDefinition]);

  if (!definition) {
    return (
      <div className="glass-card p-6 text-center">
        <Box className="w-10 h-10 mx-auto text-stone-300 mb-3" />
        <h3 className="text-sm font-black text-stone-900">
          3D blueprint view unavailable
        </h3>
        <p className="text-xs text-stone-500 mt-1 max-w-xl mx-auto">
          Run BlueprintAgent to populate the extracted structural data required for
          a parametric 3D building model.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Parametric Blueprint Model
            </p>
            <h3 className="text-sm font-black text-stone-900 mt-1 flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-[#F5C518]" />
              Blueprint-Faithful 3D Building Viewer
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Generated from structured BlueprintAgent outputs: room polygons,
              wall paths, openings, stairs, facade rules, and dimensions.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono text-stone-500">
              <span className="rounded-md bg-stone-100 px-2 py-0.5">
                stories: {definition.building.stories ?? "-"}
              </span>
              <span className="rounded-md bg-stone-100 px-2 py-0.5">
                footprint:{" "}
                {definition.building.footprint?.width_m ?? "?"}×
                {definition.building.footprint?.depth_m ?? "?"} m
              </span>
              <span className="rounded-md bg-stone-100 px-2 py-0.5">
                levels: {definition.levels.length}
              </span>
              <span className="rounded-md bg-stone-100 px-2 py-0.5">
                source: {definitionSource}
              </span>
            </div>
          </div>
          <span className="rounded-xl bg-[#F5C518]/15 px-3 py-2 text-xs font-bold text-stone-800">
            {definition.levels.length} modeled floor
            {definition.levels.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8">
            <div className="relative h-[560px] overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 shadow-inner">
              <BuildingInfoBadge definition={definition} />
              <WebGLErrorBoundary>
                <BuildingScene definition={definition} />
              </WebGLErrorBoundary>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-stone-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 font-semibold">
                <MousePointerClick className="w-3 h-3" />
                Click rooms to inspect
              </span>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 font-semibold">
                Drag to orbit
              </span>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 font-semibold">
                Scroll to zoom
              </span>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 font-semibold">
                ESC clears selection
              </span>
            </div>
          </div>

          <div className="xl:col-span-4">
            <ViewerControls definition={definition} />
          </div>
        </div>
      </div>
    </div>
  );
}
