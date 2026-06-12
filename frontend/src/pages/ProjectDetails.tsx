import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  HardHat,
  Bot,
  Timer,
  Play,
  Pause,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Activity,
  Layers,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import type { Project } from "../types";

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { projects } = useAppContext();
  const backPath =
    location.state?.from === "dashboard" ? "/dashboard" : "/projects";

  const project = projects.find((p) => p.id === projectId);

  const [selectedProj, setSelectedProj] = useState<Project | null>(null);

  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [timerCount, setTimerCount] = useState(148);
  const [timerLog, setTimerLog] = useState(
    "Agent ScheduleAgent optimizing site milestones...",
  );

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    contract: true,
    blueprint: false,
    permits: false,
    budget: false,
  });

  useEffect(() => {
    if (project) setSelectedProj(project);
  }, [project]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerCount((prev) => prev + 1);
        const logs = [
          "🤖 ContractAgent verified zoning compliance parameters.",
          "📐 BlueprintAgent calculating load-bearing ratios for columns.",
          "🏛️ PermitAgent pushing site documentation into municipality queue...",
          "🗓️ ScheduleAgent recalculating concrete curing times based on climate feed.",
          "🚚 SupplierAgent checking steel beam lead times from regional mills.",
          "👷 CrewAgent reconciling forklift certificates for sub-assemblies.",
        ];
        setTimerLog(logs[Math.floor(Math.random() * logs.length)]);
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!selectedProj) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 mx-auto text-stone-300 mb-4" />
        <h2 className="text-xl font-bold text-stone-700">Project not found</h2>
        <p className="text-sm text-stone-400 mt-1">
          The project you're looking for doesn't exist.
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

  const hash = selectedProj.name.length;
  const telemetry = {
    contractAnalysisScore: 60 + (hash % 30),
    blueprintReviewScore: 50 + (hash % 40),
    permitRequiredCount: 1 + (hash % 4),
    budgetScore: 70 + (hash % 25),
    siteReadiness: {
      documents: 60 + (hash % 35),
      permits: 40 + (hash % 45),
      crewPlan: 30 + (hash % 55),
    },
    contractSummaryText: `Contractual documents for "${selectedProj.name}" specify sub-foundational design guarantees for concrete and steel structural assemblies.`,
    blueprintAnalysisText: `BlueprintReviewAgent reports that grid alignments of "${selectedProj.name}" comply generally with regional commercial height limitations. Southern egress clear widths measure 44.2 in (IBC safety code requires 48 in for assembly divisions).`,
    permitStatusText: `Grading permits and seismic anchor safety approvals are currently in process for ${selectedProj.name}. Foundations permit formally submitted to city.`,
    budgetBreakdownText:
      "Raw material steel spans account for 38% of budget allocation. Concrete grading bases are pegged at 28%.",
  };

  const siteReadiness = telemetry.siteReadiness;
  const overallReadiness = Math.round(
    (siteReadiness.documents + siteReadiness.permits + siteReadiness.crewPlan) /
      3,
  );
  const contractScore = telemetry.contractAnalysisScore;
  const blueprintScore = telemetry.blueprintReviewScore;
  const permitsCount = telemetry.permitRequiredCount;
  const permitsScore = 100 - permitsCount * 15;
  const budgetScore = telemetry.budgetScore;

  const agentMetrics = [
    { label: "Contract", icon: "📜", val: Math.min(contractScore, 95) },
    { label: "Blueprint", icon: "📐", val: Math.min(blueprintScore, 90) },
    { label: "Permits", icon: "🏛️", val: Math.min(permitsScore, 95) },
    { label: "Timeline", icon: "🗓️", val: 78 },
    { label: "Suppliers", icon: "🚚", val: 65 },
    { label: "Crew Ops", icon: "👷", val: 82 },
  ];

  const handleSelectProjectDetails = (p: Project) => {
    setSelectedProj(p);
    navigate(`/projects/${p.id}`, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
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
              {selectedProj.location} · Budget:{" "}
              <span className="text-stone-800 font-bold">
                {selectedProj.budget}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* BENTO GRID ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SPOTLIGHT DETAILED SPECIFICATION CARD */}
        <div className="glass-card p-6 relative overflow-hidden flex flex-col justify-between group min-h-[420px]">
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
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#F5C518]" />
                Focused Agent Activities
              </h3>
              <span className="text-[9px] bg-stone-100 text-stone-500 font-bold px-2 py-0.5 rounded-md font-mono uppercase">
                Active State
              </span>
            </div>
            <div className="grid grid-cols-9 h-[180px] gap-2 items-end pt-4 pb-2 border-b border-stone-100">
              {agentMetrics.map((agent, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center h-full justify-end group/bar relative"
                >
                  <div className="absolute top-[-30px] hidden group-hover/bar:block bg-[#1B1B1C] text-white text-[9px] px-1.5 py-0.5 rounded-sm whitespace-nowrap z-30 shadow-md">
                    {agent.label}: {agent.val} ops
                  </div>
                  <div className="w-full bg-stone-100 rounded-t-lg h-full flex items-end overflow-hidden">
                    <div
                      className="bg-[#F5C518] hover:bg-[#E2B30D] w-full rounded-t-lg transition-all duration-1000 relative"
                      style={{ height: `${agent.val}%` }}
                    >
                      {agent.val > 80 && (
                        <div className="absolute inset-0 bg-linear-to-t from-transparent via-white/15 to-transparent animate-pulse"></div>
                      )}
                    </div>
                  </div>
                  <span className="text-base mt-2 filter drop-shadow-xs transition transform group-hover/bar:scale-120 duration-300">
                    {agent.icon}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-4">
            <div className="bg-stone-50 p-2 rounded-xl">
              <p className="text-[9px] text-stone-400 font-medium">
                Site Scores Avg
              </p>
              <p className="text-xs font-black text-stone-900">
                {Math.round((contractScore + blueprintScore) / 2)}%
              </p>
            </div>
            <div className="bg-stone-50 p-2 rounded-xl">
              <p className="text-[9px] text-stone-400 font-medium">
                Agent Loops
               </p>
               <p className="text-xs font-black text-stone-900">6 / 6 Passed</p>
            </div>
            <div className="bg-stone-50 p-2 rounded-xl">
              <p className="text-[9px] text-stone-400 font-medium">
                Pending Seals
              </p>
              <p className="text-xs font-black text-rose-600">
                {permitsCount} Filed
              </p>
            </div>
          </div>
        </div>

        {/* PROCESSING TIMES & MICRO LOG STREAM */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <Timer className="w-4 h-4 text-[#F5C518]" />
                Evaluation Loops
              </h3>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`p-1.5 rounded-lg border transition ${
                  isTimerRunning
                    ? "bg-[#F5C518]/10 text-[#E2B30D]"
                    : "bg-stone-50 text-stone-500"
                }`}
              >
                {isTimerRunning ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-stone-400">
              Total hours spent by AI models summarizing specifications
            </p>
            <div className="flex items-center justify-center py-5">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="#F3F4F6"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="#F5C518"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={326}
                    strokeDashoffset={326 - (326 * (timerCount % 100)) / 100}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="text-center z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center mb-0.5 ${isTimerRunning ? "bg-[#F5C518]" : "bg-stone-200"}`}
                  >
                    <HardHat className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm font-black text-stone-900 block font-mono">
                    {Math.floor(timerCount / 60)}h {timerCount % 60}m
                  </span>
                  <span className="text-[8px] text-stone-400 font-bold uppercase tracking-widest leading-none">
                    Computation Log
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div
            className="bg-[#1a2035] p-3 text-white flex items-center gap-2.5 overflow-hidden"
            style={{ borderRadius: 12 }}
          >
            <svg
              className={`w-3.5 h-3.5 text-[#F5C518] shrink-0 ${isTimerRunning ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <p
              className="text-[10px] font-mono text-stone-300 truncate leading-normal"
              title={timerLog}
            >
              {timerLog}
            </p>
          </div>
        </div>
      </div>

      {/* BENTO GRID ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SITE READINESS METER */}
        <div className="glass-card p-6 flex flex-col justify-between">
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
          <div className="bg-[#F5C518]/10 border border-[#F5C518]/20 p-3.5 rounded-2xl flex items-start gap-2.5 mt-5">
            <AlertTriangle className="w-4 h-4 text-[#E2B30D] shrink-0 mt-0.5" />
            <p className="text-[10px] text-stone-700 leading-normal">
              <strong>Safety Guard Alert</strong>: Local soil density tests
              score is currently pending review. Sub-foundational clearance
              depends on regional permits confirmation.
            </p>
          </div>
        </div>

        {/* AUTONOMOUS AGENTS CHECKS */}
        <div
          className="bg-[#1a2035] text-white p-6 shadow-xl flex flex-col justify-between"
          style={{ borderRadius: 12 }}
        >
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span className="animate-pulse w-2 h-2 rounded-full bg-[#F5C518]"></span>
                  Autonomous Agent Tasks
                </h3>
                <p className="text-[10px] text-stone-400">
                  Loops processed specifically for this site
                </p>
              </div>
              <span className="bg-[#F5C518] text-white font-mono text-[10px] font-black px-2 py-0.5 rounded-md">
                6 / 6 Done
              </span>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                <div className="flex items-center gap-2.5 text-xs">
                  <span>📜</span>
                  <div>
                    <p className="font-bold text-white leading-none">
                      ContractAgent
                    </p>
                    <p className="text-[9px] text-stone-400 mt-1">
                      Parsed delay penalty rules
                    </p>
                  </div>
                </div>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: "#F5C51820",
                    color: "#F5C518",
                    border: "1px solid #F5C51830",
                  }}
                >
                  VERIFIED
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                <div className="flex items-center gap-2.5 text-xs">
                  <span>📐</span>
                  <div>
                    <p className="font-bold text-white leading-none">
                      BlueprintAgent
                    </p>
                    <p className="text-[9px] text-stone-400 mt-1">
                      Reconstructed stair clearance codes
                    </p>
                  </div>
                </div>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: "#F5C51820",
                    color: "#F5C518",
                    border: "1px solid #F5C51830",
                  }}
                >
                  VERIFIED
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                <div className="flex items-center gap-2.5 text-xs">
                  <span>🏛️</span>
                  <div>
                    <p className="font-bold text-white leading-none">
                      PermitAgent
                    </p>
                    <p className="text-[9px] text-stone-400 mt-1">
                      Dispatched zoning reports to city
                    </p>
                  </div>
                </div>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: "#F5C51820",
                    color: "#F5C518",
                    border: "1px solid #F5C51830",
                  }}
                >
                  VERIFIED
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition animate-pulse">
                <div className="flex items-center gap-2.5 text-xs">
                  <span>🗓️</span>
                  <div>
                    <p className="font-bold text-white leading-none">
                      ScheduleAgent
                    </p>
                    <p className="text-[9px] text-stone-400 mt-1">
                      Optimizing freight timing slots
                    </p>
                  </div>
                </div>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: "#0ea5e920",
                    color: "#0ea5e9",
                    border: "1px solid #0ea5e930",
                  }}
                >
                  RUNNING
                </span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-stone-400">
            <span>Site Compute power</span>
            <span className="font-mono text-[#F5C518] font-bold">
              14.2 GFLOPs / s
            </span>
          </div>
        </div>

        {/* DEADLINES FOR THE SPOTLIGHT SITE */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                <span>🚧</span> Site Deadlines
              </h3>
              <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-widest font-mono">
                June 2026
              </span>
            </div>
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200/50 hover:bg-stone-100/50 transition text-xs">
                <div className="bg-[#F5C518] text-white p-1.5 rounded-lg text-sm font-bold shrink-0">
                  🚧
                </div>
                <div>
                  <h4 className="font-bold text-stone-900">
                    Contract Zoning Deadline
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    June 12 · Mandatory signatures
                  </p>
                  <p className="text-[9px] text-[#E2B30D] font-bold mt-1 font-mono">
                    ⚠️ 2 Days remains
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200/50 hover:bg-stone-100/50 transition text-xs">
                <div className="bg-[#F5C518] text-white p-1.5 rounded-lg text-sm font-bold shrink-0">
                  🏗️
                </div>
                <div>
                  <h4 className="font-bold text-stone-900">
                    Concrete Grading Kickoff
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    June 18 · Foundations excavation start
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center pt-3 text-[10px] text-[#E2B30D] font-black hover:text-stone-900 transition cursor-pointer uppercase tracking-wider">
            Review Project Timelines 🡒
          </div>
        </div>
      </div>

      {/* ACCORDION DETAILED SPECIFICATION BLOCKS */}
      <div className="glass-card p-6 relative">
        <h3 className="text-base font-extrabold text-stone-900 tracking-tight mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#F5C518]" />
          Detailed Site Specific Analytics & Agent Audits
        </h3>
        <div className="space-y-3">
          {/* Row 1: Contract Summary */}
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

          {/* Row 2: Blueprint Analysis */}
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

          {/* Row 3: Permits */}
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
                      Registered Code
                    </span>
                    <span className="font-extrabold text-stone-800">
                      A-5240-Z
                    </span>
                  </div>
                  <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-3 text-center text-xs">
                    <span className="text-[9px] text-stone-400 block font-bold uppercase">
                      Estimated Stamp Time
                    </span>
                    <span className="font-extrabold text-[#E2B30D]">
                      5-7 Business Days
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── AI Usage Summary ── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bot className="w-5 h-5 text-[#F5C518]" />
          <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
            AI Usage Summary
          </h3>
          <span className="text-[9px] bg-[#F5C518]/15 text-[#E2B30D] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono ml-1">
            {agentMetrics.length} Agents
          </span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">
              Total AI Calls
            </p>
            <p className="text-2xl font-black text-stone-900 mt-1">1,247</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              ↑ 12% vs last month
            </p>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">
              Avg Response Time
            </p>
            <p className="text-2xl font-black text-stone-900 mt-1">2.4s</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              ↑ 8% faster
            </p>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">
              Tokens Consumed
            </p>
            <p className="text-2xl font-black text-stone-900 mt-1">8.4M</p>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">
              ∼ 2.1M per project
            </p>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">
              Cost Estimate
            </p>
            <p className="text-2xl font-black text-stone-900 mt-1">$42.30</p>
            <p className="text-[10px] text-stone-400 font-semibold mt-0.5">
              API usage this period
            </p>
          </div>
        </div>

        {/* AI tool cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              name: "Gemini 2.0 Pro",
              provider: "Google AI",
              purpose: "Contract analysis, risk assessment, recovery planning",
              model: "gemini-2.0-pro-001",
              calls: 384,
              avgTokens: 8400,
              avgLatency: "2.8s",
              accuracy: 94,
              color: "#4285F4",
            },
            {
              name: "Gemini 2.0 Flash",
              provider: "Google AI",
              purpose: "Permit checks, schedule optimization, crew validation",
              model: "gemini-2.0-flash-001",
              calls: 521,
              avgTokens: 3200,
              avgLatency: "1.2s",
              accuracy: 89,
              color: "#34A853",
            },
            {
              name: "Gemini 2.0 Vision",
              provider: "Google AI",
              purpose:
                "Blueprint drawing analysis, structural conflict detection",
              model: "gemini-2.0-vision-001",
              calls: 186,
              avgTokens: 15600,
              avgLatency: "4.6s",
              accuracy: 92,
              color: "#EA4335",
            },
            {
              name: "Azure Document Intelligence",
              provider: "Microsoft Azure",
              purpose: "Document OCR, form extraction, text digitization",
              model: "prebuilt-layout",
              calls: 156,
              avgTokens: 5200,
              avgLatency: "1.9s",
              accuracy: 96,
              color: "#0078D4",
            },
          ].map((tool) => (
            <div
              key={tool.name}
              className="border border-stone-200 rounded-xl p-5 bg-white hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: tool.color }}
                  >
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      {tool.name}
                    </h4>
                    <p className="text-[10px] text-stone-400">
                      {tool.provider}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-stone-100 text-stone-600 font-mono font-bold px-2 py-0.5 rounded-md">
                  {tool.model}
                </span>
              </div>

              <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                <span className="font-semibold text-stone-700">Purpose:</span>{" "}
                {tool.purpose}
              </p>

              {/* Metrics row */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center p-2 bg-stone-50 rounded-lg border border-stone-100">
                  <p className="text-sm font-black text-stone-900">
                    {tool.calls}
                  </p>
                  <p className="text-[8px] text-stone-400 uppercase tracking-wider mt-0.5">
                    Calls
                  </p>
                </div>
                <div className="text-center p-2 bg-stone-50 rounded-lg border border-stone-100">
                  <p className="text-sm font-black text-stone-900">
                    {(tool.avgTokens / 1000).toFixed(1)}K
                  </p>
                  <p className="text-[8px] text-stone-400 uppercase tracking-wider mt-0.5">
                    Avg Tokens
                  </p>
                </div>
                <div className="text-center p-2 bg-stone-50 rounded-lg border border-stone-100">
                  <p className="text-sm font-black text-stone-900">
                    {tool.avgLatency}
                  </p>
                  <p className="text-[8px] text-stone-400 uppercase tracking-wider mt-0.5">
                    Latency
                  </p>
                </div>
                <div className="text-center p-2 bg-stone-50 rounded-lg border border-stone-100">
                  <p className="text-sm font-black text-emerald-600">
                    {tool.accuracy}%
                  </p>
                  <p className="text-[8px] text-stone-400 uppercase tracking-wider mt-0.5">
                    Accuracy
                  </p>
                </div>
              </div>

              {/* Accuracy bar */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-stone-400 font-medium">Accuracy</span>
                  <span
                    className="font-bold font-mono"
                    style={{ color: tool.color }}
                  >
                    {tool.accuracy}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${tool.accuracy}%`,
                      background: `linear-gradient(90deg, ${tool.color}88, ${tool.color})`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Simple usage bar chart */}
        <div className="mt-6 p-5 bg-stone-50 border border-stone-200 rounded-xl">
          <h4 className="text-xs font-bold text-stone-700 mb-4 flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            API Call Distribution by Service
          </h4>
          <div className="space-y-3">
            {[
              { name: "Gemini 2.0 Flash", calls: 521, color: "#34A853" },
              { name: "Gemini 2.0 Pro", calls: 384, color: "#4285F4" },
              { name: "Gemini 2.0 Vision", calls: 186, color: "#EA4335" },
              {
                name: "Azure Document Intelligence",
                calls: 156,
                color: "#0078D4",
              },
            ]
              .sort((a, b) => b.calls - a.calls)
              .map((item) => {
                const max = 521;
                const pct = (item.calls / max) * 100;
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-stone-600 w-44 shrink-0 truncate">
                      {item.name}
                    </span>
                    <div className="flex-1 bg-stone-200 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center justify-end px-2 transition-all duration-700"
                        style={{ width: `${pct}%`, background: item.color }}
                      >
                        <span className="text-[9px] font-bold text-white drop-shadow-xs">
                          {item.calls}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
