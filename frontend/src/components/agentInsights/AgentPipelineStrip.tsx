import { PIPELINE_AGENT_NAMES } from "../../services/projectApi";
import type { AgentExecutionRead } from "../../types";
import { agentIcon, isAgentComplete } from "../../utils/agentHelpers";

interface Props {
  byAgent: Record<string, AgentExecutionRead>;
  selectedAgent: string;
  onSelect: (name: string) => void;
}

function stripLabel(name: string): string {
  return name.replace(/Agent$/, "");
}

function statusDot(status: string | null | undefined): string {
  const s = (status ?? "").toLowerCase();
  if (isAgentComplete(s)) return "bg-emerald-500";
  if (s === "error" || s === "failed") return "bg-red-500";
  if (s === "running") return "bg-sky-500 animate-pulse";
  return "bg-stone-300";
}

export default function AgentPipelineStrip({ byAgent, selectedAgent, onSelect }: Props) {
  return (
    <div className="glass-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-3">
        Pipeline sequence
      </p>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {PIPELINE_AGENT_NAMES.map((name, index) => {
          const run = byAgent[name];
          const isSelected = name === selectedAgent;
          return (
            <div key={name} className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => onSelect(name)}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-[72px] ${
                  isSelected ? "bg-[#F5C518]/15 ring-1 ring-[#F5C518]/40" : "hover:bg-stone-50"
                }`}
                aria-pressed={isSelected}
                aria-label={`Select ${name}`}
              >
                <span className="text-lg leading-none">{agentIcon(name)}</span>
                <span className="text-[9px] font-bold text-stone-600 truncate max-w-[68px]">
                  {stripLabel(name)}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${statusDot(run?.status)}`}
                  aria-hidden="true"
                />
              </button>
              {index < PIPELINE_AGENT_NAMES.length - 1 && (
                <div className="w-4 h-px bg-stone-200 shrink-0 mx-0.5" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
