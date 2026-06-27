import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot, ExternalLink, FileText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Badge from "../components/Badge";
import AgentDetailPanel from "../components/agentInsights/AgentDetailPanel";
import AgentExecutionTimeline from "../components/agentInsights/AgentExecutionTimeline";
import AgentInsightsKpiRow from "../components/agentInsights/AgentInsightsKpiRow";
import AgentMasterList from "../components/agentInsights/AgentMasterList";
import AgentPipelineStrip from "../components/agentInsights/AgentPipelineStrip";
import ChatPanel from "../components/chat/ChatPanel";
import GpuTelemetryPanel from "../components/GpuTelemetryPanel";
import PipelineRunSelector from "../components/agentInsights/PipelineRunSelector";
import { useAppContext } from "../context/AppContext";
import { clearAgentsCache, useAgentInsights, useProjects } from "../hooks/usePageData";
import { useLoading } from "../context/LoadingContext";
import {
  getProjectDocuments,
  isBackendProjectId,
  PIPELINE_AGENT_NAMES,
  getAnalyzeStatus,
} from "../services/projectApi";
import type { AnalyzeJobStatus } from "../types";
import {
  byAgentForRun,
  computeRunMetrics,
  executionsForRun,
  isAgentComplete,
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
  const location = useLocation();
  const { activeProjectId, setActiveProjectId } = useAppContext();
  const { projects, loading: projectsLoading } = useProjects();
  const analyzeMessage = (
    location.state as {
      analyzeMessage?: { tone: "success" | "warning" | "error"; text: string };
    } | null
  )?.analyzeMessage;

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
    refetch: refetchInsights,
  } = useAgentInsights(selectedId);

  const [jobStatus, setJobStatus] = useState<AnalyzeJobStatus | null>(null);

  useEffect(() => {
    if (!isBackendProjectId(selectedId)) {
      setJobStatus(null);
      return;
    }
    let interval: ReturnType<typeof setInterval>;
    let isPolling = true;

    const poll = async () => {
      try {
        const status = await getAnalyzeStatus(Number(selectedId));
        if (!isPolling) return;
        
        setJobStatus((prev) => {
          if (
            prev?.status === "running" &&
            (status.status === "complete" || status.status === "error")
          ) {
            clearAgentsCache(selectedId);
            refetchInsights();
          }
          return status;
        });

        if (status.status !== "running" && status.status !== "queued") {
          clearInterval(interval);
        }
      } catch (e) {
        console.error("Failed to poll status", e);
      }
    };

    poll();
    interval = setInterval(poll, 3000);
    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [selectedId, refetchInsights]);

  const executions = data?.executions ?? [];
  const pipelineRuns = data?.pipelineRuns ?? [];
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  useEffect(() => {
    if (pipelineRuns.length > 0) {
      setSelectedRunId((prev) =>
        prev && pipelineRuns.some((run) => run.job_id === prev)
          ? prev
          : pipelineRuns[0].job_id,
      );
    } else {
      setSelectedRunId(null);
    }
  }, [selectedId, pipelineRuns]);

  const runExecutions = useMemo(() => {
    if (selectedRunId) {
      return executionsForRun(executions, selectedRunId);
    }
    return executions;
  }, [executions, selectedRunId]);

  const byAgent = useMemo(
    () =>
      selectedRunId
        ? byAgentForRun(executions, selectedRunId)
        : latestByAgent(executions),
    [executions, selectedRunId],
  );
  const runMetrics = useMemo(
    () => computeRunMetrics(runExecutions),
    [runExecutions],
  );
  const selectedRunMeta = pipelineRuns.find(
    (run) => run.job_id === selectedRunId,
  );

  const [selectedAgent, setSelectedAgent] = useState<string>(
    PIPELINE_AGENT_NAMES[0],
  );
  const [storedDocumentCount, setStoredDocumentCount] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!isBackendProjectId(selectedId)) {
      setStoredDocumentCount(null);
      return;
    }
    getProjectDocuments(Number(selectedId))
      .then((res) =>
        setStoredDocumentCount(
          res.documents.filter((doc: any) => doc.has_file).length,
        ),
      )
      .catch(() => setStoredDocumentCount(null));
  }, [selectedId]);

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
      {analyzeMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card p-4 text-sm ${
            analyzeMessage.tone === "success"
              ? "border-emerald-200 text-emerald-800 bg-emerald-50/60"
              : analyzeMessage.tone === "warning"
                ? "border-amber-200 text-amber-800 bg-amber-50/60"
                : "border-red-200 text-red-700 bg-red-50/60"
          }`}
        >
          {analyzeMessage.text}
        </motion.div>
      )}
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
            {runMetrics.completedCount}/{PIPELINE_AGENT_NAMES.length} agents run
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
        {jobStatus && (jobStatus.status === "queued" || jobStatus.status === "running") && (
          <motion.div
            variants={childVariants}
            className="glass-card p-6 border-[#F5C518]/30 bg-[#F5C518]/5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#E2B30D] animate-pulse" />
                <h3 className="text-sm font-bold text-stone-900">Analysis Pipeline Running</h3>
              </div>
              <span className="text-sm font-bold text-[#E2B30D]">{jobStatus.overall_pct}%</span>
            </div>
            <div className="text-xs text-stone-500 font-mono">
              Current step: {jobStatus.progress_step || "Initializing..."}
            </div>
            <div className="progress-bar mt-1">
              <div
                className="progress-fill bg-[#F5C518] transition-all duration-500"
                style={{ width: `${jobStatus.overall_pct}%` }}
              ></div>
            </div>
          </motion.div>
        )}
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
              <GpuTelemetryPanel />
            </motion.div>

            <motion.div variants={childVariants}>
              <AgentPipelineStrip
                byAgent={byAgent}
                selectedAgent={selectedAgent}
                onSelect={setSelectedAgent}
              />
            </motion.div>

            <motion.div variants={childVariants}>
              <PipelineRunSelector
                runs={pipelineRuns}
                selectedRunId={selectedRunId}
                onSelect={setSelectedRunId}
              />
            </motion.div>

            <motion.div variants={childVariants}>
              <AgentInsightsKpiRow
                completedCount={runMetrics.completedCount}
                totalDurationSeconds={runMetrics.totalDuration}
                lastRun={runMetrics.lastRun}
                errorCount={runMetrics.errorCount}
                pipelineRunCount={data?.pipelineRunCount ?? 0}
              />
            </motion.div>

            <motion.p
              variants={childVariants}
              className="text-xs text-stone-500"
            >
              Viewing: <strong>{project?.name ?? selectedId}</strong>
              {selectedRunMeta
                ? ` · run ${new Date(selectedRunMeta.created_at).toLocaleString()}`
                : ""}
              {runMetrics.avgDuration > 0 &&
                ` · avg duration ${runMetrics.avgDuration}s per agent`}
            </motion.p>

            <motion.div
              variants={childVariants}
              className="glass-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-[#F5C518] mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-stone-900">
                    Project documents
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {storedDocumentCount === null
                      ? "Loading stored PDFs…"
                      : storedDocumentCount === 0
                        ? "No uploaded PDFs for this project."
                        : `${storedDocumentCount} stored PDF${storedDocumentCount === 1 ? "" : "s"} available`}
                  </p>
                </div>
              </div>
              {isBackendProjectId(selectedId) && (
                <Link
                  to={`/projects/${selectedId}?tab=documents`}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-stone-900 bg-[#F5C518] hover:bg-[#E2B30D] rounded-xl px-4 py-2.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View documents
                </Link>
              )}
            </motion.div>

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
                <AgentExecutionTimeline executions={runExecutions} />
              </div>
              <div className="lg:col-span-8 space-y-4">
                <AgentDetailPanel
                  agentName={selectedAgent}
                  run={selectedRun}
                  runLabel={
                    selectedRunMeta
                      ? new Date(selectedRunMeta.created_at).toLocaleString()
                      : undefined
                  }
                />
                <ChatPanel
                  embedded
                  projectId={selectedId}
                  projectName={project?.name}
                  agentName={selectedAgent}
                  runId={selectedRunId ?? undefined}
                  title={`${selectedAgent} Assistant`}
                  subtitle={
                    selectedRunMeta
                      ? `Run ${new Date(selectedRunMeta.created_at).toLocaleString()}`
                      : project?.name
                  }
                />
              </div>
            </motion.div>

            {runExecutions.length === 0 && (
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
