/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FolderOpen,
  ShieldAlert,
  CheckCircle,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  Building2,
  Plane,
  Train,
  Home,
  Trees,
  Milestone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useDashboard } from "../hooks/usePageData";
import { KPICardSkeleton, ErrorState } from "../components/Skeleton";
import { allProjects } from "../data/mockData";
import type { ProjectStatus } from "../data/mockData";

const PAGE_SIZE = 8;

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; border: string; barColor: string }
> = {
  "on-track": {
    label: "ON TRACK",
    color: "#16a34a",
    bg: "rgba(22,163,74,0.08)",
    border: "rgba(22,163,74,0.2)",
    barColor: "#16a34a",
  },
  "at-risk": {
    label: "AT RISK",
    color: "#dc2626",
    bg: "rgba(220,38,38,0.08)",
    border: "rgba(220,38,38,0.2)",
    barColor: "#dc2626",
  },
  delayed: {
    label: "DELAYED",
    color: "#ea580c",
    bg: "rgba(234,88,12,0.08)",
    border: "rgba(234,88,12,0.2)",
    barColor: "#ea580c",
  },
  planning: {
    label: "PLANNING",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.2)",
    barColor: "#2563eb",
  },
};

const projectIcons: Record<
  string,
  React.FC<{ size?: number; style?: React.CSSProperties }>
> = {
  building: Building2,
  plane: Plane,
  train: Train,
  home: Home,
  trees: Trees,
  road: Milestone,
};

