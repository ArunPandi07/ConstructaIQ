import { MapPin, CheckCircle2, AlertTriangle, Leaf, Ruler, ClipboardList } from "lucide-react";
import { renderStructuredValue } from "../utils/renderStructuredValue";

interface Props {
  data: Record<string, unknown> | null | undefined;
}

export default function ZoningPanel({ data }: Props) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <p className="text-sm text-stone-500 py-6 text-center">
        No zoning assessment yet. Run analyze to populate ZoningAgent output.
      </p>
    );
  }

  // Parse structured fields
  const zoningCompliance = data.zoning_compliance;
  const environmentalImpact = data.environmental_impact;
  const heightLimits = data.height_limits;
  const recommendations = data.recommendations;

  // Find compliance status for styling
  const complianceStr = String(zoningCompliance || "").toLowerCase();
  const isCompliant = complianceStr.includes("compliant") || complianceStr.includes("yes") || complianceStr.includes("passed");

  // Filter out the main mapped keys for fallback rendering
  const mappedKeys = ["zoning_compliance", "environmental_impact", "height_limits", "recommendations"];
  const extraEntries = Object.entries(data).filter(([key]) => !mappedKeys.includes(key));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-stone-900">Zoning &amp; Environmental Audit</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
          isCompliant 
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
            : "bg-amber-50 text-amber-700 border border-amber-200"
        }`}>
          {isCompliant ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Compliant
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              Review Needed
            </>
          )}
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Compliance Details */}
        <div className="glass-card p-5 flex flex-col justify-between border-t-4 border-t-amber-500">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Zoning Code Compliance</h4>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed font-medium">
              {renderStructuredValue(zoningCompliance)}
            </p>
          </div>
        </div>

        {/* Height Limits */}
        <div className="glass-card p-5 flex flex-col justify-between border-t-4 border-t-blue-500">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Elevation &amp; Height Limits</h4>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed font-medium">
              {renderStructuredValue(heightLimits)}
            </p>
          </div>
        </div>

        {/* Environmental Impact */}
        <div className="glass-card p-5 flex flex-col justify-between border-t-4 border-t-emerald-500">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Environmental Constraints</h4>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed font-medium">
              {renderStructuredValue(environmentalImpact)}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {!!recommendations && (
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Compliance Recommendations</h4>
          </div>
          {Array.isArray(recommendations) ? (
            <ul className="space-y-2">
              {recommendations.map((rec: unknown, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-700 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  <span>{String(rec)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-700 leading-relaxed font-medium">
              {renderStructuredValue(recommendations)}
            </p>
          )}
        </div>
      )}

      {/* Fallback Extra Entries */}
      {extraEntries.length > 0 && (
        <div className="border-t border-stone-200 pt-4 mt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Additional Audit Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {extraEntries.map(([key, value]) => (
              <div key={key} className="glass-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                  {key.replace(/_/g, " ")}
                </p>
                <div className="text-xs text-stone-700">
                  {renderStructuredValue(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
