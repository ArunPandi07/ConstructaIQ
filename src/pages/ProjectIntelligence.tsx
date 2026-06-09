import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  DollarSign,
  Calendar,
  Layers,
  Zap,
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Hash,
  ArrowRight,
} from "lucide-react";
import Badge from "../components/Badge";
import { CardSkeleton, ErrorState, Skeleton } from "../components/Skeleton";
import { useProjectIntelligence } from "../hooks/usePageData";
import { useAppContext } from "../context/AppContext";
import type { PermitStatus, CrewStatus, PhaseStatus } from "../types";

const phaseConfig: Record<
  PhaseStatus,
  { color: string; bg: string; border: string; label: string }
> = {
  completed: {
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    label: "Completed",
  },
  "in-progress": {
    color: "var(--green-primary)",
    bg: "var(--green-bg)",
    border: "var(--green-border)",
    label: "In Progress",
  },
  pending: {
    color: "var(--text-muted)",
    bg: "var(--bg3)",
    border: "var(--border)",
    label: "Pending",
  },
};
const permitBadge: Record<PermitStatus, "green" | "yellow" | "blue" | "gray"> =
  {
    Approved: "green",
    Pending: "yellow",
    "In Review": "blue",
    "Not Started": "gray",
  };
const crewBadge: Record<CrewStatus, "green" | "yellow" | "orange"> = {
  Assigned: "green",
  Partial: "yellow",
  Recruiting: "orange",
};

