import type { AgentExecutionRead } from "../../types";
import { agentIcon } from "../../utils/agentHelpers";

interface Props {
  executions: AgentExecutionRead[];
}

export default function AgentExecutionTimeline({ executions }: Props) {
  const sorted = [...executions]
    .filter((e) => e.completed_at || e.started_at)
    .sort((a, b) => {
      const ta = new Date(a.completed_at ?? a.started_at ?? 0).getTime();
      const tb = new Date(b.completed_at ?? b.started_at ?? 0).getTime();
      return tb - ta;
    })
    .slice(0, 12);

  if (sorted.length === 0) {
    return (
      <div className="glass-card p-4 text-xs text-stone-500">
        No execution timeline entries yet.
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide mb-4">
        Execution timeline
      </h3>
      <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
        {sorted.map((run) => {
          const time = run.completed_at ?? run.started_at;
          const s = (run.status ?? "").toLowerCase();
          const dotColor =
            s === "error" || s === "failed"
              ? "#ef4444"
              : s === "running"
                ? "#0ea5e9"
                : "#F5C518";
          return (
            <div key={run.execution_id} className="timeline-item pl-6">
              <div className="flex items-start gap-2">
                <div
                  className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white"
                  style={{ borderColor: dotColor }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{agentIcon(run.agent_name ?? "")}</span>
                    <span className="text-xs font-bold text-stone-800 truncate">
                      {run.agent_name ?? "Agent"}
                    </span>
                    <span className="text-[9px] text-stone-400 shrink-0">
                      {time ? new Date(time).toLocaleString() : "—"}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    {run.status ?? "unknown"}
                    {run.duration_seconds != null ? ` · ${run.duration_seconds}s` : ""}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
