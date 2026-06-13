import { DollarSign, Layers, TrendingUp } from "lucide-react";
import type { BudgetBreakdown, ProjectIntelligenceData } from "../types";

interface Props {
  intelligence: ProjectIntelligenceData;
  supplierRows: Array<Record<string, unknown>>;
}

export default function BudgetBreakdownPanel({ intelligence, supplierRows }: Props) {
  const breakdown: BudgetBreakdown | null | undefined = intelligence.budgetBreakdown;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
            Contract Value
          </p>
          <p className="text-2xl font-black text-stone-900">{intelligence.budget}</p>
          <DollarSign className="w-5 h-5 text-[#E2B30D] mt-2" />
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
            Material Cost
          </p>
          <p className="text-2xl font-black text-stone-900">
            {breakdown?.material ?? "N/A"}
          </p>
          <Layers className="w-5 h-5 text-[#E2B30D] mt-2" />
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
            Labor Cost
          </p>
          <p className="text-2xl font-black text-stone-900">
            {breakdown?.labor ?? "N/A"}
          </p>
          <TrendingUp className="w-5 h-5 text-[#E2B30D] mt-2" />
        </div>
      </div>

      {breakdown && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-stone-900 mb-4">Budget Breakdown</h3>
          <div className="space-y-2 text-xs">
            {[
              { label: "Total", value: breakdown.total },
              { label: "Material", value: breakdown.material },
              { label: "Labor", value: breakdown.labor },
              { label: "Equipment", value: breakdown.equipment },
              { label: "Contingency", value: breakdown.contingency },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between border-b border-stone-100 py-2"
              >
                <span className="text-stone-500">{row.label}</span>
                <span className="font-bold text-stone-800">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {supplierRows.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-stone-900 mb-3">Procurement Lines</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-stone-400 border-b border-stone-100">
                  <th className="pb-2">Material</th>
                  <th className="pb-2">Supplier</th>
                  <th className="pb-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {supplierRows.map((s, i) => (
                  <tr key={i} className="border-b border-stone-50">
                    <td className="py-2 font-semibold">
                      {String(s.material_name ?? "—")}
                    </td>
                    <td className="py-2 text-stone-500">
                      {String(s.supplier_name ?? "—")}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {s.total_cost != null
                        ? `$${Number(s.total_cost).toLocaleString()}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
