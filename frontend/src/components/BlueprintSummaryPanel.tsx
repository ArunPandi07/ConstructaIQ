import { motion } from "framer-motion";
import { Ruler } from "lucide-react";
import type { BlueprintSummaryData } from "../types";
import type { BuildingDefinition } from "../types/building";
import {
  formatBlueprintMetricValue,
  formatSquareFootage,
} from "../utils/formatMetrics";
import { normalizeBlueprintSummary } from "../utils/normalizeBlueprintSummary";
import { renderStructuredValue } from "../utils/renderStructuredValue";

interface Props {
  summary: BlueprintSummaryData | null | undefined;
  buildingDefinition?: BuildingDefinition | null;
  floors: number;
  squareFootage: string;
  complexity: string;
}

const LABELS: Record<string, string> = {
  construction_type: "Construction Type",
  structural_steel_tons: "Structural Steel (tons)",
  concrete_cy: "Concrete (CY)",
  curtain_wall_sf: "Curtain Wall (SF)",
  lateral_system: "Lateral System",
  foundation_type: "Foundation Type",
  stories_below_grade: "Stories Below Grade",
};

const STRUCTURAL_LABELS: Record<string, string> = {
  concrete_cy: "Concrete (CY)",
  structural_steel_tons: "Structural Steel (tons)",
  structural_steel_ton: "Structural Steel (tons)",
  rebar_tons: "Rebar (tons)",
  rebar_ton: "Rebar (tons)",
  curtain_wall_sf: "Curtain Wall (SF)",
  metal_deck_sf: "Metal Deck (SF)",
  lateral_system: "Lateral System",
};

function formatFootprint(
  footprint: { width_m?: number; depth_m?: number } | null | undefined,
): string | null {
  if (!footprint) return null;
  const width = footprint.width_m;
  const depth = footprint.depth_m;
  if (width == null && depth == null) return null;
  if (width != null && depth != null) {
    return `${width} m × ${depth} m`;
  }
  return width != null ? `${width} m wide` : `${depth} m deep`;
}

