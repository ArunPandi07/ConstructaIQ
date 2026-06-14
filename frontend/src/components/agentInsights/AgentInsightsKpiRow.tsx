import { AlertCircle, CheckCircle2, Clock, Timer } from "lucide-react";
import { PIPELINE_AGENT_NAMES } from "../../services/projectApi";

interface Props {
  completedCount: number;
  totalDurationSeconds: number;
  lastRun: string | null;
  errorCount: number;
}

export default function AgentInsightsKpiRow({
  completedCount,
  totalDurationSeconds,
  lastRun,
  errorCount,
}: Props) {
  const completionPct = Math.round(
    (completedCount / PIPELINE_AGENT_NAMES.length) * 100,
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2 text-stone-400 text-xs">
          <CheckCircle2 size={13} />
          Pipeline completion
        </div>
        <div className="text-xl font-bold text-stone-900">{completionPct}%</div>
        <p className="text-[10px] text-stone-500 mt-1">
          {completedCount}/{PIPELINE_AGENT_NAMES.length} agents
        </p>
      </div>
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2 text-stone-400 text-xs">
          <Timer size={13} />
          Total pipeline time
        </div>
        <div className="text-xl font-bold text-stone-900">{totalDurationSeconds}s</div>
        <p className="text-[10px] text-stone-500 mt-1">Sum of logged durations</p>
      </div>
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2 text-stone-400 text-xs">
          <Clock size={13} />
          Last run
        </div>
        <div className="text-sm font-bold text-stone-900 truncate">
          {lastRun ? new Date(lastRun).toLocaleString() : "—"}
        </div>
        <p className="text-[10px] text-stone-500 mt-1">Most recent completion</p>
      </div>
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2 text-stone-400 text-xs">
          <AlertCircle size={13} />
          Errors
        </div>
        <div
          className={`text-xl font-bold ${errorCount > 0 ? "text-red-600" : "text-stone-900"}`}
        >
          {errorCount}
        </div>
        <p className="text-[10px] text-stone-500 mt-1">Failed agent runs</p>
      </div>
    </div>
  );
}
