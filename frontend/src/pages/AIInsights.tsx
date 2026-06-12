import { useMemo } from "react";
import { Bot, Building2, Clock, Activity } from "lucide-react";
import Badge from "../components/Badge";
import { useAppContext } from "../context/AppContext";
import { useProjectAgents, useProjects } from "../hooks/usePageData";
import {
  isBackendProjectId,
  PIPELINE_AGENT_NAMES,
} from "../services/projectApi";
import {
  aggregateAgentUsage,
  countCompletedAgents,
  latestByAgent,
  summarizeOutputJson,
} from "../utils/agentHelpers";

const statusCfg = {
  complete: { label: "Completed", variant: "green" as const },
  completed: { label: "Completed", variant: "green" as const },
  success: { label: "Completed", variant: "green" as const },
  running: { label: "Running", variant: "blue" as const },
  error: { label: "Error", variant: "red" as const },
  failed: { label: "Error", variant: "red" as const },
};

export default function AIInsights() {
  const { activeProjectId, setActiveProjectId } = useAppContext();
  const { projects, loading: projectsLoading } = useProjects();

  const backendProjects = projects.filter((p) => isBackendProjectId(p.id));
  const selectedId =
    (isBackendProjectId(activeProjectId) ? activeProjectId : null) ??
    backendProjects[0]?.id ??
    "";

  const project = projects.find((p) => p.id === selectedId);

  const {
    data: executions = [],
    loading: agentsLoading,
    error,
  } = useProjectAgents(selectedId);

  const executionList = executions ?? [];
  const byAgent = useMemo(() => latestByAgent(executionList), [executionList]);
  const completedCount = countCompletedAgents(byAgent);
  const usage = aggregateAgentUsage(executionList);

  const handleProjectChange = (id: string) => {
    setActiveProjectId(id);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900">AI Insights</h2>
          <p className="text-sm mt-0.5 text-stone-500">
            Agent execution audit for the active project pipeline
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {backendProjects.length > 0 && (
            <select
              value={selectedId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white min-w-48"
            >
              {backendProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <Badge variant="blue" dot>
            {completedCount}/{PIPELINE_AGENT_NAMES.length} agents run
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2 text-stone-400 text-xs">
            <Building2 size={13} />
            Projects loaded
          </div>
          <div className="text-xl font-bold text-stone-900">
            {projectsLoading ? "—" : projects.length}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2 text-stone-400 text-xs">
            <Bot size={13} />
            Pipeline agents
          </div>
          <div className="text-xl font-bold text-stone-900">
            {PIPELINE_AGENT_NAMES.length}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2 text-stone-400 text-xs">
            <Activity size={13} />
            Executions logged
          </div>
          <div className="text-xl font-bold text-stone-900">{executionList.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2 text-stone-400 text-xs">
            <Clock size={13} />
            Tokens used
          </div>
          <div className="text-sm font-bold text-stone-900 truncate">
            {usage.totalTokens.toLocaleString()}
          </div>
        </div>
      </div>

      {!isBackendProjectId(selectedId) && (
        <div className="glass-card p-8 text-center text-stone-500 text-sm">
          Create and analyze a project to view agent execution history.
        </div>
      )}

      {error && (
        <div className="glass-card p-4 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      {agentsLoading && isBackendProjectId(selectedId) && (
        <div className="text-sm text-stone-500">Loading agent executions…</div>
      )}

      {isBackendProjectId(selectedId) && !agentsLoading && (
        <>
          <p className="text-xs text-stone-500">
            Viewing: <strong>{project?.name ?? selectedId}</strong> · avg
            duration {usage.avgDuration}s
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {PIPELINE_AGENT_NAMES.map((name) => {
              const run = byAgent[name];
              const statusKey = (run?.status ?? "pending").toLowerCase();
              const cfg =
                statusCfg[statusKey as keyof typeof statusCfg] ?? {
                  label: run ? statusKey : "Not run",
                  variant: "gray" as const,
                };

              return (
                <div key={name} className="glass-card p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-stone-900">{name}</h3>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  {run ? (
                    <dl className="text-xs text-stone-500 space-y-1">
                      {run.agent_version && (
                        <div>
                          <dt className="inline font-semibold">Version: </dt>
                          <dd className="inline">{run.agent_version}</dd>
                        </div>
                      )}
                      {run.duration_seconds != null && (
                        <div>
                          <dt className="inline font-semibold">Duration: </dt>
                          <dd className="inline">{run.duration_seconds}s</dd>
                        </div>
                      )}
                      {run.tokens_used != null && run.tokens_used > 0 && (
                        <div>
                          <dt className="inline font-semibold">Tokens: </dt>
                          <dd className="inline">
                            {run.tokens_used.toLocaleString()}
                          </dd>
                        </div>
                      )}
                      {run.completed_at && (
                        <div>
                          <dt className="inline font-semibold">Completed: </dt>
                          <dd className="inline">
                            {new Date(run.completed_at).toLocaleString()}
                          </dd>
                        </div>
                      )}
                      {run.output_json && (
                        <div className="mt-2 p-2 bg-stone-50 rounded-lg text-[10px] text-stone-600 leading-relaxed">
                          {summarizeOutputJson(run.output_json, 200)}
                        </div>
                      )}
                      {run.error_message && (
                        <div className="text-red-600">{run.error_message}</div>
                      )}
                    </dl>
                  ) : (
                    <p className="text-xs text-stone-400">
                      No execution recorded for this agent yet.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
