import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Circle, Lightbulb, ListFilter } from "lucide-react";
import type { AgentExecutionRead, Recommendation } from "../types";

interface Props {
  recommendations?: Recommendation[];
  agentExecutions: AgentExecutionRead[];
}

const KEY_CATEGORIES: Record<string, string> = {
  recommendations: "General",
  recommended_actions: "General",
  next_steps: "General",
  recommended_suppliers: "Supply Chain",
  supply_chain_recommendations: "Supply Chain",
  procurement_recommendations: "Supply Chain",
  supply_chain_risks: "Supply Chain",
  crew_recommendations: "Workforce",
  workforce_recommendations: "Workforce",
  workforce_gaps: "Workforce",
  compliance_recommendations: "Compliance",
  compliance_risks: "Compliance",
  required_documents: "Documents",
  inspection_stages: "Inspection",
};

function asArray(value: unknown): unknown[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function stringify(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function field(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value != null && String(value).trim()) return String(value);
  }
  return "";
}

function titleFor(item: unknown, fallback: string): string {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const record = item as Record<string, unknown>;
    return (
      field(record, [
        "title",
        "recommendation",
        "risk",
        "role",
        "name",
        "supplier_name",
        "document",
        "permit_name",
      ]) || fallback
    );
  }
  return stringify(item).slice(0, 80) || fallback;
}

function descriptionFor(item: unknown, title: string): string {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const record = item as Record<string, unknown>;
    const detail = field(record, [
      "description",
      "detail",
      "mitigation",
      "rationale",
      "shortage",
      "status",
    ]);
    if (detail) return detail;

    const titleKeys = [
      "title",
      "recommendation",
      "risk",
      "role",
      "name",
      "supplier_name",
      "document",
      "permit_name",
    ];
    const sole = field(record, titleKeys);
    if (sole && sole === title && Object.keys(record).length <= 2) {
      return "";
    }

    const extra = Object.fromEntries(
      Object.entries(record).filter(
        ([key, value]) =>
          value != null &&
          String(value).trim() &&
          String(value) !== title &&
          !titleKeys.includes(key),
      ),
    );
    if (Object.keys(extra).length > 0) {
      return stringify(extra);
    }
    return "";
  }
  const text = stringify(item);
  return text === title ? "" : text;
}

function priorityFor(item: unknown): Recommendation["priority"] {
  if (!item || typeof item !== "object" || Array.isArray(item)) return "Medium";
  const record = item as Record<string, unknown>;
  const raw = field(record, ["priority", "severity", "impact", "risk_level"])
    .toLowerCase()
    .trim();
  if (["critical", "very high", "high"].includes(raw)) return "High";
  if (["low", "minor"].includes(raw)) return "Low";
  return "Medium";
}

function extractFromExecutions(executions: AgentExecutionRead[]): Recommendation[] {
  const recommendations: Recommendation[] = [];
  let id = 10000;

  for (const execution of executions) {
    if (!execution.output_json) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(execution.output_json);
    } catch {
      continue;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
    const output = parsed as Record<string, unknown>;
    for (const [key, category] of Object.entries(KEY_CATEGORIES)) {
      for (const item of asArray(output[key])) {
        const title = titleFor(item, key.replace(/_/g, " "));
        const description = descriptionFor(item, title);
        if (!title && !description) continue;
        recommendations.push({
          id,
          sourceAgent: execution.agent_name ?? "Agent",
          agentVersion: execution.agent_version ?? "",
          category,
          title,
          description,
          priority: priorityFor(item),
          status: "new",
        });
        id += 1;
      }
    }
  }

  return recommendations;
}

function priorityClass(priority: Recommendation["priority"]): string {
  if (priority === "High") return "bg-red-50 text-red-700 border-red-100";
  if (priority === "Low") return "bg-stone-50 text-stone-600 border-stone-200";
  return "bg-amber-50 text-amber-700 border-amber-100";
}

export default function RecommendationsPanel({
  recommendations,
  agentExecutions,
}: Props) {
  const [sourceFilter, setSourceFilter] = useState("All");
  const [statusById, setStatusById] = useState<Record<number, Recommendation["status"]>>(
    {},
  );

  const items = useMemo(() => {
    const merged = [...(recommendations ?? []), ...extractFromExecutions(agentExecutions)];
    const seen = new Set<string>();
    return merged.filter((item) => {
      const key = `${item.sourceAgent}|${item.category}|${item.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [recommendations, agentExecutions]);

  const sources = useMemo(
    () => ["All", ...Array.from(new Set(items.map((item) => item.sourceAgent)))],
    [items],
  );
  const visibleItems =
    sourceFilter === "All"
      ? items
      : items.filter((item) => item.sourceAgent === sourceFilter);

  const toggleStatus = (id: number) => {
    setStatusById((current) => {
      const status = current[id] ?? "new";
      const next =
        status === "new"
          ? "in_progress"
          : status === "in_progress"
            ? "completed"
            : "new";
      return { ...current, [id]: next };
    });
  };

  if (items.length === 0) {
    return (
      <div className="glass-card p-5 text-center">
        <Lightbulb className="w-8 h-8 mx-auto text-stone-300 mb-3" />
        <p className="text-xs text-stone-500">
          No agent recommendations found yet. Run analyze to capture actionable
          recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#F5C518]" />
              AI Recommendations
            </h3>
            <p className="text-[10px] text-stone-500 mt-1">
              Actionable items extracted from stored agent outputs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500">
            <ListFilter className="w-3.5 h-3.5" />
            {visibleItems.length} visible / {items.length} total
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {sources.map((source) => (
            <button
              key={source}
              type="button"
              onClick={() => setSourceFilter(source)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                sourceFilter === source
                  ? "bg-[#1a2035] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visibleItems.map((item) => {
          const status = statusById[item.id] ?? item.status;
          const done = status === "completed";
          return (
            <div
              key={`${item.sourceAgent}-${item.id}`}
              className="glass-card p-4 border border-stone-200/70"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" />
                    {item.sourceAgent}
                    {item.agentVersion ? ` v${item.agentVersion}` : ""}
                  </p>
                  <h4 className="text-sm font-black text-stone-900 mt-1 leading-snug">
                    {item.title}
                  </h4>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${priorityClass(item.priority)}`}
                >
                  {item.priority}
                </span>
              </div>
              {item.description && (
                <p className="text-xs text-stone-600 leading-relaxed mt-3">
                  {item.description}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-stone-100">
                <span className="text-[10px] font-bold text-stone-500 bg-stone-100 rounded-full px-2 py-0.5">
                  {item.category}
                </span>
                <button
                  type="button"
                  onClick={() => toggleStatus(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                    done
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Circle className="w-3.5 h-3.5" />
                  )}
                  {status.replace("_", " ")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
