import { useEffect, useId, useMemo, useState } from "react";
import { CalendarDays, GitBranch, Package } from "lucide-react";
import type { ProjectIntelligenceData } from "../types";

interface Props {
  intelligence: ProjectIntelligenceData;
}

function nodeId(value: string, index: number): string {
  const safe = value.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^(\d)/, "_$1");
  return safe || `phase_${index}`;
}

function buildMermaidGraph(
  dependencies: ProjectIntelligenceData["dependencies"],
  criticalPhases: Set<string>,
): string {
  const idByName = new Map<string, string>();
  let count = 0;
  const getId = (name: string) => {
    if (!idByName.has(name)) {
      idByName.set(name, nodeId(name, count));
      count += 1;
    }
    return idByName.get(name) ?? `phase_${count}`;
  };

  const lines = ["flowchart LR"];
  for (const dep of dependencies ?? []) {
    const predecessor = dep.predecessor || "Unknown";
    const successor = dep.successor || "Unknown";
    const predLabel = criticalPhases.has(predecessor.toLowerCase())
      ? `${predecessor} (Critical)`
      : predecessor;
    const succLabel = criticalPhases.has(successor.toLowerCase())
      ? `${successor} (Critical)`
      : successor;
    lines.push(
      `  ${getId(predecessor)}["${predLabel.replace(/"/g, "'")}"] --> ${getId(
        successor,
      )}["${succLabel.replace(/"/g, "'")}"]`,
    );
  }
  return lines.join("\n");
}

function DependencyGraph({ graph }: { graph: string }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const graphId = `dependency_graph_${useId().replace(/:/g, "_")}`;

  useEffect(() => {
    let cancelled = false;
    import("mermaid").then(({ default: mermaid }) => {
      if (cancelled) return;
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
      mermaid
        .render(graphId, graph)
        .then(({ svg: rendered }) => {
          if (!cancelled) {
            setSvg(rendered);
            setError(null);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Graph failed");
        });
    });
    return () => {
      cancelled = true;
    };
  }, [graph, graphId]);

  if (error) {
    return (
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
        Unable to render dependency graph. Use List View instead.
      </p>
    );
  }

  if (!svg) {
    return <p className="text-xs text-stone-500">Rendering dependency graph...</p>;
  }

  return (
    <div
      className="dependency-mermaid overflow-x-auto rounded-xl border border-stone-100 bg-white p-3"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default function SchedulePanel({ intelligence }: Props) {
  const [dependencyView, setDependencyView] = useState<"list" | "graph">("list");
  const phases = useMemo(() => intelligence.phases ?? [], [intelligence.phases]);
  const dependencies = useMemo(
    () => intelligence.dependencies ?? [],
    [intelligence.dependencies],
  );
  const materials = intelligence.materials ?? [];
  const critical = useMemo(
    () => new Set((intelligence.criticalPathPhases ?? []).map((n) => n.toLowerCase())),
    [intelligence.criticalPathPhases],
  );
  const mermaidGraph = useMemo(
    () => buildMermaidGraph(dependencies, critical),
    [dependencies, critical],
  );

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#F5C518]" />
            Phase Timeline
          </h3>
          <span className="text-[9px] text-stone-400 uppercase font-mono">
            {phases.length} phases
          </span>
        </div>
        {phases.length === 0 ? (
          <p className="text-xs text-stone-500 text-center py-6">
            No schedule phases yet. Run analyze to populate.
          </p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {phases.map((phase) => {
              const isCritical =
                phase.isCritical ||
                critical.has(phase.name.toLowerCase());
              return (
                <div
                  key={phase.name}
                  className={`p-3 rounded-xl border text-xs ${
                    isCritical
                      ? "bg-[#F5C518]/10 border-[#F5C518]/40"
                      : "bg-stone-50 border-stone-200/60"
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-bold text-stone-900">
                      {phase.name}
                      {isCritical && (
                        <span className="ml-2 text-[9px] text-[#E2B30D] uppercase">
                          Critical
                        </span>
                      )}
                    </span>
                    <span className="text-[9px] font-mono text-stone-500">
                      {phase.progress}%
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">
                    {phase.startDate || "TBD"} → {phase.endDate || "TBD"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#F5C518]" />
              Dependencies
            </h3>
            <div className="flex bg-stone-100 rounded-lg p-1 text-[10px] font-bold">
              {(["list", "graph"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setDependencyView(view)}
                  className={`px-2.5 py-1 rounded-md capitalize transition ${
                    dependencyView === view
                      ? "bg-white text-stone-900 shadow-xs"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {view} View
                </button>
              ))}
            </div>
          </div>
          {dependencies.length === 0 ? (
            <p className="text-xs text-stone-500">No dependency graph available.</p>
          ) : dependencyView === "graph" ? (
            <DependencyGraph graph={mermaidGraph} />
          ) : (
            <ul className="space-y-2 text-xs">
              {dependencies.map((dep, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-stone-700 bg-stone-50 rounded-lg px-3 py-2"
                >
                  <span className="font-semibold">{dep.predecessor}</span>
                  <span className="text-stone-400">→</span>
                  <span className="font-semibold">{dep.successor}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-[#F5C518]" />
            Materials
          </h3>
          {materials.length === 0 ? (
            <p className="text-xs text-stone-500">No materials list in schedule.</p>
          ) : (
            <ul className="space-y-2 text-xs max-h-48 overflow-y-auto">
              {materials.map((mat, i) => (
                <li
                  key={i}
                  className="flex justify-between border-b border-stone-100 py-2"
                >
                  <span className="font-semibold text-stone-800">{mat.name}</span>
                  <span className="text-stone-500 font-mono">
                    {mat.quantity != null ? `${mat.quantity} ${mat.unit ?? ""}` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
