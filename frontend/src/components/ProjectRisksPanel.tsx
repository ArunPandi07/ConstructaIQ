import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Users } from "lucide-react";
import type { ProjectRiskItem } from "../types";

interface Props {
  supplyChainRisks: ProjectRiskItem[];
  workforceGaps: ProjectRiskItem[];
}

function severityStyle(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "high" || s === "critical") return "bg-red-50 text-red-700 border-red-200";
  if (s === "medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-stone-50 text-stone-600 border-stone-200";
}

function RiskList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: ProjectRiskItem[];
}) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-4">
        {icon}
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-stone-500">None identified.</p>
      ) : (
        <div className="space-y-2">
          {items.map((risk) => (
            <div
              key={risk.id}
              className="p-3 rounded-xl border border-stone-200/60 bg-stone-50 text-xs"
            >
              <div className="flex justify-between gap-2 items-start">
                <p className="font-bold text-stone-900">{risk.title}</p>
                <span
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${severityStyle(risk.severity)}`}
                >
                  {risk.severity}
                </span>
              </div>
              {risk.detail && (
                <p className="text-[10px] text-stone-600 mt-2 leading-relaxed">
                  {risk.detail}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectRisksPanel({
  supplyChainRisks,
  workforceGaps,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <RiskList
        title="Supply Chain Risks"
        icon={<AlertTriangle className="w-4 h-4 text-[#F5C518]" />}
        items={supplyChainRisks}
      />
      <RiskList
        title="Workforce Gaps"
        icon={<Users className="w-4 h-4 text-[#F5C518]" />}
        items={workforceGaps}
      />
    </motion.div>
  );
}