export default function ProjectIntelligence() {
  const navigate = useNavigate();
  const { activeProjectId, uploadJustCompleted } = useAppContext();
  const { data, loading, error, refetch } =
    useProjectIntelligence(activeProjectId);
  const [expandedPermit, setExpandedPermit] = useState<number | null>(null);

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Project Intelligence
          </h2>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            AI-extracted project insights and intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <Skeleton style={{ width: 90, height: 24 }} rounded="full" />
          ) : (
            <>
              <Badge variant="blue" dot pulse>
                AI Analyzed
              </Badge>
              <Badge variant="green">96% Confidence</Badge>
            </>
          )}
        </div>
      </div>

      {/* Upload-complete banner */}
      {uploadJustCompleted && (
        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: "var(--green-bg)", border: "1px solid var(--green-border)" }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} style={{ color: "#16a34a" }} />
            <span
              className="text-sm font-semibold"
              style={{ color: "#16a34a" }}
            >
              Upload complete — intelligence extracted from your project
              documents
            </span>
          </div>
          <button
            onClick={() => navigate("/risk")}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: "var(--green-primary)" }}
          >
            View Risks <ArrowRight size={11} />
          </button>
        </div>
      )}

      {/* Overview card */}
      {loading ? (
        <CardSkeleton lines={5} />
      ) : (
        data && (
          <div className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: "var(--green-bg)",
                  border: "1px solid var(--green-border)",
                }}
              >
                <Building2
                  size={26}
                  style={{ color: "var(--green-primary)" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className="text-base font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {data.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Hash size={11} />
                        {data.projectId}
                      </span>
                      <span
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <MapPin size={11} />
                        {data.location}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="orange">High Complexity</Badge>
                    <Badge variant="blue">{data.type}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {[
                    {
                      icon: DollarSign,
                      label: "Budget",
                      value: data.budget,
                      color: "#d97706",
                    },
                    {
                      icon: Calendar,
                      label: "Duration",
                      value: data.duration,
                      color: "var(--green-primary)",
                    },
                    {
                      icon: Layers,
                      label: "Floors",
                      value: String(data.floors),
                      color: "#7c3aed",
                    },
                    {
                      icon: Zap,
                      label: "Sq Footage",
                      value: data.squareFootage,
                      color: "#16a34a",
                    },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div
                      key={label}
                      className="p-3 rounded-xl"
                      style={{
                        background: "var(--bg3)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={12} style={{ color }} />
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {label}
                        </span>
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Permits */}
        {loading ? (
          <CardSkeleton lines={5} />
        ) : (
          data && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={15} style={{ color: "var(--green-primary)" }} />
                <h3
                  className="text-sm font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Required Permits
                </h3>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "var(--green-bg)",
                    color: "var(--green-primary)",
                    border: "1px solid var(--green-border)",
                  }}
                >
                  {
                    data.requiredPermits.filter((p) => p.status === "Approved")
                      .length
                  }
                  /{data.requiredPermits.length} Approved
                </span>
              </div>
              <div className="space-y-2">
                {data.requiredPermits.map((permit, i) => {
                  const expanded = expandedPermit === i;
                  return (
                    <div
                      key={i}
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: "var(--bg3)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => setExpandedPermit(expanded ? null : i)}
                      >
                        <div className="flex items-center gap-3">
                          {permit.status === "Approved" ? (
                            <CheckCircle
                              size={13}
                              style={{ color: "#16a34a" }}
                            />
                          ) : permit.status === "In Review" ? (
                            <Clock
                              size={13}
                              style={{ color: "var(--green-primary)" }}
                            />
                          ) : (
                            <AlertCircle
                              size={13}
                              style={{ color: "#ea580c" }}
                            />
                          )}
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {permit.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={permitBadge[permit.status]}>
                            {permit.status}
                          </Badge>
                          {expanded ? (
                            <ChevronUp
                              size={12}
                              style={{ color: "var(--text-muted)" }}
                            />
                          ) : (
                            <ChevronDown
                              size={12}
                              style={{ color: "var(--text-muted)" }}
                            />
                          )}
                        </div>
                      </div>
                      {expanded && (
                        <div className="px-3 pb-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background: "var(--card)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <p
                              className="text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Expected Date
                            </p>
                            <p
                              className="text-xs font-semibold mt-0.5"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {permit.date}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* Crew */}
        {loading ? (
          <CardSkeleton lines={6} />
        ) : (
          data && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={15} style={{ color: "#7c3aed" }} />
                <h3
                  className="text-sm font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Crew Requirements
                </h3>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "#f5f3ff",
                    color: "#7c3aed",
                    border: "1px solid #ddd6fe",
                  }}
                >
                  {data.crewRequirements.reduce((s, c) => s + c.count, 0)} Total
                </span>
              </div>
              <div className="space-y-2">
                {data.crewRequirements.map((crew, i) => {
                  const fillPct =
                    crew.status === "Assigned"
                      ? 100
                      : crew.status === "Partial"
                        ? 50
                        : 20;
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl"
                      style={{
                        background: "var(--bg3)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {crew.role}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-bold"
                            style={{ color: "#7c3aed" }}
                          >
                            {crew.count}
                          </span>
                          <Badge variant={crewBadge[crew.status]} size="sm">
                            {crew.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${fillPct}%`,
                            background:
                              crew.status === "Assigned"
                                ? "linear-gradient(90deg,#16a34a,#22c55e)"
                                : crew.status === "Partial"
                                  ? "linear-gradient(90deg,#d97706,#f59e0b)"
                                  : "linear-gradient(90deg,#dc2626,#ef4444)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <CardSkeleton lines={6} />
      ) : (
        data && (
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Calendar size={15} style={{ color: "var(--green-primary)" }} />
              <h3
                className="text-sm font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Project Timeline
              </h3>
              <span
                className="ml-auto text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {data.startDate} → {data.endDate}
              </span>
            </div>
            <div className="space-y-5">
              {data.phases.map((phase, i) => {
                const cfg = phaseConfig[phase.status];
                return (
                  <div key={i} className="timeline-item">
                    <div className="flex items-start gap-3">
                      <div
                        className="absolute left-0 top-3 flex items-center justify-center"
                        style={{ width: 18, height: 18 }}
                      >
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center"
                          style={{
                            background: cfg.bg,
                            border: `2px solid ${cfg.color}`,
                          }}
                        >
                          {phase.status !== "pending" && (
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${phase.status === "in-progress" ? "animate-pulse" : ""}`}
                              style={{ background: cfg.color }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {phase.name}
                            </span>
                            <Badge
                              variant={
                                phase.status === "completed"
                                  ? "green"
                                  : phase.status === "in-progress"
                                    ? "blue"
                                    : "gray"
                              }
                              size="sm"
                            >
                              {cfg.label}
                            </Badge>
                          </div>
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {phase.startDate} → {phase.endDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="progress-bar flex-1">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${phase.progress}%`,
                                background:
                                  phase.status === "completed"
                                    ? "linear-gradient(90deg,#16a34a,#22c55e)"
                                    : phase.status === "in-progress"
                                      ? "linear-gradient(90deg,var(--green-primary),#3b82f6)"
                                      : "var(--border)",
                              }}
                            />
                          </div>
                          <span
                            className="text-xs font-bold shrink-0"
                            style={{ color: cfg.color }}
                          >
                            {phase.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* CTA */}
            <div
              className="flex gap-2 mt-4 pt-4 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                onClick={() => navigate("/risk")}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                style={{
                  background: "linear-gradient(135deg,#dc2626,#ef4444)",
                }}
              >
                View Risk Analysis
              </button>
              <button
                onClick={() => navigate("/recovery")}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: "var(--green-primary)" }}
              >
                View Recovery Plans
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
