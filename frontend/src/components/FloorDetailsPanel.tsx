import { Box, Layers3, Ruler, X } from "lucide-react";
import type { Building3DParams } from "./BuildingModel3D";
import type { BlueprintSummaryData } from "../types";
import { formatSquareFootage } from "../utils/formatMetrics";

interface Props {
  selectedFloor: number | null;
  params: Building3DParams;
  squareFootage: string;
  complexity: string;
  summary?: BlueprintSummaryData | null;
  onClearSelection: () => void;
}

function formatNumber(value: number | undefined, suffix = ""): string {
  if (value == null || !Number.isFinite(value)) return "-";
  return `${Math.round(value).toLocaleString()}${suffix}`;
}

function formatArea(value: number): string {
  return `${Math.round(value).toLocaleString()} SF`;
}

function mepHighlights(summary?: BlueprintSummaryData | null): string[] {
  const highlights = summary?.mep_highlights;
  if (!highlights) return [];
  return Object.entries(highlights)
    .filter(([, value]) => value != null && String(value).trim())
    .map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value)}`);
}

export default function FloorDetailsPanel({
  selectedFloor,
  params,
  squareFootage,
  complexity,
  summary,
  onClearSelection,
}: Props) {
  const floorArea = (params.width * params.depth) / 0.0929;
  const materialDivider = Math.max(params.totalFloors, 1);
  const selectedElevation =
    selectedFloor == null ? null : (selectedFloor + 1) * params.floorHeight;
  const highlights = mepHighlights(summary);

  return (
    <aside className="glass-card p-5 h-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
            3D Model Inspector
          </p>
          <h3 className="text-sm font-black text-stone-900 mt-1">
            {selectedFloor == null
              ? "All Floors"
              : `Floor ${selectedFloor + 1} of ${params.totalFloors}`}
          </h3>
        </div>
        {selectedFloor != null && (
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-lg bg-stone-100 p-2 text-stone-500 hover:bg-stone-200 hover:text-stone-800 transition"
            aria-label="Clear floor selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-3 text-xs">
        <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
          <div className="flex items-center gap-2 text-stone-500 font-bold mb-2">
            <Layers3 className="w-4 h-4 text-[#F5C518]" />
            Geometry
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-stone-400">
                Elevation
              </p>
              <p className="font-black text-stone-900">
                {selectedElevation == null
                  ? `${formatNumber(params.totalFloors * params.floorHeight, "m")}`
                  : `${formatNumber(selectedElevation, "m")}`}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-stone-400">
                Floor Area
              </p>
              <p className="font-black text-stone-900">{formatArea(floorArea)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-stone-400">
                Footprint
              </p>
              <p className="font-black text-stone-900">
                {Math.round(params.width)}m × {Math.round(params.depth)}m
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-stone-400">
                Complexity
              </p>
              <p className="font-black text-stone-900">{complexity}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-100 bg-white p-3">
          <div className="flex items-center gap-2 text-stone-500 font-bold mb-2">
            <Box className="w-4 h-4 text-[#F5C518]" />
            Estimated Materials
          </div>
          <div className="space-y-2">
            <div className="flex justify-between gap-3 border-b border-stone-100 pb-2">
              <span className="text-stone-500">Structural steel</span>
              <span className="font-bold text-stone-900">
                {formatNumber(params.steelTons ? params.steelTons / materialDivider : undefined, " tons")}
              </span>
            </div>
            <div className="flex justify-between gap-3 border-b border-stone-100 pb-2">
              <span className="text-stone-500">Concrete</span>
              <span className="font-bold text-stone-900">
                {formatNumber(params.concreteCY ? params.concreteCY / materialDivider : undefined, " CY")}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-stone-500">Curtain wall</span>
              <span className="font-bold text-stone-900">
                {formatNumber(
                  params.curtainWallSF ? params.curtainWallSF / materialDivider : undefined,
                  " SF",
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
          <div className="flex items-center gap-2 text-stone-500 font-bold mb-2">
            <Ruler className="w-4 h-4 text-[#F5C518]" />
            Blueprint Inputs
          </div>
          <div className="space-y-2">
            <div className="flex justify-between gap-3">
              <span className="text-stone-500">Source area</span>
              <span className="font-bold text-stone-900 text-right">{formatSquareFootage(squareFootage)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-stone-500">Lateral system</span>
              <span className="font-bold text-stone-900 text-right">
                {params.lateralSystem ?? "-"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-stone-500">Construction</span>
              <span className="font-bold text-stone-900 text-right">
                {params.constructionType ?? "-"}
              </span>
            </div>
          </div>
        </div>

        {highlights.length > 0 && (
          <div className="rounded-xl border border-[#F5C518]/25 bg-[#F5C518]/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
              MEP Highlights
            </p>
            <ul className="space-y-1 text-stone-700">
              {highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
