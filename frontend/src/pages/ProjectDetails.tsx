import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { useProjectAgents, useProjectIntelligence } from "../hooks/usePageData";
import {
  getProject,
  getProjectCrew,
  getProjectSuppliers,
  isBackendProjectId,
  mapBackendProjectToUI,
  PIPELINE_AGENT_NAMES,
} from "../services/projectApi";
const Blueprint3DTab = lazy(() => import("../components/Blueprint3DTab"));
const BuildingPreviewCarousel = lazy(() => import("../components/BuildingPreviewCarousel"));
const BuildingSnapshotCapture = lazy(() => import("../components/building3d/BuildingSnapshotCapture"));
import BlueprintSummaryPanel from "../components/BlueprintSummaryPanel";
import BudgetBreakdownPanel from "../components/BudgetBreakdownPanel";
import CrewPlanGantt from "../components/CrewPlanGantt";
import InspectionChecklist from "../components/InspectionChecklist";
import MaterialsPanel from "../components/MaterialsPanel";
import ProjectRisksPanel from "../components/ProjectRisksPanel";
import RecommendationsPanel from "../components/RecommendationsPanel";
import SchedulePanel from "../components/SchedulePanel";
import type { CrewPlanRead, Project, ProjectSupplierRow } from "../types";
import {
  countCompletedAgents,
  latestByAgent,
} from "../utils/agentHelpers";
import { useBuildingSnapshots } from "../hooks/useBuildingSnapshots";

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
    data: agentExecutions,
    loading: agentsLoading,
    error: agentsError,
  } = useProjectAgents(projectId ?? "");

  const [selectedProj, setSelectedProj] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [supplierCount, setSupplierCount] = useState(0);
  const [suppliers, setSuppliers] = useState<ProjectSupplierRow[]>([]);
  const [crewPlans, setCrewPlans] = useState<CrewPlanRead[]>([]);
  type TabId =
    | "overview"
    | "budget"
    | "schedule"
    | "materials"
    | "inspections"
    | "risks"
    | "recommendations"
    | "blueprint"
    | "3d_view";
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [activatedTabs, setActivatedTabs] = useState<Set<TabId>>(
    () => new Set(["overview"] as TabId[]),
  );

  function handleTabChange(tabId: TabId) {
    setActiveTab(tabId);
    setActivatedTabs((prev) => {
      if (prev.has(tabId)) return prev;
      return new Set([...prev, tabId]);
    });
  }

  const deferSnapshotCapture = activeTab === "3d_view";
  const {
    shots: snapshotShots,
    status: snapshotStatus,
    progress: snapshotProgress,
    shouldCapture,
    regenerate: regenerateSnapshots,
    onCaptureComplete,
    onCaptureProgress,
    onCaptureError,
  } = useBuildingSnapshots({
    projectId,
    buildingDefinition: intelligence?.buildingDefinition,
    deferCapture: deferSnapshotCapture,
  });

  useEffect(() => {
    if (projectId && isBackendProjectId(projectId)) {
      setActiveProjectId(projectId);
    }
  }, [projectId, setActiveProjectId]);

  useEffect(() => {
    if (project) setSelectedProj(project);
  }, [project]);

  useEffect(() => {
    if (!projectId || !isBackendProjectId(projectId) || project) return;
    setProjectLoading(true);
    setProjectError(null);
    getProject(Number(projectId))
      .then((p) => setSelectedProj(mapBackendProjectToUI(p)))
      .catch((e: Error) => setProjectError(e.message))
      .finally(() => setProjectLoading(false));
  }, [projectId, project]);

  useEffect(() => {
    if (!activatedTabs.has("materials")) return;
    if (!projectId || !isBackendProjectId(projectId)) return;
    getProjectSuppliers(Number(projectId))
      .then((res) => {
        setSupplierCount(res.suppliers.length);
        setSuppliers(res.suppliers);
      })
      .catch(() => undefined);
  }, [activatedTabs, projectId]);

  useEffect(() => {
    if (!projectId || !isBackendProjectId(projectId)) return;
    getProjectCrew(Number(projectId))
      .then((res) => setCrewPlans(res.crew_plans))
      .catch(() => undefined);
  }, [projectId]);

  const executionList = useMemo(() => agentExecutions ?? [], [agentExecutions]);
  const byAgent = useMemo(
    () => latestByAgent(executionList),
    [executionList],
  );
  const completedAgentCount = countCompletedAgents(byAgent);

  const pageLoading =
    (projectLoading || intelligenceLoading || agentsLoading) && !selectedProj;
  const pageError = projectError ?? intelligenceError ?? agentsError;

  if (pageLoading) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 mx-auto text-stone-300 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold text-stone-700">Loading project…</h2>
        <p className="text-sm text-stone-400 mt-1">
          Fetching project data from the API.
        </p>
      </div>
    );
  }

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

  const permitList = intelligence?.requiredPermits ?? [];
  const phaseList = intelligence?.phases ?? [];
  const readiness = intelligence?.readiness;

  const overallReadiness = readiness?.overallReadinessPct ?? selectedProj.progress;
  const siteReadiness = {
    documents: readiness?.documentsPct ?? readiness?.agentCompletionPct ?? 0,
    permits: readiness?.permitsPct ?? readiness?.permitReadinessPct ?? 0,
    crewPlan: readiness?.crewPlanPct ?? readiness?.workforceReadinessPct ?? 0,
  };
  const permitsCount = permitList.length;

  const agentMetrics = [
    { label: "Contract", icon: "📜", val: readiness?.agentCompletionPct ?? 0 },
    { label: "Blueprint", icon: "📐", val: readiness?.agentCompletionPct ?? 0 },
    { label: "Permits", icon: "🏛️", val: readiness?.permitReadinessPct ?? 0 },
    { label: "Timeline", icon: "🗓️", val: readiness?.phaseProgressPct ?? 0 },
    { label: "Suppliers", icon: "🚚", val: readiness?.procurementReadinessPct ?? 0 },
    { label: "Crew Ops", icon: "👷", val: readiness?.workforceReadinessPct ?? 0 },
  ];

  const detailTabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "budget" as const, label: "Budget" },
    { id: "schedule" as const, label: "Schedule" },
    { id: "materials" as const, label: "Materials" },
    { id: "inspections" as const, label: "Inspections" },
    { id: "risks" as const, label: "Risks" },
    { id: "recommendations" as const, label: "Recommendations" },
    { id: "blueprint" as const, label: "Blueprint" },
    { id: "3d_view" as const, label: "3D View" },
  ];

  const pendingPermits = permitList.filter((p) => p.status !== "Approved");

  const handleSelectProjectDetails = (p: Project) => {
    setSelectedProj(p);
    navigate(`/projects/${p.id}`, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full max-w-none space-y-6 animate-fade-in-up">
      {/* BREADCRUMB & ACTION STRIP */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <button
          onClick={() => navigate(backPath)}
          style={{ cursor: "pointer" }}
          className="px-4 py-2 bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:border-stone-400 rounded-xl font-bold flex items-center gap-2 transition text-xs shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio Overview
        </button>
        <div className="text-right text-xs text-stone-400 font-semibold font-mono">
          Focus:{" "}
          <span className="text-[#E2B30D] font-bold">
            {selectedProj.name.split(" ")[0]} Project
          </span>
        </div>
      </div>

      {uploadJustCompleted && isBackendProjectId(projectId ?? "") && (
        <div className="glass-card p-4 border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm font-semibold">
          Six-agent analyze complete — persisted intelligence loaded from the
          backend.
        </div>
      )}

      {(intelligenceLoading || agentsLoading) &&
        isBackendProjectId(projectId ?? "") && (
          <div className="text-sm text-stone-500 font-medium">
            Loading project intelligence from API…
          </div>
        )}
      {pageError && selectedProj && (
        <div className="glass-card p-3 border border-amber-200 bg-amber-50 text-amber-900 text-xs">
          Partial load warning: {pageError}
        </div>
      )}

      {/* DETAILED PROJECT TITLE BANNER */}
      <div className="glass-card p-5 md:p-6 relative overflow-hidden">
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
        <div className="glass-card p-6 relative overflow-hidden flex flex-col justify-between group min-h-[380px] xl:col-span-4 w-full">
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

        {/* 3D BUILDING PREVIEW CAROUSEL */}
        <div className="glass-card p-6 flex flex-col xl:col-span-8 w-full min-h-[380px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#F5C518]" />
              3D Building Previews
            </h3>
            {snapshotStatus === "ready" && snapshotShots.length > 0 && (
              <span className="text-[9px] bg-stone-100 text-stone-500 font-bold px-2 py-0.5 rounded-md font-mono uppercase">
                {snapshotShots.length} views
              </span>
            )}
          </div>
          <Suspense fallback={<div className="h-64 rounded-2xl skeleton" />}>
            <BuildingPreviewCarousel
              shots={snapshotShots}
              status={snapshotStatus}
              progress={snapshotProgress}
              embedded
              onOpen3DTab={() => handleTabChange("3d_view")}
              onRegenerate={regenerateSnapshots}
            />
          </Suspense>
        </div>
      </div>

      {/* ROW 2 — compliance + project schedules (equal full-width columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* SITE READINESS METER */}
        <div className="glass-card p-6 flex flex-col justify-between w-full min-h-[320px]">
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
              <span className="text-lg font-black text-stone-900 bg-stone-50 border border-stone-200 font-mono px-2 py-0.5 rounded-lg text-xs">
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
                {pendingPermits.map((p) => `${p.name} (${p.status})`).join("; ")}
              </p>
            </div>
          )}
        </div>
        {/* PROJECT SCHEDULES */}
        <div className="glass-card p-6 flex flex-col w-full min-h-[320px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#F5C518]" />
              Project Schedules
            </h3>
            <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-widest font-mono bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-md">
              {phaseList.length} phase{phaseList.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px] pr-1">
            {phaseList.length === 0 && (
              <p className="text-xs text-stone-500 py-4 text-center">
                No schedule phases yet. Run analyze to populate project schedules.
              </p>
            )}
            {phaseList.map((phase) => (
              <div
                key={phase.name}
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

      {/* ACCORDION DETAILED SPECIFICATION BLOCKS */}
      {/* <div className="glass-card p-6 relative">
        <h3 className="text-base font-extrabold text-stone-900 tracking-tight mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#F5C518]" />
          Detailed Site Specific Analytics & Agent Audits
        </h3>
        <div className="space-y-3">
          <div className="border border-stone-200 rounded-2xl overflow-hidden transition-all duration-300">
            <button
              onClick={() => toggleSection("contract")}
              className="w-full bg-stone-50 hover:bg-stone-100/70 p-4 flex justify-between items-center text-left transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f0f2f5] border border-stone-200/80 flex items-center justify-center text-base">
                  📜
                </div>
                <div>
                  <span className="text-xs text-stone-400 uppercase font-bold tracking-widest block text-[9px]">
                    Autonomous Report
                  </span>
                  <span className="text-xs font-bold text-stone-800">
                    📜 Contract Summary Analysis
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-stone-200/60 text-stone-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                  ContractAgent v3
                </span>
                {expandedSections.contract ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </div>
            </button>
            {expandedSections.contract && (
              <div className="p-5 bg-white text-xs text-stone-600 border-t border-stone-100 leading-relaxed space-y-2">
                <p className="font-semibold text-stone-800">
                  📋 Injected Agent Specification Insights:
                </p>
                <p>{telemetry.contractSummaryText}</p>
                <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-3 mt-3 flex justify-between items-center">
                  <span className="font-semibold text-stone-700">
                    Contract Verification Score
                  </span>
                  <span className="font-mono text-[#E2B30D] font-bold text-sm bg-white border border-stone-200 px-2.5 py-0.5 rounded-lg">
                    {contractScore} / 100
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border border-stone-200 rounded-2xl overflow-hidden transition-all duration-300">
            <button
              onClick={() => toggleSection("blueprint")}
              className="w-full bg-stone-50 hover:bg-stone-100/70 p-4 flex justify-between items-center text-left transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f0f2f5] border border-stone-200/80 flex items-center justify-center text-base">
                  📐
                </div>
                <div>
                  <span className="text-xs text-stone-400 uppercase font-bold tracking-widest block text-[9px]">
                    Autonomously Extracted
                  </span>
                  <span className="text-xs font-bold text-stone-800">
                    📐 Blueprint Review & Load Checks
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-stone-200/60 text-stone-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                  BlueprintAgent v2.4
                </span>
                {expandedSections.blueprint ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </div>
            </button>
            {expandedSections.blueprint && (
              <div className="p-5 bg-white text-xs text-stone-600 border-t border-stone-100 leading-relaxed space-y-2">
                <p className="font-semibold text-stone-800">
                  📐 Building Footprint Analysis Results:
                </p>
                <p>{telemetry.blueprintAnalysisText}</p>
                <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-3 mt-3 flex justify-between items-center">
                  <span className="font-semibold text-stone-700">
                    Clearances Compliance Rating
                  </span>
                  <span className="font-mono text-[#E2B30D] font-bold text-sm bg-white border border-stone-200 px-2.5 py-0.5 rounded-lg">
                    {blueprintScore} / 100
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border border-stone-200 rounded-2xl overflow-hidden transition-all duration-300">
            <button
              onClick={() => toggleSection("permits")}
              className="w-full bg-stone-50 hover:bg-stone-100/70 p-4 flex justify-between items-center text-left transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#f0f2f5] border border-stone-200/80 flex items-center justify-center text-base">
                  🏛️
                </div>
                <div>
                  <span className="text-xs text-stone-400 uppercase font-bold tracking-widest block text-[9px]">
                    Permits & Filings
                  </span>
                  <span className="text-xs font-bold text-stone-800">
                    🏛️ Permit Logs & Applications
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="status-badge text-[9.5px] font-black"
                  style={{
                    backgroundColor: "#f0f2f5",
                    color: "#E2B30D",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {permitsCount} Pending Alerts
                </span>
                {expandedSections.permits ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </div>
            </button>
            {expandedSections.permits && (
              <div className="p-5 bg-white text-xs text-stone-600 border-t border-stone-100 leading-relaxed space-y-2">
                <p className="font-semibold text-stone-800">
                  🏛️ Active Building Licensing Queue:
                </p>
                <p>{telemetry.permitStatusText}</p>
                <div className="grid grid-cols-2 gap-3 mt-3 font-mono">
                  <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-3 text-center text-xs">
                    <span className="text-[9px] text-stone-400 block font-bold uppercase">
                      Approved
                    </span>
                    <span className="font-extrabold text-stone-800">
                      {permitList.filter((p) => p.status === "Approved").length}
                    </span>
                  </div>
                  <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-3 text-center text-xs">
                    <span className="text-[9px] text-stone-400 block font-bold uppercase">
                      Pending review
                    </span>
                    <span className="font-extrabold text-[#E2B30D]">
                      {pendingPermits.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div> */}

      {/* DETAIL TABS */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-2 border-b border-stone-100 pb-3 mb-4">
          {detailTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-[#1a2035] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "budget" && intelligence && (
          <BudgetBreakdownPanel
            intelligence={intelligence}
            supplierRows={suppliers}
          />
        )}
        {activeTab === "schedule" && intelligence && (
          <SchedulePanel intelligence={intelligence} />
        )}
        {activeTab === "materials" && (
          <MaterialsPanel
            materials={intelligence?.materials ?? []}
            supplierRows={suppliers}
          />
        )}
        {activeTab === "inspections" && (
          <InspectionChecklist inspections={intelligence?.inspections ?? []} />
        )}
        {activeTab === "risks" && (
          <ProjectRisksPanel
            supplyChainRisks={intelligence?.supplyChainRisks ?? []}
            workforceGaps={intelligence?.workforceGaps ?? []}
          />
        )}
        {activeTab === "recommendations" && (
          <RecommendationsPanel
            recommendations={intelligence?.recommendations ?? []}
            agentExecutions={executionList}
          />
        )}
        {activeTab === "blueprint" && intelligence && (
          <BlueprintSummaryPanel
            summary={intelligence.blueprintSummary}
            floors={intelligence.floors}
            squareFootage={intelligence.squareFootage}
            complexity={intelligence.complexity}
          />
        )}
        {activeTab === "3d_view" && intelligence && (
          <Suspense fallback={<div className="flex items-center justify-center h-64 text-stone-400 text-sm">Loading 3D view…</div>}>
            <Blueprint3DTab
              summary={intelligence.blueprintSummary}
              buildingDefinition={intelligence.buildingDefinition}
              floors={intelligence.floors}
              squareFootage={intelligence.squareFootage}
              complexity={intelligence.complexity}
            />
          </Suspense>
        )}
        {activeTab === "overview" && (
          <p className="text-sm text-stone-500">
            Use the tabs above for budget, schedule, materials, risks, and the
            interactive 3D viewer. Building previews are shown at the top of this
            page.
          </p>
        )}
      </div>

      {/* SUPPLIERS & CREW FROM API */}
      {(suppliers.length > 0 || crewPlans.length > 0) && (
        <div className="grid grid-cols-1 gap-6 w-full">
          {suppliers.length > 0 && (
            <div className="glass-card p-5 w-full">
              <h3 className="text-sm font-bold text-stone-900 mb-3">
                Suppliers ({supplierCount})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto text-xs">
                {suppliers.map((s, i) => (
                  <div
                    key={i}
                    className="flex justify-between border border-stone-100 rounded-lg px-3 py-2 bg-stone-50"
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
          )}
          {crewPlans.length > 0 && (
            <CrewPlanGantt
              plans={crewPlans}
              phases={intelligence?.phases}
              criticalPathPhases={intelligence?.criticalPathPhases}
              onOpenScheduleTab={() => handleTabChange("schedule")}
            />
          )}
        </div>
      )}

      {/* FOCUSED AGENT ACTIVITIES — bottom of page */}
      <div className="glass-card p-6 flex flex-col justify-between w-full min-h-[320px]">
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
          <div className="grid grid-cols-6 gap-3 flex-1 min-h-[200px] items-end pt-4 pb-2 border-b border-stone-100">
            {agentMetrics.map((agent) => (
              <div
                key={agent.label}
                className="flex flex-col items-center h-full justify-end group/bar relative min-w-0"
              >
                <div className="absolute -top-7 hidden group-hover/bar:block bg-[#1B1B1C] text-white text-[9px] px-1.5 py-0.5 rounded-sm whitespace-nowrap z-30 shadow-md">
                  {agent.label}: {agent.val}%
                </div>
                <div className="w-full bg-stone-100 rounded-t-lg h-[160px] flex items-end overflow-hidden">
                  <div
                    className="bg-[#F5C518] hover:bg-[#E2B30D] w-full rounded-t-lg transition-all duration-1000 relative"
                    style={{ height: `${Math.max(agent.val, 4)}%` }}
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
          <div className="bg-stone-50 p-3 rounded-xl">
            <p className="text-[9px] text-stone-400 font-medium uppercase tracking-wide">
              Site Scores Avg
            </p>
            <p className="text-sm font-black text-stone-900 mt-0.5">
              {overallReadiness}%
            </p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl">
            <p className="text-[9px] text-stone-400 font-medium uppercase tracking-wide">
              Agent Loops
            </p>
            <p className="text-sm font-black text-stone-900 mt-0.5">
              {completedAgentCount} / {PIPELINE_AGENT_NAMES.length}
            </p>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl">
            <p className="text-[9px] text-stone-400 font-medium uppercase tracking-wide">
              Permits Filed
            </p>
            <p className="text-sm font-black text-rose-600 mt-0.5">
              {permitsCount}
            </p>
          </div>
        </div>
      </div>

      {/* AI USAGE SUMMARY */}
      {/* <div className="glass-card p-6 w-full">
        <h3 className="text-base font-extrabold text-stone-900 tracking-tight mb-4">
          AI Usage Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-stone-400 uppercase font-bold">
              Total runs
            </p>
            <p className="text-2xl font-black text-stone-900 mt-1">
              {agentUsage.totalRuns}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-stone-400 uppercase font-bold">
              Avg duration
            </p>
            <p className="text-2xl font-black text-stone-900 mt-1">
              {agentUsage.avgDuration}s
            </p>
          </div>
          <div>
            <p className="text-[10px] text-stone-400 uppercase font-bold">
              Tokens used
            </p>
            <p className="text-2xl font-black text-stone-900 mt-1">
              {agentUsage.totalTokens.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-stone-400 uppercase font-bold">
              Agents complete
            </p>
            <p className="text-2xl font-black text-stone-900 mt-1">
              {completedAgentCount}/{PIPELINE_AGENT_NAMES.length}
            </p>
          </div>
        </div>
      </div> */}
      {shouldCapture && intelligence?.buildingDefinition && (
        <Suspense fallback={null}>
          <BuildingSnapshotCapture
            definition={intelligence.buildingDefinition}
            onProgress={onCaptureProgress}
            onComplete={onCaptureComplete}
            onError={onCaptureError}
          />
        </Suspense>
      )}
    </div>
  );
}
