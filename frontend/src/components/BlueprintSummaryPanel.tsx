import { Ruler } from "lucide-react";
import type { BlueprintSummaryData } from "../types";
import {
  formatBlueprintMetricValue,
  formatSquareFootage,
} from "../utils/formatMetrics";

interface Props {
  summary: BlueprintSummaryData | null | undefined;
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
};

const HIDDEN_WHEN_TOP_KPI = new Set(["stories_above_grade", "floor_count"]);

export default function BlueprintSummaryPanel({
  summary,
  floors,
  squareFootage,
  complexity,
}: Props) {
  const stories =
    summary?.stories_above_grade != null
      ? Number(summary.stories_above_grade)
      : floors;

  const entries = summary
    ? Object.entries(summary).filter(([key, value]) => {
        if (value == null || key === "mep_highlights") return false;
        if (HIDDEN_WHEN_TOP_KPI.has(key)) return false;
        return true;
      })
    : [];

  const formattedSqFt = formatSquareFootage(squareFootage);

  return (
    <div className="glass-card p-5">
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
      {!summary || entries.length === 0 ? (
        <p className="text-xs text-stone-500">
          Blueprint details populate after BlueprintAgent runs.
        </p>
      ) : (
        <div className="space-y-2 text-xs">
          {entries.map(([key, value]) => (
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
          {summary.mep_highlights &&
            typeof summary.mep_highlights === "object" && (
              <div className="mt-3 p-3 bg-stone-50 rounded-lg space-y-1">
                <p className="text-[9px] font-bold text-stone-400 uppercase mb-1">
                  MEP Highlights
                </p>
                {Object.entries(summary.mep_highlights as Record<string, unknown>).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between text-[10px] text-stone-600 gap-2"
                    >
                      <span>{key.replace(/_/g, " ")}</span>
                      <span className="font-semibold text-stone-800">
                        {formatBlueprintMetricValue(key, value)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
