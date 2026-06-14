import { useNavigate } from "react-router-dom";
import {
  Building2,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Plus,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useDashboard, useProjects } from "../hooks/usePageData";

export default function Dashboard() {
  const navigate = useNavigate();
  const { setIsModalOpen } = useAppContext();
  const { projects, loading: projectsLoading, error: projectsError, refreshProjects } =
    useProjects();
  const { data: dashboard, loading: dashLoading, error: dashError, refetch } =
    useDashboard();

  const activeProjects = projects.filter((p) => p.status === "LIVE");
  const distinctLocations = new Set(
    projects.map((p) => p.location).filter((l) => l && l !== "TBD"),
  ).size;

  const getCumulativeBudget = () => {
    if (dashboard?.kpi.totalBudget && dashboard.kpi.totalBudget !== "$0") {
      return dashboard.kpi.totalBudget;
    }
    let total = 0;
    activeProjects.forEach((p) => {
      const num = parseFloat(p.budget.replace(/[^0-9.]/g, ""));
      if (!isNaN(num)) total += num;
    });
    return `$${total.toFixed(1)}M`;
  };

  const getMeanProgress = () => {
    if (dashboard?.meanProgress != null) return dashboard.meanProgress;
    if (activeProjects.length === 0) return 0;
    return Math.round(
      activeProjects.reduce((acc, p) => acc + p.progress, 0) / activeProjects.length,
    );
  };

  const activeCount =
    dashboard?.kpi.activeProjects ?? activeProjects.length;
  const openRisks = dashboard?.kpi.openRisks ?? 0;
  const riskProjects = dashboard?.kpi.riskProjects ?? 0;
  const recoveryPlans = dashboard?.kpi.recoveryPlans ?? 0;
  const riskDistribution = dashboard?.riskDistribution ?? [];

  const recentActivities = dashboard?.recentActivities ?? [];
  const totalTokens = dashboard?.totalTokensRecent ?? 0;

  const isLoading = projectsLoading || dashLoading;
  const loadError = projectsError ?? dashError;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {loadError && (
        <div className="glass-card p-4 border border-red-200 bg-red-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="text-sm text-red-700">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              void refreshProjects();
              void refetch();
            }}
            className="px-3 py-1.5 text-xs font-bold bg-white border border-red-200 rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      <div className="glass-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-112.5 h-112.5 bg-radial from-[#F5C518]/10 via-transparent to-transparent pointer-events-none rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <span className="text-[10px] bg-[#F5C518]/15 text-[#E2B30D] font-black px-3 py-1 rounded-full uppercase tracking-widest font-mono">
              Site Ops Command Console
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-stone-900 tracking-tight mt-3">
              Active Construction Sites
            </h1>
            <p className="text-sm text-stone-500 mt-2 max-w-2xl">
              Unified multi-project intelligence dashboard tracking autonomous
              legal, structural, and logistical zoning agents across active
              design-build locations.
            </p>
          </div>
          <div className="flex items-center gap-6 bg-stone-50 px-6 py-4 rounded-2xl border border-stone-200 self-stretch sm:self-auto shrink-0 justify-around">
            <div className="text-center">
              <p className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider">
                Active Sectors
              </p>
              <p className="text-2xl font-black text-stone-900 flex items-center justify-center gap-1.5 mt-1 font-mono">
                <Building2 className="w-5 h-5 text-[#F5C518]" />
                {isLoading ? "—" : activeCount}
              </p>
            </div>
            <div className="w-px h-10 bg-stone-200"></div>
            <div className="text-center">
              <p className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider">
                Capital Value
              </p>
              <p className="text-2xl font-black text-stone-900 mt-1 font-mono">
                {isLoading ? "—" : getCumulativeBudget()}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs text-stone-500">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            6 Autonomous Coordinator Agents analyzing {activeCount}{" "}
            active construction sites in parallel
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 font-bold flex items-center gap-1.5 transition text-xs shadow-xs"
            style={{
              borderRadius: 9,
              background: "#f5c518",
              color: "#000",
              cursor: "pointer",
            }}
          >
            <Plus className="w-4 h-4" style={{ color: "#000" }} />
            On Board New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center bg-rose-50/80 border border-rose-100">
          <p className="text-[10px] text-rose-600/80 font-bold uppercase">Open Risks</p>
          <p className="text-2xl font-black text-rose-600 mt-1 font-mono">
            {isLoading ? "—" : openRisks}
          </p>
          <p className="text-[9px] text-rose-500/70 mt-1">All open risk items</p>
        </div>
        <div className="glass-card p-4 text-center bg-amber-50/80 border border-amber-100">
          <p className="text-[10px] text-amber-700/80 font-bold uppercase">At-Risk Projects</p>
          <p className="text-2xl font-black text-amber-700 mt-1 font-mono">
            {isLoading ? "—" : riskProjects}
          </p>
          <p className="text-[9px] text-amber-600/70 mt-1">Sites with critical risks</p>
        </div>
        <div className="glass-card p-4 text-center bg-indigo-50/80 border border-indigo-100">
          <p className="text-[10px] text-indigo-600/80 font-bold uppercase">Recovery Plans</p>
          <p className="text-2xl font-black text-indigo-700 mt-1 font-mono">
            {isLoading ? "—" : recoveryPlans}
          </p>
          <p className="text-[9px] text-indigo-500/70 mt-1">Supply-chain mitigations</p>
        </div>
        <div className="glass-card p-4 text-center bg-emerald-50/80 border border-emerald-100">
          <p className="text-[10px] text-emerald-600/80 font-bold uppercase">On-Track Projects</p>
          <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            {isLoading ? "—" : dashboard?.kpi.onTimeProjects ?? 0}
          </p>
          <p className="text-[9px] text-emerald-600/70 mt-1">≥45% phase progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center pl-1">
            <div>
              <h2 className="text-lg font-black text-stone-800 tracking-tight">
                Active Projects ({activeProjects.length})
              </h2>
              <p className="text-xs text-stone-400">
                Click any project to access its full workspace
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading && (
              <div className="glass-card p-10 text-center col-span-full text-stone-400 text-sm">
                Loading projects from API…
              </div>
            )}
            {!isLoading && activeProjects.length === 0 && (
              <div className="glass-card p-10 text-center col-span-full">
                <p className="text-stone-500 text-sm mb-4">
                  No projects yet. Onboard a project to run the 6-agent analyze pipeline.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 font-bold text-xs"
                  style={{ borderRadius: 9, background: "#f5c518", color: "#000" }}
                >
                  On Board New Project
                </button>
              </div>
            )}
            {!isLoading &&
              activeProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() =>
                    navigate(`/projects/${p.id}`, { state: { from: "dashboard" } })
                  }
                  className="glass-card p-5 hover:border-[#F5C518] hover:shadow-md transition duration-300 cursor-pointer flex flex-col justify-between group relative min-h-75"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-radial from-[#F5C518]/5 to-transparent pointer-events-none rounded-bl-3xl"></div>
                  <div>
                    <div className="flex justify-between items-start mb-3.5">
                      <span
                        className="status-badge text-[9px] font-black uppercase"
                        style={{
                          backgroundColor: "#dcfce7",
                          color: "#16a34a",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        ● {p.status}
                      </span>
                      <span className="text-xs font-bold text-stone-800 font-mono bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-md">
                        {p.budget}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-black text-stone-900 tracking-tight group-hover:text-[#E2B30D] transition-colors leading-snug line-clamp-1">
                        {p.name}
                      </h3>
                      <p className="text-[11px] text-stone-400 font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        {p.location}
                      </p>
                      <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-3 pt-1">
                        {p.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-stone-100 space-y-3.5">
                    <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-stone-600">
                      <div className="bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-100">
                        <span className="text-[9px] text-stone-400 block">
                          Integration progress
                        </span>
                        <span className="font-bold text-stone-900 font-mono text-xs">
                          {p.progress}%
                        </span>
                      </div>
                      <div className="bg-stone-50 px-2 py-1.5 rounded-lg border border-stone-100">
                        <span className="text-[9px] text-stone-400 block">
                          Site Readiness
                        </span>
                        <span className="font-bold text-[#E2B30D] font-mono text-xs">
                          {p.progress}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-stone-800 group-hover:text-[#E2B30D] transition-colors pt-1">
                      <span>Open Project Workspace</span>
                      <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="pl-1">
            <h2 className="text-lg font-black text-stone-800 tracking-tight">
              Active Platform Telemetry
            </h2>
            <p className="text-xs text-stone-400">
              Core autonomous monitoring loops status
            </p>
          </div>

          <div
            className="bg-[#1a2035] text-white p-5 shadow-xl space-y-4 border border-stone-700/30 flex flex-col justify-between min-h-95"
            style={{ borderRadius: 12 }}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-100">
                  <span className="w-2 h-2 rounded-full bg-[#F5C518]"></span>
                  Global Log Stream
                </div>
              </div>
              <div className="font-mono text-[10px] leading-relaxed space-y-2.5 text-stone-300">
                <div className="text-emerald-400">
                  ✔️ API CONNECTED: {projects.length} project(s) loaded
                </div>
                <div className="text-[#F5C518]">
                  [SYSTEM ACTIVE]: Monitoring {activeCount} sites
                </div>
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 4).map((a) => (
                    <div
                      key={a.id}
                      className="text-stone-400 bg-white/5 p-2 px-2.5 rounded-lg border border-white/5 leading-normal"
                    >
                      [{a.agent}] {a.action}
                    </div>
                  ))
                ) : (
                  <div className="text-stone-400 bg-white/5 p-2 px-2.5 rounded-lg border border-white/5 leading-normal">
                    No agent executions logged yet.
                  </div>
                )}
                <div className="text-zinc-500">· System state: LOOP_STATE_OK</div>
                {totalTokens > 0 && (
                  <div className="text-zinc-500">
                    · Recent token usage: {totalTokens.toLocaleString()}
                  </div>
                )}
                <div className="text-zinc-500">
                  · Active submittals tracked: {distinctLocations} location
                  {distinctLocations === 1 ? "" : "s"}
                </div>
              </div>
            </div>
            {activeProjects.length > 0 && (
              <div className="bg-[#f0f2f5]/5 border border-white/5 p-3 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-[#F5C518]">
                  <AlertTriangle className="w-4 h-4" />
                  PIPELINE STATUS
                </div>
                <p className="text-[10px] text-stone-400 leading-normal">
                  {activeProjects.length} active project(s). Open a workspace for
                  permits, suppliers, and crew from the latest analyze run.
                </p>
              </div>
            )}
          </div>

          {activeProjects.length > 0 && (
            <div className="glass-card p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 pl-1">
                Portfolio progress
              </h3>
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-semibold text-stone-700">
                    <span>Mean integration progress</span>
                    <span>{getMeanProgress()}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${getMeanProgress()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {riskDistribution.length > 0 && (
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Risk by Category
              </h3>
              {riskDistribution.map((item) => (
                <div key={item.name} className="flex justify-between text-xs">
                  <span className="text-stone-600">{item.name}</span>
                  <span className="font-bold font-mono text-stone-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {(dashboard?.recentRecommendations?.length ?? 0) > 0 && (
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Permit follow-ups
              </h3>
              {dashboard!.recentRecommendations.slice(0, 3).map((r) => (
                <p key={r.id} className="text-[11px] text-stone-600 leading-snug">
                  <strong>{r.project}:</strong> {r.recommendation}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
