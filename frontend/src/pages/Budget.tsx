import { useState } from "react";
import { TrendingUp, DollarSign, Layers, FileSpreadsheet, ArrowRight } from "lucide-react";

interface CostEstimates {
  material: string; weightQty: string; budgetAllocated: string; variancePct: number;
}

const budgetItems: CostEstimates[] = [
  { material: "ASTM Structural Steel beams", weightQty: "180 Tons", budgetAllocated: "$950k", variancePct: 2.4 },
  { material: "C40/50 Reinforced Concrete", weightQty: "1,420 m³", budgetAllocated: "$680k", variancePct: -1.2 },
  { material: "Hydration retarders & chemicals", weightQty: "24 barrels", budgetAllocated: "$80k", variancePct: 4.8 },
  { material: "Scaffolding & Timber shuttering", weightQty: "12,500 sq.ft", budgetAllocated: "$140k", variancePct: 0.0 },
  { material: "Site Egress Doors & Clearances", weightQty: "12 custom assemblies", budgetAllocated: "$120k", variancePct: 15.2 },
];

export default function Budget() {
  const [items] = useState<CostEstimates[]>(budgetItems);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="kpi-card p-5 relative overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: "var(--text-muted)" }}>Target Project Fund</p>
          <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>$2.5M</p>
          <p className="text-[10px] font-semibold mt-1" style={{ color: "var(--green-primary)" }}>● Capped Fixed Price Design-Build Scope</p>
          <div className="absolute right-4 bottom-4 p-2 rounded-xl" style={{ background: "var(--blue-bg)", color: "var(--blue-primary)" }}><DollarSign className="w-5 h-5" /></div>
        </div>
        <div className="kpi-card p-5 relative overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: "var(--text-muted)" }}>Raw Material Allocation</p>
          <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>$1.85M</p>
          <p className="text-[10px] font-semibold mt-1" style={{ color: "var(--text-secondary)" }}>74% of available construct reserves</p>
          <div className="absolute right-4 bottom-4 p-2 rounded-xl" style={{ background: "var(--blue-bg)", color: "var(--blue-primary)" }}><Layers className="w-5 h-5" /></div>
        </div>
        <div className="kpi-card p-5 relative overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: "var(--text-muted)" }}>Earmarked Contingencies</p>
          <p className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>$300k</p>
          <p className="text-[10px] font-semibold mt-1" style={{ color: "var(--blue-primary)" }}>12% protective risk buffer layer</p>
          <div className="absolute right-4 bottom-4 p-2 rounded-xl" style={{ background: "var(--blue-bg)", color: "var(--blue-primary)" }}><TrendingUp className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div>
          <h2 className="text-base font-extrabold tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <FileSpreadsheet className="w-5 h-5" style={{ color: "var(--blue-primary)" }} />
            Quantitative Materials Cost Ledger
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>            Reconstructed by SupplierAgent vs regional commodity steel index pricing models</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }} className="font-bold">
                <th className="pb-3 pt-1">Material Description</th>
                <th className="pb-3 pt-1">Structural Weights / Qty</th>
                <th className="pb-3 pt-1">Allocated Raw Cost</th>
                <th className="pb-3 pt-1 text-right">Commodity Variance</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }} className="transition">
                  <td className="py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{item.material}</td>
                  <td className="py-3 font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>{item.weightQty}</td>
                  <td className="py-3 font-extrabold" style={{ color: "var(--text-primary)" }}>{item.budgetAllocated}</td>
                  <td className="py-3 text-right font-mono font-bold"
                    style={{ color: item.variancePct > 4 ? "#dc2626" : item.variancePct === 0 ? "var(--text-muted)" : item.variancePct < 0 ? "var(--green-primary)" : "var(--blue-primary)" }}>
                    {item.variancePct > 0 ? `+${item.variancePct}%` : `${item.variancePct}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 flex items-start gap-2.5 text-xs leading-relaxed justify-between" style={{ background: "#f0f2f5", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-primary)" }}>
          <div>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>🧱 Commodity Warning Flag (ASTM Steel)</span>
            <p className="mt-0.5" style={{ color: "var(--text-secondary)" }}>Region steel index indicates continuous scrap price surge. Sourcing pre-rolled beams via local staging depots offsets delivery risks.</p>
          </div>
          <button className="text-[10px] font-black flex px-3 py-1.5 transition shrink-0 uppercase tracking-wider self-center gap-1" style={{ color: "var(--blue-primary)", border: "1px solid var(--border)", background: "var(--card)", borderRadius: 8 }}>
            Hedg. contract <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
