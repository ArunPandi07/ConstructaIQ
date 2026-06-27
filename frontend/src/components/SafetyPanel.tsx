import { ShieldAlert, AlertTriangle, Wind, CloudRain, ShieldCheck } from "lucide-react";
import { renderStructuredValue } from "../utils/renderStructuredValue";

interface Props {
  data: Record<string, unknown> | null | undefined;
}

export default function SafetyPanel({ data }: Props) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <p className="text-sm text-stone-500 py-6 text-center">
        No safety assessment yet. Run analyze to populate SafetyAlertAgent output.
      </p>
    );
  }

  // Parse structured fields
  const safetyRisks = data.safety_risks;
  const craneStops = data.crane_stops;
  const weatherConstraints = data.weather_constraints;
  const recommendations = data.recommendations;

  // Evaluate risk level for header indicator
  const riskStr = String(safetyRisks || "").toLowerCase();
  const hasHighRisk = riskStr.includes("high") || riskStr.includes("hazard") || riskStr.includes("critical") || String(craneStops || "").toLowerCase().includes("stop");

  // Filter out mapped keys for fallback
  const mappedKeys = ["safety_risks", "crane_stops", "weather_constraints", "recommendations"];
  const extraEntries = Object.entries(data).filter(([key]) => !mappedKeys.includes(key));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <h3 className="text-base font-bold text-stone-900">Safety &amp; Compliance Audit</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
          hasHighRisk 
            ? "bg-red-50 text-red-700 border border-red-200 animate-pulse" 
            : "bg-amber-50 text-amber-700 border border-amber-200"
        }`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          {hasHighRisk ? "Active Safety Alerts" : "Cautionary Warnings"}
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Safety Risks */}
        <div className="glass-card p-5 flex flex-col justify-between border-t-4 border-t-red-500">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Identified Hazard Risks</h4>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed font-medium">
              {renderStructuredValue(safetyRisks)}
            </p>
          </div>
        </div>

        {/* Crane Limits */}
        <div className="glass-card p-5 flex flex-col justify-between border-t-4 border-t-blue-500">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wind className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Crane Operational Limits</h4>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed font-medium">
              {renderStructuredValue(craneStops)}
            </p>
          </div>
        </div>

        {/* Weather Limits */}
        <div className="glass-card p-5 flex flex-col justify-between border-t-4 border-t-sky-500">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CloudRain className="w-4 h-4 text-sky-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Weather &amp; Climate Constraints</h4>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed font-medium">
              {renderStructuredValue(weatherConstraints)}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {!!recommendations && (
        <div className="glass-card p-5 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-red-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Incident Mitigation &amp; Safety Protocols</h4>
          </div>
          {Array.isArray(recommendations) ? (
            <ul className="space-y-2">
              {recommendations.map((rec: unknown, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-700 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Additional Safety Details</h4>
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
