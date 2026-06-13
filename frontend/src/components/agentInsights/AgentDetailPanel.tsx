import { useState } from "react";
import { ChevronDown, Copy } from "lucide-react";
import type { AgentExecutionRead } from "../../types";
import {
  extractAgentHighlights,
  parseAgentOutput,
  type AgentHighlightSection,
} from "../../utils/agentOutputSummaries";
import { agentIcon } from "../../utils/agentHelpers";
import Badge from "../Badge";

interface Props {
  agentName: string;
  run: AgentExecutionRead | undefined;
}

function statusVariant(run: AgentExecutionRead | undefined) {
  if (!run) return "gray" as const;
  const s = (run.status ?? "").toLowerCase();
  if (s === "complete" || s === "completed" || s === "success") return "green" as const;
  if (s === "error" || s === "failed") return "red" as const;
  if (s === "running") return "blue" as const;
  return "gray" as const;
}

function HighlightSections({ sections }: { sections: AgentHighlightSection[] }) {
  if (sections.length === 0) return null;
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.title}>
          <h4 className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-2">
            {section.title}
          </h4>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {section.rows.map((row) => (
              <div
                key={`${section.title}-${row.label}`}
                className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2"
              >
                <dt className="text-[9px] font-bold uppercase text-stone-400">{row.label}</dt>
                <dd className="text-xs text-stone-800 mt-0.5 leading-relaxed">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

function JsonBlock({ parsed }: { parsed: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const text = JSON.stringify(parsed, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-stone-50 text-xs font-bold text-stone-700 hover:bg-stone-100"
      >
        <span>Raw JSON output</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="relative">
          <button
            type="button"
            onClick={copy}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-white border border-stone-200 text-stone-500 hover:text-stone-800"
            aria-label="Copy JSON"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <pre className="p-4 text-[10px] leading-relaxed text-stone-700 bg-white overflow-x-auto max-h-80 font-mono">
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function AgentDetailPanel({ agentName, run }: Props) {
  const parsed = run?.output_json ? parseAgentOutput(run.output_json) : null;
  const highlights = parsed ? extractAgentHighlights(agentName, parsed) : [];

  if (!run) {
    return (
      <div className="glass-card p-8 text-center text-stone-500 text-sm">
        <span className="text-3xl block mb-2">{agentIcon(agentName)}</span>
        <p className="font-bold text-stone-800">{agentName}</p>
        <p className="text-xs mt-1">No execution recorded for this agent yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-4 min-h-[320px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{agentIcon(agentName)}</span>
          <div>
            <h3 className="text-sm font-bold text-stone-900">{agentName}</h3>
            <p className="text-[10px] text-stone-500">
              Execution #{run.execution_id}
              {run.agent_version ? ` · v${run.agent_version}` : ""}
            </p>
          </div>
        </div>
        <Badge variant={statusVariant(run)}>{run.status ?? "unknown"}</Badge>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-lg bg-stone-50 px-3 py-2">
          <dt className="text-[9px] font-bold uppercase text-stone-400">Duration</dt>
          <dd className="font-bold text-stone-900 mt-0.5">
            {run.duration_seconds != null ? `${run.duration_seconds}s` : "—"}
          </dd>
        </div>
        <div className="rounded-lg bg-stone-50 px-3 py-2">
          <dt className="text-[9px] font-bold uppercase text-stone-400">Started</dt>
          <dd className="font-bold text-stone-900 mt-0.5 truncate">
            {run.started_at ? new Date(run.started_at).toLocaleString() : "—"}
          </dd>
        </div>
        <div className="rounded-lg bg-stone-50 px-3 py-2">
          <dt className="text-[9px] font-bold uppercase text-stone-400">Completed</dt>
          <dd className="font-bold text-stone-900 mt-0.5 truncate">
            {run.completed_at ? new Date(run.completed_at).toLocaleString() : "—"}
          </dd>
        </div>
        <div className="rounded-lg bg-stone-50 px-3 py-2">
          <dt className="text-[9px] font-bold uppercase text-stone-400">Tokens</dt>
          <dd className="font-bold text-stone-900 mt-0.5">
            {run.tokens_used != null && run.tokens_used > 0
              ? run.tokens_used.toLocaleString()
              : "Not tracked"}
          </dd>
        </div>
      </dl>

      {run.error_message && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-bold text-xs uppercase tracking-wide mb-1">Error</p>
          {run.error_message}
        </div>
      )}

      <HighlightSections sections={highlights} />

      {parsed && <JsonBlock parsed={parsed} />}
    </div>
  );
}
