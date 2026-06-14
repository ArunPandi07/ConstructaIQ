import Badge from "../Badge";
import { PIPELINE_AGENT_NAMES } from "../../services/projectApi";
import type { AgentExecutionRead } from "../../types";
import { agentIcon, isAgentComplete } from "../../utils/agentHelpers";

interface Props {
  byAgent: Record<string, AgentExecutionRead>;
  selectedAgent: string;
  onSelect: (name: string) => void;
}

function statusBadge(run: AgentExecutionRead | undefined) {
  if (!run) return { label: "Not run", variant: "gray" as const };
  const s = (run.status ?? "").toLowerCase();
  if (isAgentComplete(s)) return { label: "Completed", variant: "green" as const };
  if (s === "error" || s === "failed") return { label: "Error", variant: "red" as const };
  if (s === "running") return { label: "Running", variant: "blue" as const };
  return { label: run.status ?? "Unknown", variant: "gray" as const };
}

export default function AgentMasterList({ byAgent, selectedAgent, onSelect }: Props) {
  return (
    <div className="glass-card p-4">
      <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide mb-3">
        Agent pipeline
      </h3>
      <ul className="space-y-1" role="listbox" aria-label="Agent pipeline">
        {PIPELINE_AGENT_NAMES.map((name) => {
          const run = byAgent[name];
          const badge = statusBadge(run);
          const isSelected = name === selectedAgent;
          return (
            <li key={name}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(name)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? "bg-[#F5C518]/15 border border-[#F5C518]/30"
                    : "hover:bg-stone-50 border border-transparent"
                }`}
              >
                <span className="text-lg shrink-0" aria-hidden="true">{agentIcon(name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">{name}</p>
                  <p className="text-[10px] text-stone-500">
                    {run?.duration_seconds != null ? `${run.duration_seconds}s` : "—"}
                    {run?.agent_version ? ` · v${run.agent_version}` : ""}
                  </p>
                </div>
                <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
