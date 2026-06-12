import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  HardHat,
  Bot,
  AlertTriangle,
  ArrowLeft,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useLoading } from "../context/LoadingContext";
import { ContentSkeleton } from "../components/Loader";
import {
  useScrollAnimation,
  useStaggeredAnimation,
} from "../hooks/useScrollAnimation";
import { useProjectAgents, useProjectIntelligence } from "../hooks/usePageData";
import {
  getProject,
  getProjectCrew,
  getProjectSuppliers,
  isBackendProjectId,
  mapBackendProjectToUI,
  PIPELINE_AGENT_NAMES,
} from "../services/projectApi";
import CrewPlanGantt from "../components/CrewPlanGantt";
import type { CrewPlanRead, Project } from "../types";
import { countCompletedAgents, latestByAgent } from "../utils/agentHelpers";

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, uploadJustCompleted, setActiveProjectId } = useAppContext();
  const backPath =
    location.state?.from === "dashboard" ? "/dashboard" : "/projects";

  const project = projects.find((p) => p.id === projectId);
  const {
    data: intelligence,
    loading: intelligenceLoading,
    error: intelligenceError,
  } = useProjectIntelligence(projectId ?? "");
  const {
    data: agentExecutions = [],
    loading: agentsLoading,
    error: agentsError,
  } = useProjectAgents(projectId ?? "");

  const [selectedProj, setSelectedProj] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [supplierCount, setSupplierCount] = useState(0);
  const [crewCount, setCrewCount] = useState(0);
  const [suppliers, setSuppliers] = useState<Array<Record<string, unknown>>>(
    [],
  );
  const [crewPlans, setCrewPlans] = useState<CrewPlanRead[]>([]);

  useEffect(() => {
    if (projectId && isBackendProjectId(projectId)) {
      setActiveProjectId(projectId);
    }
  }, [projectId, setActiveProjectId]);

  useEffect(() => {
    if (!project) return;
    if (project.id !== selectedProj?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedProj(project);
    }
  }, [project, selectedProj?.id]);

  useEffect(() => {
    if (!projectId || !isBackendProjectId(projectId) || project) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProjectLoading(true);
    setProjectError(null);
    getProject(Number(projectId))
      .then((p) => {
        if (!cancelled) setSelectedProj(mapBackendProjectToUI(p));
      })
      .catch((e: Error) => {
        if (!cancelled) setProjectError(e.message);
      })
      .finally(() => {
        if (!cancelled) setProjectLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, project]);

  useEffect(() => {
    if (!projectId || !isBackendProjectId(projectId)) return;
    const id = Number(projectId);
    getProjectSuppliers(id)
      .then((res) => {
        setSupplierCount(res.suppliers.length);
        setSuppliers(res.suppliers);
      })
      .catch(() => undefined);
    getProjectCrew(id)
      .then((res) => {
        setCrewCount(res.crew_plans.length);
        setCrewPlans(res.crew_plans);
      })
      .catch(() => undefined);
  }, [projectId]);

  const byAgent = useMemo(
    () => latestByAgent(agentExecutions ?? []),
    [agentExecutions],
  );
  const completedAgentCount = countCompletedAgents(byAgent);

  const { setLoading } = useLoading();

  const pageLoading =
    (projectLoading || intelligenceLoading || agentsLoading) && !selectedProj;
  const pageError = projectError ?? intelligenceError ?? agentsError;

  useEffect(() => {
    setLoading(
      "project-details",
      pageLoading,
      pageLoading ? { message: "Loading project intelligence" } : undefined,
    );
  }, [pageLoading, setLoading]);

  const { ref: heroRef, style: heroStyle } = useScrollAnimation<HTMLDivElement>(
    { delay: 0 },
  );
  const { ref: agentRef, style: agentStyle } =
    useScrollAnimation<HTMLDivElement>({ delay: 100 });
  const { ref: complianceRef, style: complianceStyle } =
    useScrollAnimation<HTMLDivElement>({ delay: 150 });
  const { ref: schedulesRef, style: schedulesStyle } =
    useScrollAnimation<HTMLDivElement>({ delay: 200 });
  const { ref: spotlightRef, style: spotlightStyle } =
    useScrollAnimation<HTMLDivElement>({ delay: 50 });
  const { containerRef: barsRef, itemStyles: barStyles } =
    useStaggeredAnimation<HTMLDivElement>(6, {
      baseDelay: 100,
    });

  if (pageLoading) return null;

  if (!selectedProj) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 mx-auto text-stone-300 mb-4" />
        <h2 className="text-xl font-bold text-stone-700">Project not found</h2>
        <p className="text-sm text-stone-400 mt-1">
          {pageError ?? "The project you're looking for doesn't exist."}
        </p>
        <button
          onClick={() => navigate(backPath)}
          className="mt-4 px-4 py-2 bg-[#F5C518] text-black font-bold rounded-xl text-sm"
        >
          Back to {backPath === "/dashboard" ? "Dashboard" : "Projects"}
        </button>
      </div>
    );
  }

  const progress = selectedProj.progress;
  const permitList = intelligence?.requiredPermits ?? [];
  const phaseList = intelligence?.phases ?? [];
  const telemetry = {
    contractAnalysisScore: progress,
    blueprintReviewScore: Math.min(progress + 5, 100),
    permitRequiredCount: permitList.length || 0,
    budgetScore: progress,
    siteReadiness: {
      documents: progress,
      permits: permitList.length
        ? Math.round(
            (permitList.filter((p) => p.status === "Approved").length /
              permitList.length) *
              100,
          )
        : 0,
      crewPlan: crewCount > 0 ? Math.min(50 + crewCount * 10, 100) : 0,
    },
    contractSummaryText: intelligence?.client
      ? `Client: ${intelligence.client}. ${intelligence.duration} duration at ${intelligence.location}.`
      : selectedProj.description ||
        "No contract summary until analyze completes.",
    blueprintAnalysisText: intelligence?.squareFootage
      ? `${intelligence.floors} floors, ${intelligence.squareFootage} SF, ${intelligence.complexity} complexity.`
      : "Blueprint details populate after BlueprintAgent runs.",
    permitStatusText:
      permitList.length > 0
        ? permitList.map((p) => `${p.name} (${p.status})`).join("; ")
        : "No permits persisted yet.",
    budgetBreakdownText: intelligence?.budget
      ? `Contract budget: ${intelligence.budget}. ${supplierCount} supplier row(s), ${crewCount} crew plan(s) in database.`
      : "Budget breakdown available after analyze persistence.",
  };

  const siteReadiness = telemetry.siteReadiness;
  const overallReadiness = Math.round(
    (siteReadiness.documents + siteReadiness.permits + siteReadiness.crewPlan) /
      3,
  );
  const contractScore = telemetry.contractAnalysisScore;
  const blueprintScore = telemetry.blueprintReviewScore;
  const permitsCount =
    intelligence?.requiredPermits?.length ?? telemetry.permitRequiredCount;
  const permitsScore = permitList.length
    ? Math.round(
        (permitList.filter((p) => p.status === "Approved").length /
          permitList.length) *
          100,
      )
    : 0;
  const supplierMetric =
    supplierCount > 0 ? Math.min(60 + supplierCount * 8, 95) : 0;
  const crewMetric = crewCount > 0 ? Math.min(60 + crewCount * 6, 95) : 0;
  const phaseProgressAvg =
    phaseList.length > 0
      ? Math.round(
          phaseList.reduce((acc, ph) => acc + (ph.progress ?? 0), 0) /
            phaseList.length,
        )
      : 0;
  const timelineScore =
    phaseProgressAvg || Math.round((completedAgentCount / 6) * 100);

  const agentMetrics = [
    { label: "Contract", icon: "📜", val: Math.min(contractScore, 95) },
    { label: "Blueprint", icon: "📐", val: Math.min(blueprintScore, 90) },
    { label: "Permits", icon: "🏛️", val: Math.min(permitsScore, 95) },
    { label: "Timeline", icon: "🗓️", val: timelineScore },
    { label: "Suppliers", icon: "🚚", val: supplierMetric },
    { label: "Crew Ops", icon: "👷", val: crewMetric },
  ];

  const pendingPermits = permitList.filter((p) => p.status !== "Approved");

  const handleSelectProjectDetails = (p: Project) => {
    setSelectedProj(p);
    navigate(`/projects/${p.id}`, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full max-w-none space-y-6">
      {/* BREADCRUMB & ACTION STRIP */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2"
      >
        <button
          onClick={() => navigate(backPath)}
          style={{ cursor: "pointer" }}
          className="px-4 py-2 bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:border-stone-400 rounded-xl font-bold flex items-center gap-2 transition-all duration-200 text-xs shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio Overview
        </button>
        <div className="text-right text-xs text-stone-400 font-semibold font-mono">
          Focus:{" "}
          <span className="gradient-text font-bold">
            {selectedProj.name.split(" ")[0]} Project
          </span>
        </div>
      </motion.div>

      {uploadJustCompleted && isBackendProjectId(projectId ?? "") && (
        <div className="premium-card p-4 border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm font-semibold shadow-sm!">
          <span className="flex items-center gap-2">
            ✔️ Six-agent analyze complete — persisted intelligence loaded from
            the backend.
          </span>
        </div>
      )}

      {(intelligenceLoading || agentsLoading) &&
        isBackendProjectId(projectId ?? "") && (
          <ContentSkeleton variant="card" count={1} />
        )}
      {pageError && selectedProj && (
        <div className="glass-card p-3 border border-amber-200 bg-amber-50 text-amber-900 text-xs">
          Partial load warning: {pageError}
        </div>
      )}

      {/* DETAILED PROJECT TITLE BANNER */}
      <div
        ref={heroRef}
        style={heroStyle}
        className="premium-card p-5 md:p-6 relative overflow-hidden cursor-default!"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F5C518]/15 text-[#E2B30D] flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg md:text-xl font-black text-stone-900 tracking-tight leading-tight">
                {selectedProj.name}
              </h1>
              <span
                className="status-badge text-[9px] font-bold uppercase"
                style={{
                  backgroundColor: "#dcfce7",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                }}
              >
                ● {selectedProj.status}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1 font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              {intelligence?.location ?? selectedProj.location} · Budget:{" "}
              <span className="text-stone-800 font-bold">
                {intelligence?.budget ?? selectedProj.budget}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ROW 1 — site overview + agent metrics (full width) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        {/* SPOTLIGHT DETAILED SPECIFICATION CARD */}
        <div
          ref={spotlightRef}
          style={spotlightStyle}
          className="premium-card p-6 relative overflow-hidden flex flex-col justify-between group min-h-95 xl:col-span-4 w-full cursor-default!"
        >
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(var(--text-primary) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          ></div>
          <div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200/60 text-[#E2B30D] flex items-center justify-center">
                <HardHat className="w-5 h-5" />
              </div>
              <span className="bg-[#F5C518] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                {selectedProj.budget}
              </span>
            </div>
            <div className="relative z-10 space-y-2">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Active Site Details
              </p>
              <h2 className="text-base font-black text-stone-900 tracking-tight leading-snug">
                {selectedProj.name}
              </h2>
              <p className="text-xs text-stone-500 leading-relaxed font-sans">
                {selectedProj.description}
              </p>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-stone-100 relative z-10 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-400">Site Coordinates</span>
              <span className="font-bold text-stone-800">
                {selectedProj.location}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-400 font-medium">
                  Integration Progress
                </span>
                <span className="font-mono font-bold text-[#E2B30D]">
                  {selectedProj.progress}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill transition-all duration-700"
                  style={{ width: `${selectedProj.progress}%` }}
                ></div>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2">
                Switch Focus site details
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProjectDetails(p)}
                    className={`px-2.5 py-1.5 rounded-xl text-[9px] font-bold shrink-0 transition ${
                      selectedProj.id === p.id
                        ? "bg-[#1a2035] text-white"
                        : "bg-stone-100 text-stone-800 border border-stone-200 hover:bg-[#F5C518]/10"
                    }`}
                  >
                    {p.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AGENT REALTIME MONITOR ACTIONS BARS CHART */}
        <div
          ref={agentRef}
          style={agentStyle}
          className="premium-card p-6 flex flex-col justify-between xl:col-span-8 w-full min-h-95 cursor-default!"
        >
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#F5C518]" />
                Focused Agent Activities
              </h3>
              <span className="text-[9px] bg-stone-100 text-stone-500 font-bold px-2 py-0.5 rounded-md font-mono uppercase">
                {completedAgentCount}/{PIPELINE_AGENT_NAMES.length} complete
              </span>
            </div>
            <div
              ref={barsRef}
              className="grid grid-cols-6 gap-3 flex-1 min-h-50 items-end pt-4 pb-2 border-b border-stone-100"
            >
              {agentMetrics.map((agent, i) => (
                <div
                  key={agent.label}
                  style={barStyles[i]}
                  className="flex flex-col items-center h-full justify-end group/bar relative min-w-0"
                >
                  <div className="absolute -top-7 hidden group-hover/bar:block bg-[#1B1B1C] text-white text-[9px] px-1.5 py-0.5 rounded-sm whitespace-nowrap z-30 shadow-md">
                    {agent.label}: {agent.val}%
                  </div>
                  <div className="w-full bg-stone-100 rounded-t-lg h-40 flex items-end overflow-hidden relative">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(agent.val, 4)}%` }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.1,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      className="bg-linear-to-t from-[#F5C518] to-[#FCD34D] hover:from-[#E2B30D] hover:to-[#F5C518] w-full rounded-t-lg relative"
                    />
                  </div>
                  <span className="text-[10px] mt-2 font-bold text-stone-500 truncate w-full text-center">
                    {agent.label}
                  </span>
                  <span className="text-base -mt-0.5">{agent.icon}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center pt-4 w-full">
            <div className="bg-stone-50 p-3 rounded-xl hover:bg-stone-100 transition-colors">
              <p className="text-[9px] text-stone-400 font-medium uppercase tracking-wide">
                Site Scores Avg
              </p>
              <p className="text-sm font-black text-stone-900 mt-0.5">
                {Math.round((contractScore + blueprintScore) / 2)}%
              </p>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl hover:bg-stone-100 transition-colors">
              <p className="text-[9px] text-stone-400 font-medium uppercase tracking-wide">
                Agent Loops
              </p>
              <p className="text-sm font-black text-stone-900 mt-0.5">
                {completedAgentCount} / {PIPELINE_AGENT_NAMES.length}
              </p>
            </div>
            <div className="bg-stone-50 p-3 rounded-xl hover:bg-stone-100 transition-colors">
              <p className="text-[9px] text-stone-400 font-medium uppercase tracking-wide">
                Permits Filed
              </p>
              <p className="text-sm font-black text-rose-600 mt-0.5">
                {permitsCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* SUPPLIERS & CREW — always rendered */}
        <div className="grid grid-cols-1 gap-6 w-full">
          {suppliers.length > 0 ? (
            <div className="premium-card p-5 w-full cursor-default!">
              <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518]"></span>
                Suppliers ({supplierCount})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto text-xs">
                {suppliers.map((s, i) => (
                  <div
                    key={i}
                    className="flex justify-between border border-stone-100 rounded-lg px-3 py-2 bg-stone-50 hover:bg-stone-100 hover:border-stone-200 transition-all duration-150"
                  >
                    <span className="font-semibold text-stone-800 truncate pr-2">
                      {String(s.material_name ?? s.supplier_name ?? "Material")}
                    </span>
                    <span className="text-stone-500 font-mono shrink-0">
                      {s.total_cost != null
                        ? `$${Number(s.total_cost).toLocaleString()}`
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="premium-card p-5 w-full cursor-default!">
              <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518]"></span>
                Suppliers
              </h3>
              <p className="text-xs text-stone-400 py-4 text-center">
                No supplier data yet. Run analyze to populate.
              </p>
            </div>
          )}
          {/* PROJECT SCHEDULES */}
          <div
            ref={schedulesRef}
            style={schedulesStyle}
            className="premium-card p-6 flex flex-col w-full min-h-80 cursor-default!"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#F5C518]" />
                Project Schedules
              </h3>
              <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-widest font-mono bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-md">
                {phaseList.length} phase{phaseList.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-70 pr-1">
              {phaseList.length === 0 && (
                <p className="text-xs text-stone-500 py-4 text-center">
                  No schedule phases yet. Run analyze to populate project
                  schedules.
                </p>
              )}
              {phaseList.map((phase, index) => (
                <div
                  key={index}
                  className="flex items-stretch gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200/60 hover:border-[#F5C518]/40 transition text-xs w-full"
                >
                  <div className="bg-[#F5C518] text-white p-2 rounded-lg shrink-0 flex items-center justify-center self-start">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap justify-between gap-2 items-start">
                      <h4 className="font-bold text-stone-900">{phase.name}</h4>
                      <span className="text-[9px] font-mono font-bold text-[#E2B30D] bg-[#F5C518]/10 px-2 py-0.5 rounded">
                        {phase.progress}% complete
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1">
                      {phase.startDate || "TBD"} → {phase.endDate || "TBD"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="progress-bar flex-1 h-1.5">
                        <div
                          className="progress-fill h-full"
                          style={{ width: `${phase.progress ?? 0}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-stone-400 capitalize shrink-0">
                        {phase.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SITE READINESS METER */}
        <div
          ref={complianceRef}
          style={complianceStyle}
          className="premium-card p-6 flex flex-col justify-between w-full min-h-80 cursor-default!"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-extrabold text-stone-900 tracking-tight text-sm">
                  Site Compliance Meter
                </h3>
                <p className="text-[10px] text-stone-400">
                  Ready state based on zoning rules
                </p>
              </div>
              <span className="font-black text-stone-900 bg-stone-50 border border-stone-200 font-mono px-2 py-0.5 rounded-lg text-xs">
                {overallReadiness}%
              </span>
            </div>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-700 flex items-center gap-1.5">
                    📄{" "}
                    <span className="font-medium text-stone-500">
                      Drafts Cleared
                    </span>
                  </span>
                  <span className="font-mono text-stone-400">
                    {siteReadiness.documents}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${siteReadiness.documents}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-700 flex items-center gap-1.5">
                    🏛️{" "}
                    <span className="font-medium text-stone-500">
                      Permits Approved
                    </span>
                  </span>
                  <span className="font-mono text-stone-400">
                    {siteReadiness.permits}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${siteReadiness.permits}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-700 flex items-center gap-1.5">
                    👷{" "}
                    <span className="font-medium text-stone-500">
                      Crew Staffing Mobilization
                    </span>
                  </span>
                  <span className="font-mono text-stone-400">
                    {siteReadiness.crewPlan}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${siteReadiness.crewPlan}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          {pendingPermits.length > 0 && (
            <div className="bg-[#F5C518]/10 border border-[#F5C518]/20 p-3.5 rounded-2xl flex items-start gap-2.5 mt-5">
              <AlertTriangle className="w-4 h-4 text-[#E2B30D] shrink-0 mt-0.5" />
              <p className="text-[10px] text-stone-700 leading-normal">
                <strong>Permit follow-up</strong>:{" "}
                {pendingPermits
                  .map((p) => `${p.name} (${p.status})`)
                  .join("; ")}
              </p>
            </div>
          )}
        </div>
      </div>
      {crewPlans.length > 0 ? (
        <div className="premium-card p-5 w-full cursor-default!">
          <CrewPlanGantt plans={crewPlans} />
        </div>
      ) : (
        <div className="premium-card p-5 w-full cursor-default!">
          <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518]"></span>
            Crew Plans
          </h3>
          <p className="text-xs text-stone-400 py-4 text-center">
            No crew plans yet. Run analyze to populate.
          </p>
        </div>
      )}
    </div>
  );
}
