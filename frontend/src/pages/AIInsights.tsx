import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../components/Badge";
import AgentDetailPanel from "../components/agentInsights/AgentDetailPanel";
import AgentExecutionTimeline from "../components/agentInsights/AgentExecutionTimeline";
import AgentInsightsKpiRow from "../components/agentInsights/AgentInsightsKpiRow";
import AgentMasterList from "../components/agentInsights/AgentMasterList";
import AgentPipelineStrip from "../components/agentInsights/AgentPipelineStrip";
import { useAppContext } from "../context/AppContext";
import { useAgentInsights, useProjects } from "../hooks/usePageData";
import { useLoading } from "../context/LoadingContext";
import {
  isBackendProjectId,
  PIPELINE_AGENT_NAMES,
} from "../services/projectApi";
import {
  aggregateAgentUsage,
  countCompletedAgents,
  countErrorAgents,
  isAgentComplete,
  lastCompletedAt,
  latestByAgent,
} from "../utils/agentHelpers";

function defaultSelectedAgent(
  byAgent: Record<string, import("../types").AgentExecutionRead>,
): string {
  const completed = PIPELINE_AGENT_NAMES.find((name) =>
    isAgentComplete(byAgent[name]?.status),
  );
  return completed ?? PIPELINE_AGENT_NAMES[0];
}

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
    data,
    loading: insightsLoading,
    error,
  } = useAgentInsights(selectedId);

  const executions = data?.executions ?? [];
  const executionList = executions;
  const byAgent = useMemo(() => latestByAgent(executionList), [executionList]);
  const completedCount = countCompletedAgents(byAgent);
  const usage = aggregateAgentUsage(executionList);
  const errorCount = countErrorAgents(byAgent);
  const lastRun = lastCompletedAt(executionList);

  const [selectedAgent, setSelectedAgent] = useState<string>(
    PIPELINE_AGENT_NAMES[0],
  );

  useEffect(() => {
    setSelectedAgent(defaultSelectedAgent(byAgent));
  }, [selectedId, byAgent]);

  const handleProjectChange = (id: string) => {
    setActiveProjectId(id);
  };

  const selectedRun = byAgent[selectedAgent];

  const isLoading = projectsLoading || insightsLoading;
  const { setLoading, hasFullscreenLoader } = useLoading();
  useEffect(() => {
    setLoading(
      "ai-insights",
      isLoading,
      isLoading
        ? { type: "fullscreen", message: "Loading AI insights" }
        : undefined,
    );
  }, [isLoading, setLoading]);

  const [pageReady, setPageReady] = useState(false);
  useEffect(() => {
    if (!isLoading && !hasFullscreenLoader) {
      const timer = setTimeout(() => setPageReady(true), 350);
      return () => clearTimeout(timer);
    } else {
      setPageReady(false);
    }
  }, [isLoading, hasFullscreenLoader]);

  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      animate={pageReady ? "visible" : "hidden"}
      className="space-y-6"
    >
      <motion.div
        variants={childVariants}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div>
          <h2 className="text-lg font-bold text-stone-900">AI Insights</h2>
          <p className="text-sm mt-0.5 text-stone-500">
            Agent execution audit for the active project pipeline
            {!projectsLoading && projects.length > 0 && (
              <span className="text-stone-400">
                {" "}
                · {projects.length} projects loaded
              </span>
            )}
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
          {isBackendProjectId(selectedId) && (
            <Link
              to={`/projects/${selectedId}`}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-[#F5C518]/20 border border-stone-200 rounded-xl px-3 py-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View project
            </Link>
          )}
        </div>
      </motion.div>

      <motion.div
        variants={staggerVariants}
        initial="hidden"
        animate={pageReady ? "visible" : "hidden"}
        style={{ display: "grid", gap: "20px" }}
      >
        {!isBackendProjectId(selectedId) && (
          <motion.div
            variants={childVariants}
            className="glass-card p-8 text-center text-stone-500 text-sm"
          >
            Create and analyze a project to view agent execution history.
          </motion.div>
        )}

        {error && (
          <motion.div
            variants={childVariants}
            className="glass-card p-4 text-sm text-red-600 border border-red-200"
          >
            {error}
          </motion.div>
        )}

        {insightsLoading && isBackendProjectId(selectedId) && (
          <motion.div
            variants={childVariants}
            className="text-sm text-stone-500"
          >
            Loading agent executions…
          </motion.div>
        )}

        {isBackendProjectId(selectedId) && !insightsLoading && (
          <>
            <motion.div variants={childVariants}>
              <AgentPipelineStrip
                byAgent={byAgent}
                selectedAgent={selectedAgent}
                onSelect={setSelectedAgent}
              />
            </motion.div>

            <motion.div variants={childVariants}>
              <AgentInsightsKpiRow
                completedCount={completedCount}
                totalDurationSeconds={usage.totalDuration}
                lastRun={lastRun}
                errorCount={errorCount}
              />
            </motion.div>

            <motion.p
              variants={childVariants}
              className="text-xs text-stone-500"
            >
              Viewing: <strong>{project?.name ?? selectedId}</strong>
              {usage.avgDuration > 0 &&
                ` · avg duration ${usage.avgDuration}s per run`}
            </motion.p>

            <motion.div
              variants={childVariants}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4"
            >
              <div className="lg:col-span-4 space-y-4">
                <AgentMasterList
                  byAgent={byAgent}
                  selectedAgent={selectedAgent}
                  onSelect={setSelectedAgent}
                />
                <AgentExecutionTimeline executions={executionList} />
              </div>
              <div className="lg:col-span-8">
                <AgentDetailPanel agentName={selectedAgent} run={selectedRun} />
              </div>
            </motion.div>

            {executionList.length === 0 && (
              <motion.div
                variants={childVariants}
                className="glass-card p-6 text-center text-sm text-stone-500 flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4 text-stone-400" />
                No agent executions logged for this project yet.
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
