import { useState, useEffect, useMemo, lazy, Suspense, useRef } from "react";
import { useParams, useNavigate, useLocation, Link, useSearchParams } from "react-router-dom";
import {
  Building2,
  HardHat,
  Bot,
  AlertTriangle,
  ArrowLeft,
  MapPin,
  CalendarDays,
  Ruler,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useProjectAgents, useProjectIntelligence, clearIntelligenceCache, clearAgentsCache } from "../hooks/usePageData";
import {
  getProject,
  getProjectCrew,
  getProjectSuppliers,
  isBackendProjectId,
  mapBackendProjectToUI,
  PIPELINE_AGENT_NAMES,
  startAnalyze,
  pollAnalyzeUntilComplete,
} from "../services/projectApi";
import type { AnalyzeJobStatus } from "../types";
const BlueprintSummaryPanel = lazy(() => import("../components/BlueprintSummaryPanel"));

import { RingSpinner } from "../components/Loader";
import BudgetBreakdownPanel from "../components/BudgetBreakdownPanel";
import BudgetAnalysisPanel from "../components/BudgetAnalysisPanel";
import ZoningPanel from "../components/ZoningPanel";
import SafetyPanel from "../components/SafetyPanel";
import ProjectDocumentsPanel from "../components/ProjectDocumentsPanel";
import ReportDeliveriesPanel from "../components/ReportDeliveriesPanel";
import CrewPlanGantt from "../components/CrewPlanGantt";
import CrewRosterPanel from "../components/CrewRosterPanel";
import InspectionChecklist from "../components/InspectionChecklist";
import MaterialsPanel from "../components/MaterialsPanel";
import ProjectRisksPanel from "../components/ProjectRisksPanel";
import RecommendationsPanel from "../components/RecommendationsPanel";
import SchedulePanel from "../components/SchedulePanel";
import { Building3DViewer } from "../components/building3d";
import BuildingStreamPanel from "../components/building3d/BuildingStreamPanel";
import { useBuildingStream } from "../hooks/useBuildingStream";
import type { CrewPlanRead, Project, ProjectSupplierRow } from "../types";
import {
  countCompletedAgents,
  latestByAgent,
} from "../utils/agentHelpers";

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { projects, uploadJustCompleted, setActiveProjectId } = useAppContext();
  const backPath =
    location.state?.from === "dashboard" ? "/dashboard" : "/projects";

  const project = projects.find((p) => p.id === projectId);
  const {
    data: intelligence,
    loading: intelligenceLoading,
    error: intelligenceError,
    refetch: refetchIntelligence,
  } = useProjectIntelligence(projectId ?? "");
  const {
    data: agentExecutions,
    loading: agentsLoading,
    error: agentsError,
    refetch: refetchAgents,
  } = useProjectAgents(projectId ?? "");

  const stream = useBuildingStream(projectId ?? "", intelligence?.buildingDefinition);
  const [hasAutoStreamed, setHasAutoStreamed] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const blueprintStatus = agentExecutions?.find(e => e.agent_name === "BlueprintAgent")?.status;
    if (blueprintStatus === "completed" && !hasAutoStreamed && intelligence?.buildingDefinition) {
      setHasAutoStreamed(true);
      setTimeout(() => {
        stream.startStream(false);
        viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
  }, [agentExecutions, hasAutoStreamed, intelligence, stream]);

  const [selectedProj, setSelectedProj] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [supplierCount, setSupplierCount] = useState(0);
  const [suppliers, setSuppliers] = useState<ProjectSupplierRow[]>([]);
  const [crewPlans, setCrewPlans] = useState<CrewPlanRead[]>([]);
  type TabId =
    | "budget"
    | "documents"
    | "schedule"
    | "materials"
    | "inspections"
    | "risks"
    | "recommendations"
    | "blueprint"
    | "crew"
    | "zoning"
    | "safety"
    | "reports";
  const [activeTab, setActiveTab] = useState<TabId>("budget");
  const [tabLoading, setTabLoading] = useState(false);
  const [activatedTabs, setActivatedTabs] = useState<Set<TabId>>(
    () => new Set(["budget"] as TabId[]),
  );
  const [isReRunning, setIsReRunning] = useState(false);
  const [reRunMessage, setReRunMessage] = useState<{
    tone: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  function reportDeliveryMessage(status: AnalyzeJobStatus): {
    tone: "success" | "warning" | "error";
    text: string;
  } {
    if (status.report_delivery_status === "sent") {
      return {
        tone: "success",
        text: "Analysis complete. Intelligence report emailed successfully.",
      };
    }
    if (status.report_delivery_status === "failed") {
      return {
        tone: "error",
        text:
          status.report_delivery_error ??
          "Analysis complete, but the report email failed to send.",
      };
    }
    if (status.report_delivery_status === "skipped") {
      return {
        tone: "warning",
        text:
          status.report_delivery_error ??
          "Analysis complete. Report email was skipped.",
      };
    }
    return {
      tone: "success",
      text: "Analysis complete.",
    };
  }

  function handleTabChange(tabId: TabId) {
    if (tabId === activeTab) return;
    setTabLoading(true);
    setTimeout(() => setTabLoading(false), 180);
    setActiveTab(tabId);
    setActivatedTabs((prev) => {
      if (prev.has(tabId)) return prev;
      return new Set([...prev, tabId]);
    });
  }

  useEffect(() => {
    if (projectId && isBackendProjectId(projectId)) {
      setActiveProjectId(projectId);
    }
  }, [projectId, setActiveProjectId]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "documents") {
      setActiveTab("documents");
      setActivatedTabs((prev) => new Set([...prev, "documents"]));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!projectId || !isBackendProjectId(projectId)) return;
    if (searchParams.get("refresh") !== "1" && !uploadJustCompleted) return;
    clearIntelligenceCache(projectId);
    clearAgentsCache(projectId);
    void refetchIntelligence();
    void refetchAgents();
  }, [
    projectId,
    searchParams,
    uploadJustCompleted,
    refetchIntelligence,
    refetchAgents,
  ]);

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
    if (!activatedTabs.has("materials") && !activatedTabs.has("schedule")) return;
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

  const pendingPermits = permitList.filter((p) => p.status !== "Approved");

  const detailTabs = [
    { id: "budget" as const, label: "Budget" },
    { id: "documents" as const, label: "Documents" },
    { id: "zoning" as const, label: "Zoning" },
    { id: "safety" as const, label: "Safety" },
    { id: "schedule" as const, label: "Schedule" },
    { id: "materials" as const, label: "Materials" },
    { id: "inspections" as const, label: "Inspections" },
    { id: "risks" as const, label: "Risks" },
    { id: "recommendations" as const, label: "Recommendations" },
    { id: "blueprint" as const, label: "Blueprint" },
    { id: "crew" as const, label: "Crew Roster" },
    { id: "reports" as const, label: "Reports" },
  ];

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
          Nine-agent analysis complete — persisted intelligence loaded from the
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
        {/* STATIC BLUEPRINT SPECIFICATION DETAIL CARD */}
        <div className="glass-card p-6 flex flex-col xl:col-span-8 w-full min-h-[380px] bg-stone-950 text-stone-100 border border-stone-800 relative overflow-hidden">
          {/* Blueprint Grid Lines Pattern */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(245, 197, 24, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 197, 24, 0.2) 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          ></div>

          <div className="relative z-10 flex justify-between items-center mb-4 border-b border-stone-800 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#F5C518] flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Blueprint Schematics & Specifications
            </h3>
            <span className="text-[9px] bg-[#F5C518]/25 text-[#F5C518] border border-[#F5C518]/30 font-bold px-2.5 py-1 rounded-md uppercase font-mono tracking-wider">
              Draft Status: Extracted
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 my-auto">
            {/* Dimensions Section */}
            <div className="space-y-4">
              <div className="border border-stone-800 rounded-xl p-4 bg-stone-900/50">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Dimensional Blueprint Data</p>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-stone-800/60 pb-1.5">
                    <span className="text-stone-500">Gross Floor Area:</span>
                    <span className="font-bold text-[#F5C518]">{intelligence?.squareFootage ? Number(intelligence.squareFootage).toLocaleString() : "-"} SF</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-800/60 pb-1.5">
                    <span className="text-stone-500">Total Height:</span>
                    <span className="font-bold text-[#F5C518]">{intelligence?.buildingDefinition?.building?.totalHeight_m ?? "-"} m</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-800/60 pb-1.5">
                    <span className="text-stone-500">Floor count:</span>
                    <span className="font-bold text-[#F5C518]">{intelligence?.floors ?? intelligence?.buildingDefinition?.building?.stories ?? "-"} stories</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Est. Footprint:</span>
                    <span className="font-bold text-[#F5C518]">
                      {intelligence?.buildingDefinition?.building?.footprint?.width_m ?? "?"}m × {intelligence?.buildingDefinition?.building?.footprint?.depth_m ?? "?"}m
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Facade & Structure Section */}
            <div className="space-y-4">
              <div className="border border-stone-800 rounded-xl p-4 bg-stone-900/50">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Materials & Structural Rules</p>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-stone-800/60 pb-1.5">
                    <span className="text-stone-500">Primary Cladding:</span>
                    <span className="font-bold text-[#F5C518] uppercase">{intelligence?.buildingDefinition?.facade?.material ?? "Concrete"}</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-800/60 pb-1.5">
                    <span className="text-stone-500">Window Pattern:</span>
                    <span className="font-bold text-[#F5C518] uppercase">{intelligence?.buildingDefinition?.facade?.window_pattern ?? "Grid"}</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-800/60 pb-1.5">
                    <span className="text-stone-500">Balcony Structures:</span>
                    <span className="font-bold text-[#F5C518]">{intelligence?.buildingDefinition?.facade?.balconies ? "INTEGRATED" : "NONE"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Roof Profile:</span>
                    <span className="font-bold text-[#F5C518] uppercase">{intelligence?.buildingDefinition?.building?.roof_type ?? "Flat"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 border-t border-stone-800 pt-3 flex justify-between items-center text-[10px] text-stone-500 font-mono">
            <span>CAD-READY COORDINATE ARRAYS GENERATED</span>
            <span>SHEET ID: C-101 (STRUCTURAL SCHEMA)</span>
          </div>
        </div>
      </div>

      {/* ── 3D BUILDING VIEWER ─────────────────────────────────── */}
      {intelligence?.buildingDefinition ? (
        <div ref={viewerRef} className="col-span-12 rounded-2xl overflow-hidden border border-stone-800/50 shadow-2xl relative w-full" style={{ height: '500px' }}>
          <Building3DViewer 
            buildingDefinition={stream.partialDefinition ?? intelligence.buildingDefinition}
            streamingHint={{
              isStreaming: stream.status === "streaming",
              currentHeightM: stream.partialDefinition?.levels.reduce((acc, lvl) => acc + lvl.height_m, 0) ?? 0,
              totalHeightM: intelligence.buildingDefinition.building?.totalHeight_m ?? 50
            }}
          />
          <div className="absolute bottom-6 right-6 z-10 pointer-events-auto">
            <BuildingStreamPanel stream={stream} />
          </div>
        </div>
      ) : (
        <div className="col-span-12 rounded-2xl bg-stone-950/50 border border-stone-800/30 h-[500px] flex flex-col items-center justify-center gap-3">
          <span className="text-4xl">🏗️</span>
          <p className="text-stone-500 text-sm">3D model will appear after blueprint analysis</p>
        </div>
      )}

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

      {/* AGENT EXECUTION AUDITS — link to AI Insights */}
      <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#F5C518]" />
            Agent Execution Audits
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Full pipeline audit, agent output, and chat live on AI Insights.
            {completedAgentCount > 0 && (
              <span className="text-stone-400">
                {" "}
                · {completedAgentCount}/{PIPELINE_AGENT_NAMES.length} agents complete
              </span>
            )}
          </p>
          {reRunMessage && (
            <p
              className={`text-xs mt-2 ${
                reRunMessage.tone === "success"
                  ? "text-emerald-700"
                  : reRunMessage.tone === "warning"
                    ? "text-amber-700"
                    : "text-red-600"
              }`}
            >
              {reRunMessage.text}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={async () => {
              if (!projectId || isReRunning) return;
              setReRunMessage(null);
              setIsReRunning(true);
              try {
                clearIntelligenceCache(projectId);
                clearAgentsCache(projectId);
                const job = await startAnalyze(Number(projectId), {
                  sendReportEmail: true,
                });
                let deliveryStatus: AnalyzeJobStatus | null = null;
                await pollAnalyzeUntilComplete(Number(projectId), job.job_id, {
                  onComplete: (status) => {
                    deliveryStatus = status;
                  },
                });
                if (deliveryStatus) {
                  navigate("/ai-insights", {
                    state: {
                      analyzeMessage: reportDeliveryMessage(deliveryStatus),
                    },
                  });
                } else {
                  navigate("/ai-insights");
                }
              } catch (err) {
                console.error("Failed to start analyze job:", err);
                setReRunMessage({
                  tone: "error",
                  text: "Failed to complete re-analysis. Please try again.",
                });
              } finally {
                setIsReRunning(false);
              }
            }}
            disabled={isReRunning}
            style={{ cursor: isReRunning ? "wait" : "pointer" }}
            className="inline-flex items-center justify-center gap-1.5 shrink-0 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 transition-colors disabled:opacity-60"
          >
            <Bot className="w-4 h-4 text-[#F5C518]" />
            {isReRunning ? "Re-running analysis…" : "Re-run Analysis"}
          </button>
          <Link
            to="/ai-insights"
            className="inline-flex items-center justify-center gap-1.5 shrink-0 text-xs font-bold text-stone-900 bg-[#F5C518] hover:bg-[#E2B30D] border border-[#F5C518]/40 rounded-xl px-4 py-2.5 transition-colors"
          >
            <Bot className="w-4 h-4" />
            Open AI Insights
          </Link>
        </div>
      </div>

      {/* DETAIL TABS */}
      <div className="glass-card p-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">
          Project Intelligence
        </h3>
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
        {tabLoading ? (
          <div className="flex items-center justify-center py-10">
            <RingSpinner size={48} />
          </div>
        ) : (
          <>
            {activeTab === "budget" && (
              <div className="space-y-8">
                {intelligence && (
                  <BudgetBreakdownPanel
                    intelligence={intelligence}
                    supplierRows={suppliers}
                  />
                )}
                <BudgetAnalysisPanel data={intelligence?.budgetAnalysis} />
              </div>
            )}
            {activeTab === "documents" && projectId && (
              <ProjectDocumentsPanel projectId={projectId} />
            )}
            {activeTab === "zoning" && (
              <ZoningPanel data={intelligence?.zoningAssessment} />
            )}
            {activeTab === "safety" && (
              <SafetyPanel data={intelligence?.safetyAssessment} />
            )}
            {activeTab === "reports" && projectId && (
              <ReportDeliveriesPanel projectId={projectId} />
            )}
            {activeTab === "schedule" && intelligence && (
              <SchedulePanel intelligence={intelligence} supplierRows={suppliers} />
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
            {activeTab === "crew" && selectedProj && (
              <CrewRosterPanel projectId={selectedProj.id} />
            )}
            {activeTab === "recommendations" && (
              <RecommendationsPanel
                recommendations={intelligence?.recommendations ?? []}
                agentExecutions={executionList}
              />
            )}
            {activeTab === "blueprint" && (
              <Suspense fallback={
                <div className="flex items-center justify-center py-10">
                  <RingSpinner size={48} />
                </div>
              }>
                <BlueprintSummaryPanel
                  summary={intelligence?.blueprintSummary ?? null}
                  buildingDefinition={intelligence?.buildingDefinition ?? null}
                  floors={intelligence?.floors ?? 0}
                  squareFootage={intelligence?.squareFootage ?? "—"}
                  complexity={intelligence?.complexity ?? "—"}
                />
              </Suspense>
            )}
          </>
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
          )}
          {crewPlans.length > 0 ? (
            <div className="premium-card p-5 md:p-6 w-full cursor-default! animate-fade-in-up">
              <CrewPlanGantt plans={crewPlans} />
            </div>
          ) : (
            <div className="premium-card p-5 md:p-6 w-full cursor-default!">
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
      )}
    </div>
  );
}
