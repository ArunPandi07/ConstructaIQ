import type { PipelineRunSummary } from "../../types";

interface Props {
  runs: PipelineRunSummary[];
  selectedRunId: string | null;
  onSelect: (runId: string | null) => void;
}

function formatRunLabel(
  run: PipelineRunSummary,
  index: number,
  total: number,
): string {
  const date = new Date(run.created_at).toLocaleString();
  const status =
    run.status === "complete"
      ? "Complete"
      : run.status === "error"
        ? "Failed"
        : run.status;
  return `Run ${total - index} · ${date} · ${status}`;
}

export default function PipelineRunSelector({
  runs,
  selectedRunId,
  onSelect,
}: Props) {
  if (runs.length === 0) {
    return (
      <div className="glass-card p-3 text-xs text-stone-500">
        No grouped pipeline runs yet. Re-run analysis to start tracking runs.
      </div>
    );
  }

  return (
    <div className="glass-card p-3 flex flex-col sm:flex-row sm:items-center gap-2">
      <label
        htmlFor="pipeline-run-select"
        className="text-xs font-bold uppercase tracking-wide text-stone-500 shrink-0"
      >
        Pipeline run
      </label>
      <select
        id="pipeline-run-select"
        value={selectedRunId ?? runs[0]?.job_id ?? ""}
        onChange={(event) => onSelect(event.target.value || null)}
        className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#F5C518]/40"
      >
        {runs.map((run, index) => (
          <option key={run.job_id} value={run.job_id}>
            {formatRunLabel(run, index, runs.length)}
            {run.agent_count > 0 ? ` · ${run.agent_count} agents` : ""}
            {run.total_duration_seconds > 0
              ? ` · ${run.total_duration_seconds}s`
              : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
