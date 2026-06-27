import { DollarSign, TrendingUp, Sparkles, Layers } from "lucide-react";
import { renderStructuredValue } from "../utils/renderStructuredValue";

interface Props {
  data: Record<string, unknown> | null | undefined;
}

function formatCurrency(val: unknown): string {
  if (val == null) return "—";
  // If it's already a formatted string like "$1,200,000", return it
  if (typeof val === "string" && val.includes("$")) return val;
  const num = Number(val);
  if (!isNaN(num)) {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 0 
    }).format(num);
  }
  return String(val);
}

export default function BudgetAnalysisPanel({ data }: Props) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <p className="text-sm text-stone-500 py-6 text-center">
        No budget analysis yet. Run analyze to populate BudgetAgent output.
      </p>
    );
  }

  // Parse structured fields
  const estimatedBudget = data.estimated_budget;
  const commodityVariance = data.commodity_variance;
  const costBreakdown = data.cost_breakdown;
  const recommendations = data.recommendations;

  // Process breakdown
  const breakdownEntries = costBreakdown && typeof costBreakdown === "object"
    ? Object.entries(costBreakdown as Record<string, unknown>)
    : [];

  const breakdownTotal = breakdownEntries.reduce((acc, [_, v]) => {
    const val = Number(v);
    return isNaN(val) ? acc : acc + val;
  }, 0);

  // Filter out mapped keys for fallback
  const mappedKeys = ["estimated_budget", "commodity_variance", "cost_breakdown", "recommendations"];
  const extraEntries = Object.entries(data).filter(([key]) => !mappedKeys.includes(key));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-stone-900">Budget &amp; Cost Estimation</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Estimated Total Cost</p>
          <p className="text-lg font-extrabold text-stone-900">{formatCurrency(estimatedBudget)}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Cost Breakdown */}
        <div className="glass-card p-5 border-t-4 border-t-amber-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Expense Allocation</h4>
            </div>
            
            {breakdownEntries.length > 0 ? (
              <div className="space-y-3.5">
                {breakdownEntries.map(([key, value]) => {
                  const valNum = Number(value);
                  const pct = breakdownTotal > 0 && !isNaN(valNum) 
                    ? Math.round((valNum / breakdownTotal) * 100) 
                    : 0;

                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-stone-700">
                        <span className="capitalize">{key.replace(/_/g, " ")}</span>
                        <span>{formatCurrency(value)} {pct > 0 && `(${pct}%)`}</span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-stone-700 font-medium">
                {renderStructuredValue(costBreakdown)}
              </p>
            )}
          </div>
        </div>

        {/* Commodity Variance */}
        <div className="glass-card p-5 border-t-4 border-t-blue-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Commodity Price Fluctuations</h4>
            </div>
            <div className="text-sm text-stone-700 leading-relaxed font-medium">
              {renderStructuredValue(commodityVariance)}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {!!recommendations && (
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Cost Control Recommendations</h4>
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Additional Cost Details</h4>
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