const kpiList = [
  {
    key: "activeProjects",
    label: "Active Projects",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.08)",
    Icon: FolderOpen,
  },
  {
    key: "riskProjects",
    label: "At Risk",
    color: "#dc2626",
    bg: "rgba(220,38,38,0.08)",
    Icon: ShieldAlert,
  },
  {
    key: "onTimeProjects",
    label: "On Schedule",
    color: "#16a34a",
    bg: "rgba(22,163,74,0.08)",
    Icon: CheckCircle,
  },
  {
    key: "totalBudget",
    label: "Total Budget",
    color: "#d97706",
    bg: "rgba(217,119,6,0.08)",
    Icon: DollarSign,
  },
  {
    key: "openRisks",
    label: "Open Risks",
    color: "#ea580c",
    bg: "rgba(234,88,12,0.08)",
    Icon: AlertTriangle,
  },
  {
    key: "recoveryPlans",
    label: "Recovery Plans",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
    Icon: RefreshCw,
  },
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8eaed",
        borderRadius: 10,
        padding: "10px 14px",
        minWidth: 140,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <p
        style={{
          fontWeight: 700,
          fontSize: "0.75rem",
          marginBottom: 6,
          color: "#111827",
        }}
      >
        {label}
      </p>
      {payload.map((e: any) => (
        <div
          key={e.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.72rem",
            marginBottom: 3,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: e.color,
            }}
          />
          <span style={{ color: "#6b7280" }}>{e.name}:</span>
          <span style={{ fontWeight: 600, color: "#111827" }}>{e.value}%</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useDashboard();
  const [page, setPage] = useState(1);

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const totalPages = Math.ceil(allProjects.length / PAGE_SIZE);
  const paginatedProjects = allProjects.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* KPI Row */}
      <div className="grid grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <KPICardSkeleton key={i} />)
          : kpiList.map(({ key, label, color, bg, Icon }) => (
              <div key={key} className="kpi-card">
                <div style={{ padding: "14px 16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 26,
                          fontWeight: 700,
                          color,
                          lineHeight: 1,
                          letterSpacing: "-0.5px",
                        }}
                      >
                        {(data?.kpi as any)?.[key] ?? "—"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "#6b7280",
                          marginTop: 6,
                        }}
                      >
                        {label}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} style={{ color }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {!loading && data && (
        <>
          {/* Section header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              All Projects
              <span
                style={{
                  marginLeft: 8,
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  color: "#6b7280",
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                {allProjects.length} total
              </span>
            </div>
            <button
              onClick={() => navigate("/upload")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "8px 16px",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
                boxShadow: "0 2px 6px rgba(22,163,74,0.3)",
              }}
            >
              <Plus size={13} /> New Project
            </button>
          </div>

          {/* Main grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.85fr) 370px",
              gap: 16,
              alignItems: "start",
            }}
          >
            {/* Table + Pagination */}
            <div>
              <div className="glass-card" style={{ overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      minWidth: 760,
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e8eaed" }}>
                        <th
                          style={{
                            position: "sticky",
                            left: 0,
                            zIndex: 20,
                            background: "#f8f9fb",
                            // borderRight: "1px solid #e8eaed",
                            padding: "10px 14px",
                            textAlign: "left",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            color: "#6b7280",
                            textTransform: "uppercase",
                          }}
                        >
                          Project
                        </th>
                        <th
                          style={{
                            background: "#f8f9fb",
                            padding: "10px 14px",
                            textAlign: "left",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            minWidth: 110,
                          }}
                        >
                          Type
                        </th>
                        <th
                          style={{
                            background: "#f8f9fb",
                            padding: "10px 14px",
                            textAlign: "left",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            minWidth: 100,
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            background: "#f8f9fb",
                            padding: "10px 14px",
                            textAlign: "left",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            minWidth: 200,
                          }}
                        >
                          Completion
                        </th>
                        <th
                          style={{
                            background: "#f8f9fb",
                            padding: "10px 14px",
                            textAlign: "center",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            minWidth: 90,
                          }}
                        >
                          Budget
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProjects.map((proj, idx) => {
                        const sc = statusConfig[proj.status];
                        const ProjIcon = projectIcons[proj.icon] ?? Building2;
                        const globalIdx = (page - 1) * PAGE_SIZE + idx + 1;
                        return (
                          <tr
                            key={proj.id}
                            onClick={() => navigate("/intelligence")}
                            className="project-row cursor-pointer"
                            style={{ borderBottom: "1px solid #f3f4f6" }}
                          >
                            <td
                              className="sticky-project-cell"
                              style={{
                                padding: "11px 14px",
                                // background: "#fff",
                                borderRight: "1px solid #d2e0ff",
                              }}
                            >
                              <div className="project-cell">
                                <div
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 6,
                                    background: "#f3f4f6",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    fontSize: "0.6rem",
                                    fontWeight: 700,
                                    color: "#9ca3af",
                                  }}
                                >
                                  {globalIdx}
                                </div>
                                <div
                                  className="project-icon"
                                  style={{
                                    background: sc.bg,
                                    border: `1px solid ${sc.border}`,
                                  }}
                                >
                                  <ProjIcon
                                    size={16}
                                    style={{ color: sc.barColor }}
                                  />
                                </div>
                                <div className="project-info">
                                  <div className="project-name">
                                    {proj.name}
                                  </div>
                                  <div className="project-meta">
                                    <span>{proj.id}</span>
                                    <span className="project-dot" />
                                    <span>{proj.duration}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "11px 14px",
                                fontSize: "0.75rem",
                                color: "#6b7280",
                              }}
                            >
                              {proj.type}
                            </td>
                            <td style={{ padding: "11px 14px" }}>
                              <span
                                className="status-badge"
                                style={{
                                  background: sc.bg,
                                  border: `1px solid ${sc.border}`,
                                  color: sc.color,
                                  fontSize: "0.62rem",
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: 999,
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {sc.label}
                              </span>
                            </td>
                            <td style={{ padding: "11px 14px", minWidth: 200 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.68rem",
                                    color: "#9ca3af",
                                    width: 60,
                                    flexShrink: 0,
                                  }}
                                >
                                  Completion
                                </span>
                                <div
                                  className="progress-bar"
                                  style={{ flex: 1 }}
                                >
                                  <div
                                    className="progress-fill"
                                    style={{
                                      width: `${proj.progress}%`,
                                      background: sc.barColor,
                                    }}
                                  />
                                </div>
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    color: sc.barColor,
                                    minWidth: 30,
                                    textAlign: "right",
                                  }}
                                >
                                  {proj.progress}%
                                </span>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "11px 14px",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.88rem",
                                  fontWeight: 700,
                                  color: "#111827",
                                }}
                              >
                                {proj.budget}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.58rem",
                                  color: "#9ca3af",
                                  textTransform: "uppercase",
                                  marginTop: 2,
                                }}
                              >
                                Budget
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination ── */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 16px",
                    borderTop: "1px solid #e8eaed",
                    background: "#f8f9fb",
                  }}
                >
                  {/* Info */}
                  <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                    Showing{" "}
                    <strong style={{ color: "#111827" }}>
                      {(page - 1) * PAGE_SIZE + 1}–
                      {Math.min(page * PAGE_SIZE, allProjects.length)}
                    </strong>{" "}
                    of{" "}
                    <strong style={{ color: "#111827" }}>
                      {allProjects.length}
                    </strong>{" "}
                    projects
                  </span>

                  {/* Page controls */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    {/* Prev */}
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        border: "1px solid #e2e8f0",
                        background: page === 1 ? "#f8f9fb" : "#fff",
                        color: page === 1 ? "#d1d5db" : "#374151",
                        cursor: page === 1 ? "default" : "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            border:
                              p === page
                                ? "1.5px solid #16a34a"
                                : "1px solid #e2e8f0",
                            background:
                              p === page ? "rgba(22,163,74,0.08)" : "#fff",
                            color: p === page ? "#16a34a" : "#374151",
                            fontWeight: p === page ? 700 : 500,
                            fontSize: "0.76rem",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            fontFamily: "inherit",
                          }}
                        >
                          {p}
                        </button>
                      ),
                    )}

                    {/* Next */}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        border: "1px solid #e2e8f0",
                        background: page === totalPages ? "#f8f9fb" : "#fff",
                        color: page === totalPages ? "#d1d5db" : "#374151",
                        cursor: page === totalPages ? "default" : "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* View all link */}
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      color: "#2563eb",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    View all <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div>
              {/* Health trend */}
              <div className="glass-card p-5" style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      Project health trend
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#6b7280",
                        marginTop: 2,
                      }}
                    >
                      All {data.kpi.activeProjects} projects · 6-month portfolio
                      view
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "rgba(22,163,74,0.08)",
                      border: "1px solid rgba(22,163,74,0.2)",
                      borderRadius: 999,
                      padding: "3px 10px",
                    }}
                  >
                    <div
                      className="animate-pulse"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#16a34a",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.62rem",
                        color: "#16a34a",
                        fontWeight: 700,
                      }}
                    >
                      LIVE
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart
                    data={data.healthTrend}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gHealth" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#16a34a"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#16a34a"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#dc2626"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#dc2626"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(0,0,0,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="health"
                      name="Health score"
                      stroke="#16a34a"
                      strokeWidth={2}
                      fill="url(#gHealth)"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="risk"
                      name="Risk Index"
                      stroke="#dc2626"
                      strokeWidth={1.5}
                      fill="url(#gRisk)"
                      strokeDasharray="5 4"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                  {[
                    { color: "#16a34a", label: "Health score", dashed: false },
                    { color: "#dc2626", label: "Risk Index", dashed: true },
                  ].map(({ color, label, dashed }) => (
                    <div
                      key={label}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 2,
                          borderRadius: 2,
                          background: dashed
                            ? `repeating-linear-gradient(90deg,${color} 0,${color} 4px,transparent 4px,transparent 8px)`
                            : color,
                        }}
                      />
                      <span style={{ fontSize: "0.7rem", color: "#6b7280" }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk distribution */}
              <div className="glass-card p-5">
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Risk distribution
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#6b7280",
                      marginTop: 2,
                    }}
                  >
                    All projects · {data.kpi.openRisks} open risks
                  </div>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 11 }}
                >
                  {data.riskDistribution.map((item) => (
                    <div
                      key={item.name}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: item.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.76rem",
                          color: "#374151",
                          width: 105,
                          flexShrink: 0,
                        }}
                      >
                        {item.name}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 5,
                          background: "#f0f2f5",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${item.value * 2.8}%`,
                            height: "100%",
                            background: item.color,
                            borderRadius: 999,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          color: item.color,
                          width: 32,
                          textAlign: "right",
                        }}
                      >
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
