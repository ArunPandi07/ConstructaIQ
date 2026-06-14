import { motion } from "framer-motion";
import { ClipboardCheck } from "lucide-react";
import type { InspectionItem } from "../types";

interface Props {
  inspections: InspectionItem[];
}

const statusColor: Record<string, string> = {
  planned: "bg-stone-100 text-stone-600",
  scheduled: "bg-blue-50 text-blue-700",
  passed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

export default function InspectionChecklist({ inspections }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card p-5"
    >
      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-4">
        <ClipboardCheck className="w-4 h-4 text-[#F5C518]" />
        Inspection Checkpoints
      </h3>
      {inspections.length === 0 ? (
        <p className="text-xs text-stone-500 text-center py-8">
          No inspections persisted yet. Run analyze to generate inspection stages.
        </p>
      ) : (
        <div className="space-y-2">
          {inspections.map((item, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-xs"
            >
              <div>
                <p className="font-bold text-stone-900">{item.name}</p>
                {item.phase && (
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Phase: {item.phase}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.date && (
                  <span className="text-[10px] font-mono text-stone-500">
                    {item.date}
                  </span>
                )}
                <span
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                    statusColor[item.status.toLowerCase()] ??
                    "bg-stone-100 text-stone-600"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