export default function BlueprintSummaryPanel({
  summary,
  buildingDefinition,
  floors,
  squareFootage,
  complexity,
}: Props) {
  const normalized = normalizeBlueprintSummary(summary);
  const stories =
    summary?.stories_above_grade != null
      ? Number(summary.stories_above_grade)
      : floors;

  const footprint =
    normalized.footprint ??
    buildingDefinition?.building?.footprint ??
    null;
  const footprintLabel = formatFootprint(footprint);

  const scalarEntries = Object.entries(normalized.scalars).filter(
    ([, value]) => value != null,
  );
  const structuralEntries = Object.entries(normalized.structuralQuantities).filter(
    ([, value]) => value != null,
  );
  const mepEntries = normalized.mepHighlights
    ? Object.entries(normalized.mepHighlights).filter(([, value]) => value != null)
    : [];

  const building = buildingDefinition?.building;
  const facade = buildingDefinition?.facade;
  const levelCount =
    normalized.levelCount || buildingDefinition?.levels?.length || 0;

  const hasDetails =
    scalarEntries.length > 0 ||
    structuralEntries.length > 0 ||
    mepEntries.length > 0 ||
    footprintLabel != null ||
    building != null;

  const formattedSqFt = formatSquareFootage(squareFootage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card p-5"
    >
      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-4">
        <Ruler className="w-4 h-4 text-[#F5C518]" />
        Blueprint Intelligence
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-xs">
        <div className="bg-stone-50 rounded-lg p-3 border border-stone-100">
          <p className="text-[9px] text-stone-400 uppercase">Stories</p>
          <p className="font-bold text-stone-900">{stories}</p>
        </div>
        <div className="bg-stone-50 rounded-lg p-3 border border-stone-100">
          <p className="text-[9px] text-stone-400 uppercase">Sq Footage</p>
          <p className="font-bold text-stone-900 tabular-nums">{formattedSqFt}</p>
        </div>
        <div className="bg-stone-50 rounded-lg p-3 border border-stone-100">
          <p className="text-[9px] text-stone-400 uppercase">Complexity</p>
          <p className="font-bold text-stone-900">{complexity}</p>
        </div>
      </div>

      {!summary || !hasDetails ? (
        <p className="text-xs text-stone-500">
          Blueprint details populate after BlueprintAgent runs.
        </p>
      ) : (
        <div className="space-y-4 text-xs">
          {footprintLabel && (
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
              <p className="text-[9px] font-bold text-stone-400 uppercase mb-1">
                Footprint
              </p>
              <p className="font-semibold text-stone-800">{footprintLabel}</p>
            </div>
          )}

          {structuralEntries.length > 0 && (
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100 space-y-2">
              <p className="text-[9px] font-bold text-stone-400 uppercase">
                Structural Quantities
              </p>
              {structuralEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between border-b border-stone-100 last:border-0 pb-1.5 last:pb-0 gap-4"
                >
                  <span className="text-stone-500 shrink-0">
                    {STRUCTURAL_LABELS[key] ?? key.replace(/_/g, " ")}
                  </span>
                  <span className="font-semibold text-stone-800 text-right">
                    {formatBlueprintMetricValue(key, value)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {scalarEntries.length > 0 && (
            <div className="space-y-2">
              {scalarEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between border-b border-stone-100 py-2 gap-4"
                >
                  <span className="text-stone-500 shrink-0">
                    {LABELS[key] ?? key.replace(/_/g, " ")}
                  </span>
                  <span className="font-semibold text-stone-800 text-right">
                    {formatBlueprintMetricValue(key, value)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {mepEntries.length > 0 && (
            <div className="p-3 bg-stone-50 rounded-lg space-y-2 border border-stone-100">
              <p className="text-[9px] font-bold text-stone-400 uppercase">
                MEP Highlights
              </p>
              {mepEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between text-[10px] text-stone-600 gap-4 border-b border-stone-100 last:border-0 pb-1.5 last:pb-0"
                >
                  <span className="shrink-0">{key.replace(/_/g, " ")}</span>
                  <div className="font-semibold text-stone-800 text-right">
                    {renderStructuredValue(value)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {building && (
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100 space-y-2">
              <p className="text-[9px] font-bold text-stone-400 uppercase">
                Building Overview
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {building.type && (
                  <div className="flex justify-between gap-2">
                    <span className="text-stone-500">Type</span>
                    <span className="font-semibold text-stone-800">
                      {String(building.type).replace(/_/g, " ")}
                    </span>
                  </div>
                )}
                {building.stories != null && (
                  <div className="flex justify-between gap-2">
                    <span className="text-stone-500">Stories</span>
                    <span className="font-semibold text-stone-800">
                      {building.stories}
                    </span>
                  </div>
                )}
                {building.totalHeight_m != null && (
                  <div className="flex justify-between gap-2">
                    <span className="text-stone-500">Total Height</span>
                    <span className="font-semibold text-stone-800">
                      {building.totalHeight_m} m
                    </span>
                  </div>
                )}
                {building.roof_type && (
                  <div className="flex justify-between gap-2">
                    <span className="text-stone-500">Roof</span>
                    <span className="font-semibold text-stone-800">
                      {String(building.roof_type).replace(/_/g, " ")}
                    </span>
                  </div>
                )}
                {building.construction_type && (
                  <div className="flex justify-between gap-2">
                    <span className="text-stone-500">Construction</span>
                    <span className="font-semibold text-stone-800">
                      {building.construction_type}
                    </span>
                  </div>
                )}
                {facade?.material && (
                  <div className="flex justify-between gap-2">
                    <span className="text-stone-500">Cladding</span>
                    <span className="font-semibold text-stone-800">
                      {String(facade.material).replace(/_/g, " ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {levelCount > 0 && (
            <p className="text-[10px] text-stone-500 italic">
              {levelCount} level{levelCount === 1 ? "" : "s"} defined — view in 3D
              preview above.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
