/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Bot,
  Brain,
  TrendingUp,
  Clock,
  Activity,
  Cpu,
  ChevronRight,
  X,
  FileText,
  Layers,
  ClipboardCheck,
  ShieldAlert,
  RefreshCw,
  Globe,
  // Sparkles,
  History,
  // CheckCircle2,
  // AlertTriangle,
  Info,
  Building2,
} from "lucide-react";
import Badge from "../components/Badge";

const iconMap: Record<string, any> = {
  "file-text": FileText,
  layers: Layers,
  "clipboard-check": ClipboardCheck,
  "shield-alert": ShieldAlert,
  "refresh-cw": RefreshCw,
};

const statusCfg = {
  completed: {
    label: "Completed",
    variant: "green" as const,
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  running: {
    label: "Running",
    variant: "blue" as const,
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  warning: {
    label: "Warning",
    variant: "orange" as const,
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fed7aa",
  },
  error: {
    label: "Error",
    variant: "red" as const,
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
  },
};

interface AgentHistoryEntry {
  projectName: string;
  projectId: string;
  timestamp: string;
  action: string;
  result: string;
  insight: string;
  activityLog: string;
}

interface AgentData {
  id: string;
  name: string;
  icon: string;
  model: string;
  status: "completed" | "running" | "warning" | "error";
  confidence: number;
  processingTime: string;
  projectsAssigned: string[];
  totalTasksExecuted: number;
  metrics: Record<string, string | number>;
  latestFindings: string[];
  keyHighlights: string[];
  importantInsights: string[];
  history: AgentHistoryEntry[];
}

const agentsData: AgentData[] = [
  {
    id: "contract-agent",
    name: "Contract Agent",
    icon: "file-text",
    model: "Gemini 2.0 Pro",
    status: "completed",
    confidence: 96,
    processingTime: "2m 14s",
    projectsAssigned: [
      "Tower A - Downtown Core",
      "Riverside Residential Complex",
      "Bay Bridge Retrofit",
    ],
    totalTasksExecuted: 847,
    metrics: { docsProcessed: 3, clausesExtracted: 47, issuesFound: 4 },
    latestFindings: [
      "Extracted 47 key contract clauses",
      "Identified 3 penalty clauses worth $4.2M",
      "Flagged ambiguous force majeure language",
      "Detected 6 milestone payment triggers",
    ],
    keyHighlights: [
      "Highest accuracy among all agents at 96%",
      "Processed over 800 contracts across projects",
      "Zero false positives in last 50 analyses",
    ],
    importantInsights: [
      "Force majeure clauses in 3 contracts need revision",
      "Penalty clause inconsistency detected across Tower A and Bay Bridge",
      "Payment milestone alignment recommended for project cashflow optimization",
    ],
    history: [
      {
        projectName: "Tower A - Downtown Core",
        projectId: "tower-a",
        timestamp: "2026-06-12 09:00",
        action: "Contract Ingestion",
        result: "Success - 47 clauses extracted",
        insight: "3 penalty clauses worth $4.2M identified",
        activityLog:
          "09:00:12 - Started document ingestion\n09:01:44 - Extracted clauses with 96% confidence\n09:02:14 - Analysis completed",
      },
      {
        projectName: "Riverside Residential Complex",
        projectId: "riverside",
        timestamp: "2026-06-11 14:30",
        action: "Contract Review",
        result: "Success - 32 clauses extracted",
        insight: "Ambiguous liability cap detected",
        activityLog:
          "14:30:00 - Started contract review\n14:31:22 - Extracted 32 clauses\n14:32:15 - Flagged liability cap ambiguity",
      },
      {
        projectName: "Bay Bridge Retrofit",
        projectId: "bay-bridge",
        timestamp: "2026-06-10 11:15",
        action: "Amendment Analysis",
        result: "Success - 18 amendments reviewed",
        insight: "2 amendments conflict with master agreement",
        activityLog:
          "11:15:00 - Started amendment analysis\n11:16:30 - Reviewed 18 amendments\n11:18:00 - Found 2 conflicting amendments",
      },
      {
        projectName: "Tower A - Downtown Core",
        projectId: "tower-a",
        timestamp: "2026-06-09 16:45",
        action: "Compliance Check",
        result: "Warning - 3 clauses non-compliant",
        insight: "Insurance requirements below minimum thresholds",
        activityLog:
          "16:45:00 - Started compliance check\n16:46:30 - Found 3 non-compliant clauses\n16:48:00 - Compliance report generated",
      },
    ],
  },
  {
    id: "blueprint-agent",
    name: "Blueprint Agent",
    icon: "layers",
    model: "Gemini 2.0 Vision",
    status: "completed",
    confidence: 93,
    processingTime: "4m 38s",
    projectsAssigned: [
      "Tower A - Downtown Core",
      "Metro Station Phase 2",
      "Civic Center Renovation",
    ],
    totalTasksExecuted: 623,
    metrics: {
      drawingsAnalyzed: 186,
      conflictsFound: 2,
      suggestionsGenerated: 8,
    },
    latestFindings: [
      "Analyzed 186 architectural drawings",
      "Detected 2 structural conflicts on Floor 18",
      "Identified MEP routing inefficiency saving $340K",
      "Confirmed building envelope specifications",
    ],
    keyHighlights: [
      "Vision-based analysis with 93% accuracy",
      "Saved $340K through MEP routing optimization",
      "Processed 186 drawings in under 5 minutes",
    ],
    importantInsights: [
      "Structural conflict on Floor 18 requires immediate engineering review",
      "MEP routing optimization opportunity in basement levels",
      "Building envelope meets all specified thermal requirements",
    ],
    history: [
      {
        projectName: "Tower A - Downtown Core",
        projectId: "tower-a",
        timestamp: "2026-06-12 09:01",
        action: "Drawing Analysis",
        result: "Success - 186 drawings analyzed",
        insight: "2 structural conflicts on Floor 18",
        activityLog:
          "09:01:45 - Initiated visual analysis\n09:04:15 - Structural conflict found on Floor 18\n09:06:23 - Analysis complete",
      },
      {
        projectName: "Metro Station Phase 2",
        projectId: "metro-station",
        timestamp: "2026-06-11 10:30",
        action: "Blueprint Review",
        result: "Success - 94 drawings analyzed",
        insight: "MEP routing can be optimized in mezzanine",
        activityLog:
          "10:30:00 - Started blueprint review\n10:33:15 - Found MEP routing opportunity\n10:35:00 - Review completed",
      },
      {
        projectName: "Civic Center Renovation",
        projectId: "civic-center",
        timestamp: "2026-06-10 08:00",
        action: "Structural Analysis",
        result: "Success - All clearances verified",
        insight: "Load-bearing walls meet seismic requirements",
        activityLog:
          "08:00:00 - Started structural analysis\n08:03:30 - Verified all clearances\n08:05:00 - Analysis complete",
      },
    ],
  },
  {
    id: "permit-agent",
    name: "Permit Agent",
    icon: "clipboard-check",
    model: "Gemini 2.0 Flash",
    status: "warning",
    confidence: 88,
    processingTime: "1m 52s",
    projectsAssigned: [
      "Tower A - Downtown Core",
      "Harbor Bridge Phase 2",
      "Westline Rail Corridor",
    ],
    totalTasksExecuted: 412,
    metrics: { permitsChecked: 12, missingPermits: 2, criticalFlags: 3 },
    latestFindings: [
      "Environmental permit flagged as critical path",
      "Found 2 missing permit applications",
      "Permit timeline exceeds project schedule by 3 weeks",
      "Recommended fast-track process available",
    ],
    keyHighlights: [
      "Timely identification of critical path permits",
      "Prevented 3 potential regulatory shutdowns",
      "Fast-track recommendations saved 2 weeks on average",
    ],
    importantInsights: [
      "Environmental permit delay affects 3 project start dates",
      "Two permit applications missing for Harbor Bridge Phase 2",
      "Recommended fast-track processing available for Tower A permits",
    ],
    history: [
      {
        projectName: "Tower A - Downtown Core",
        projectId: "tower-a",
        timestamp: "2026-06-12 09:03",
        action: "Permit Cross-Reference",
        result: "Warning - 2 missing permits",
        insight: "Environmental and fire safety permits missing",
        activityLog:
          "09:03:30 - Cross-referenced permit requirements\n09:04:15 - ALERT: 2 missing permits detected\n09:05:00 - Report generated",
      },
      {
        projectName: "Harbor Bridge Phase 2",
        projectId: "harbor-bridge",
        timestamp: "2026-06-11 13:00",
        action: "Permit Audit",
        result: "Critical - 3 flags raised",
        insight: "Coastal construction permits not filed",
        activityLog:
          "13:00:00 - Started permit audit\n13:01:30 - Found 3 critical issues\n13:03:00 - Audit completed",
      },
      {
        projectName: "Westline Rail Corridor",
        projectId: "westline-rail",
        timestamp: "2026-06-10 15:30",
        action: "Permit Status Check",
        result: "Success - All permits in order",
        insight: "Rail corridor permits approved through 2027",
        activityLog:
          "15:30:00 - Started permit check\n15:31:45 - All permits verified\n15:32:30 - Check complete",
      },
    ],
  },
  {
    id: "schedule-agent",
    name: "Schedule Agent",
    icon: "clock",
    model: "Gemini 2.0 Flash",
    status: "completed",
    confidence: 91,
    processingTime: "1m 45s",
    projectsAssigned: [
      "Metro Station Phase 2",
      "Central Park Plaza",
      "Tech Campus Phase 3",
    ],
    totalTasksExecuted: 534,
    metrics: {
      schedulesOptimized: 12,
      criticalPathsResolved: 8,
      timeSavedWeeks: 14,
    },
    latestFindings: [
      "Critical path optimized for Metro Station Phase 2",
      "Resource leveling reduced conflict by 34%",
      "Identified 2-week compression opportunity",
    ],
    keyHighlights: [
      "14 weeks of cumulative schedule compression",
      "34% reduction in resource conflicts",
      "91% confidence in schedule recommendations",
    ],
    importantInsights: [
      "Resource sharing across Metro Station and Central Park causes conflict",
      "Weekend shifts could recover 2 weeks on critical path",
      "Material delivery sequencing needs optimization",
    ],
    history: [
      {
        projectName: "Metro Station Phase 2",
        projectId: "metro-station",
        timestamp: "2026-06-12 08:00",
        action: "Schedule Optimization",
        result: "Critical path compressed by 2 weeks",
        insight: "Resource sharing conflict with Central Park",
        activityLog:
          "08:00:00 - Started optimization\n08:01:30 - Found sharing conflict\n08:03:00 - Optimization complete",
      },
      {
        projectName: "Central Park Plaza",
        projectId: "central-park",
        timestamp: "2026-06-11 15:00",
        action: "Timeline Review",
        result: "3-week compression identified",
        insight: "Weekend shifts would recover delays",
        activityLog:
          "15:00:00 - Started timeline review\n15:02:00 - Found compression opportunity\n15:03:30 - Review complete",
      },
    ],
  },
  {
    id: "supplier-agent",
    name: "Supplier Agent",
    icon: "refresh-cw",
    model: "Gemini 2.0 Flash",
    status: "completed",
    confidence: 89,
    processingTime: "2m 08s",
    projectsAssigned: [
      "Tower A - Downtown Core",
      "Riverside Residential Complex",
      "Tech Campus Phase 3",
    ],
    totalTasksExecuted: 478,
    metrics: {
      suppliersAnalyzed: 56,
      leadTimeWarnings: 8,
      costSavingsFound: 3,
    },
    latestFindings: [
      "Analyzed 56 suppliers across 3 projects",
      "Identified 8 critical lead-time risks",
      "Found $420K in potential cost savings through bulk procurement",
      "Recommended alternative supplier for steel beams saving 14 days",
    ],
    keyHighlights: [
      "56 supplier profiles analyzed for reliability and cost",
      "$420K in cost-saving opportunities identified",
      "8 lead-time risks flagged and mitigated",
    ],
    importantInsights: [
      "Steel beam supplier lead time threatens Tower A schedule by 3 weeks",
      "Bulk procurement across Riverside and Tech Campus could save $420K",
      "Alternative concrete supplier offers 14-day faster delivery for Tower A",
    ],
    history: [
      {
        projectName: "Tower A - Downtown Core",
        projectId: "tower-a",
        timestamp: "2026-06-12 08:30",
        action: "Supplier Analysis",
        result: "Success - 22 suppliers analyzed",
        insight: "Steel beam lead time risk identified",
        activityLog:
          "08:30:00 - Started supplier analysis\n08:31:45 - Analyzed 22 suppliers\n08:33:15 - Found lead time risk\n08:34:00 - Analysis complete",
      },
      {
        projectName: "Riverside Residential Complex",
        projectId: "riverside",
        timestamp: "2026-06-11 11:00",
        action: "Cost Optimization",
        result: "Success - $180K savings identified",
        insight: "Bulk concrete order reduces cost by 12%",
        activityLog:
          "11:00:00 - Started cost optimization\n11:02:00 - Found bulk pricing opportunity\n11:04:00 - Optimization complete",
      },
      {
        projectName: "Tech Campus Phase 3",
        projectId: "tech-campus",
        timestamp: "2026-06-10 09:45",
        action: "Lead Time Audit",
        result: "Warning - 3 suppliers at risk",
        insight: "Electrical component supplier behind schedule",
        activityLog:
          "09:45:00 - Started lead time audit\n09:46:30 - Found 3 at-risk suppliers\n09:48:00 - Audit complete",
      },
    ],
  },
  {
    id: "crew-agent",
    name: "Crew Agent",
    icon: "users",
    model: "Gemini 2.0 Flash",
    status: "completed",
    confidence: 87,
    processingTime: "1m 20s",
    projectsAssigned: [
      "Tower A - Downtown Core",
      "Northgate Office Tower",
      "Greenhill Villas Estate",
    ],
    totalTasksExecuted: 312,
    metrics: {
      crewAssigned: 124,
      certificationsVerified: 89,
      gapsIdentified: 12,
    },
    latestFindings: [
      "Crew assignment optimized for Tower A steel work",
      "12 skill gaps identified across projects",
      "OSHA certification compliance at 96%",
    ],
    keyHighlights: [
      "Optimized crew allocation across 3 projects",
      "96% OSHA certification compliance rate",
      "Identified critical skill gaps proactively",
    ],
    importantInsights: [
      "Steel workers shortage affects 3 concurrent projects",
      "Cross-training program could fill 8 of 12 skill gaps",
      "Evening shift staffing needs review for Tower A",
    ],
    history: [
      {
        projectName: "Tower A - Downtown Core",
        projectId: "tower-a",
        timestamp: "2026-06-12 07:30",
        action: "Crew Assignment",
        result: "Optimized - 45 steel workers assigned",
        insight: "Evening shift understaffed by 8 workers",
        activityLog:
          "07:30:00 - Started crew assignment\n07:31:15 - Assigned 45 steel workers\n07:32:30 - Found shift gap",
      },
      {
        projectName: "Northgate Office Tower",
        projectId: "northgate-tower",
        timestamp: "2026-06-10 13:00",
        action: "Skills Audit",
        result: "4 gaps identified",
        insight: "Electrical skills gap requires hiring",
        activityLog:
          "13:00:00 - Started skills audit\n13:01:30 - Found 4 gaps\n13:03:00 - Audit complete",
      },
    ],
  },
];

const systemKpis = [
  { label: "Total Agent Runs", value: "4,642", icon: Cpu, color: "#16a34a" },
  {
    label: "Avg Confidence",
    value: "90.3%",
    icon: TrendingUp,
    color: "#16a34a",
  },
  { label: "Total Findings", value: "1,284", icon: Brain, color: "#7c3aed" },
  { label: "Processing Time", value: "24m 47s", icon: Clock, color: "#d97706" },
  { label: "Active Projects", value: "12", icon: Globe, color: "#2563eb" },
  { label: "Active Agents", value: "6", icon: Bot, color: "#F5C518" },
];

export default function AIInsights() {
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-stone-900">AI Insights</h2>
          <p className="text-sm mt-0.5 text-stone-500">
            Centralized overview of all AI agents and their activities across
            every project
          </p>
        </div>
        <Badge variant="blue" dot pulse>
          6 Agents Active
        </Badge>
      </div>

      {/* System KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {systemKpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} style={{ color }} />
              <span className="text-xs text-stone-400">{label}</span>
            </div>
            <div className="text-xl font-bold text-stone-900">{value}</div>
          </div>
        ))}
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agentsData.map((agent) => {
          const AgentIcon = iconMap[agent.icon] || Bot;
          const cfg = statusCfg[agent.status];
          return (
            <div key={agent.id} className="agent-card flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                    }}
                  >
                    <AgentIcon size={18} style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">
                      {agent.name}
                    </h3>
                    <div
                      className="text-xs text-stone-400"
                      style={{ fontSize: "0.62rem" }}
                    >
                      {agent.model}
                    </div>
                  </div>
                </div>
                <Badge
                  variant={cfg.variant}
                  dot={agent.status === "running"}
                  pulse={agent.status === "running"}
                >
                  {cfg.label}
                </Badge>
              </div>

              {/* Confidence */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-stone-400">
                    Confidence Score
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: cfg.color }}
                  >
                    {agent.confidence}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${agent.confidence}%`,
                      background:
                        agent.status === "warning"
                          ? "linear-gradient(90deg,#d97706,#f59e0b)"
                          : `linear-gradient(90deg,${cfg.color}88,${cfg.color})`,
                    }}
                  />
                </div>
              </div>

              {/* Projects & Tasks */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-stone-50 border border-stone-200">
                  <div className="text-sm font-bold text-stone-900">
                    {agent.projectsAssigned.length}
                  </div>
                  <div className="text-[9px] text-stone-400 uppercase">
                    Projects
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-stone-50 border border-stone-200">
                  <div className="text-sm font-bold text-stone-900">
                    {agent.totalTasksExecuted}
                  </div>
                  <div className="text-[9px] text-stone-400 uppercase">
                    Tasks Executed
                  </div>
                </div>
              </div>

              {/* Projects */}
              <div className="mb-3 px-3 py-2 rounded-lg bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Globe size={10} className="text-stone-400" />
                  <span className="text-[10px] font-semibold text-stone-500">
                    Projects Assigned
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {agent.projectsAssigned.map((p) => (
                    <span
                      key={p}
                      className="text-[9px] bg-white px-2 py-0.5 rounded-md border border-stone-200 text-stone-600 font-medium"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {Object.entries(agent.metrics).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2 rounded-lg text-center bg-stone-50 border border-stone-200"
                  >
                    <div className="text-sm font-bold text-stone-900">
                      {val}
                    </div>
                    <div
                      style={{
                        fontSize: "0.55rem",
                        color: "#a8a29e",
                        textTransform: "capitalize",
                      }}
                    >
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Latest Findings */}
              <div className="mb-3 flex-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity size={11} className="text-stone-400" />
                  <span className="text-xs font-semibold text-stone-500">
                    Latest Findings
                  </span>
                </div>
                <div className="space-y-1">
                  {agent.latestFindings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight
                        size={9}
                        style={{
                          color: cfg.color,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                      <span
                        className="text-xs text-stone-600 leading-relaxed"
                        style={{ fontSize: "0.7rem" }}
                      >
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Highlights */}
              {/* <div className="mb-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={11} className="text-emerald-600" />
                  <span className="text-[10px] font-bold text-emerald-700">Key Highlights</span>
                </div>
                {agent.keyHighlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-emerald-800 mb-0.5">
                    <CheckCircle2 size={9} className="text-emerald-500 shrink-0 mt-0.5" />
                    {h}
                  </div>
                ))}
              </div> */}

              {/* Important Insights */}
              {/* <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle size={11} className="text-amber-600" />
                  <span className="text-[10px] font-bold text-amber-700">
                    Important Insights
                  </span>
                </div>
                {agent.importantInsights.map((ins, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-1.5 text-[10px] text-amber-800 mb-0.5"
                  >
                    <Info size={9} className="text-amber-500 shrink-0 mt-0.5" />
                    {ins}
                  </div>
                ))}
              </div> */}

              {/* View Full History Button */}
              <button
                onClick={() => setSelectedAgent(agent)}
                style={{ cursor: "pointer" }}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-stone-200 transition"
              >
                <History className="w-3.5 h-3.5" />
                View Full History
              </button>
            </div>
          );
        })}
      </div>

      {/* Agent History Modal */}
      {selectedAgent &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedAgent(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-stone-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5C518]/15 text-[#E2B30D] flex items-center justify-center">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-stone-900">
                      {selectedAgent.name}
                    </h2>
                    <p className="text-xs text-stone-400">
                      Complete Activity History
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-2 hover:bg-stone-100 rounded-xl transition"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              {/* Modal Body - Grouped by project */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Agent Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                    <p className="text-[9px] text-stone-400 font-bold uppercase">
                      Total Tasks
                    </p>
                    <p className="text-lg font-black text-stone-900">
                      {selectedAgent.totalTasksExecuted}
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                    <p className="text-[9px] text-stone-400 font-bold uppercase">
                      Projects
                    </p>
                    <p className="text-lg font-black text-stone-900">
                      {selectedAgent.projectsAssigned.length}
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                    <p className="text-[9px] text-stone-400 font-bold uppercase">
                      Confidence
                    </p>
                    <p className="text-lg font-black text-emerald-600">
                      {selectedAgent.confidence}%
                    </p>
                  </div>
                </div>

                {/* History grouped by project */}
                {(() => {
                  const grouped = selectedAgent.history.reduce<
                    Record<string, AgentHistoryEntry[]>
                  >((acc, entry) => {
                    if (!acc[entry.projectName]) acc[entry.projectName] = [];
                    acc[entry.projectName].push(entry);
                    return acc;
                  }, {});
                  return Object.entries(grouped).map(([projectName, entries]) => (
                    <div
                      key={projectName}
                      className="border border-stone-200 rounded-xl overflow-hidden"
                    >
                      <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-stone-400" />
                        <div>
                          <span className="text-xs font-bold text-stone-800">
                            {projectName}
                          </span>
                          <span className="text-[9px] text-stone-400 ml-2">
                            ({entries.length} activities)
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-stone-100">
                        {entries.map((entry, i) => (
                          <div key={i} className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="blue" size="sm">
                                  {entry.action}
                                </Badge>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  {entry.timestamp}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  entry.result.startsWith("Success")
                                    ? "bg-emerald-50 text-emerald-700"
                                    : entry.result.startsWith("Warning")
                                      ? "bg-amber-50 text-amber-700"
                                      : entry.result.startsWith("Critical")
                                        ? "bg-rose-50 text-rose-700"
                                        : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {entry.result}
                              </span>
                            </div>
                            <div className="bg-stone-50 rounded-lg p-3 border border-stone-100">
                              <p className="text-[10px] font-bold text-stone-500 mb-1 flex items-center gap-1">
                                <Info size={10} /> Generated Insight
                              </p>
                              <p className="text-xs text-stone-700">
                                {entry.insight}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-stone-400 mb-1">
                                Activity Log
                              </p>
                              <pre className="text-[9px] font-mono text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-100 whitespace-pre-wrap">
                                {entry.activityLog}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
