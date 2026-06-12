import { useState } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Building2,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../hooks/usePageData";

export default function Projects() {
  const navigate = useNavigate();
  const { projects, loading, error, refreshProjects } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LIVE" | "PENDING">(
    "ALL",
  );

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="glass-card p-6 space-y-6">
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-xl flex justify-between items-center gap-3">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void refreshProjects()}
            className="px-3 py-1.5 text-xs font-bold bg-white border border-red-200 rounded-lg"
          >
            Retry
          </button>
        </div>
      )}
      {loading && (
        <p className="text-sm text-stone-400 text-center py-8">
          Loading projects from API…
        </p>
      )}
      <div
        className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pb-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <h2
            className="text-xl font-bold tracking-tight flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <Building2
              className="w-5 h-5"
              style={{ color: "var(--blue-primary)" }}
            />
            Site Onboarding Registries
          </h2>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Track and manage onboarding status across regional divisions
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-3 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search projects by name, city or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm focus:outline-hidden"
            style={{
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div
          className="flex text-xs shrink-0 self-start sm:self-auto"
          style={{
            background: "var(--bg3)",
            padding: 4,
            borderRadius: 12,
            border: "1px solid var(--border)",
          }}
        >
          {(["ALL", "LIVE", "PENDING"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${statusFilter === f ? "shadow-xs" : "hover:opacity-80"}`}
              style={
                statusFilter === f
                  ? { background: "var(--card)", color: "var(--text-primary)" }
                  : { color: "var(--text-secondary)" }
              }
            >
              {f === "ALL"
                ? "All Division"
                : f === "LIVE"
                  ? "● Live Construction"
                  : "● Under Review"}
            </button>
          ))}
        </div>
      </div>

      {!loading && filtered.length === 0 ? (
        <div
          className="text-center py-16"
          style={{
            background: "var(--bg3)",
            borderRadius: 12,
            border: "1px dashed var(--border)",
          }}
        >
          <p className="text-3xl mb-2">🏜️</p>
          <h3
            className="text-sm font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            No project records found
          </h3>
          <p
            className="text-xs mt-1 max-w-xs mx-auto"
            style={{ color: "var(--text-muted)" }}
          >
            Try adjusting your zoning search queries or onboard a brand new plot
            to kickstart.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((proj) => {
            return (
              <div
                key={proj.id}
                onClick={() => navigate(`/projects/${proj.id}`, { state: { from: "projects" } })}
                className="p-5 hover:shadow-md transition duration-300 cursor-pointer flex flex-col justify-between hover:border-[#F5C518]"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  borderRadius: 12,
                }}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: "var(--bg3)" }}
                    >
                      {proj.leadIcon === "HardHat" ? "🪖" : "📐"}
                    </div>
                    <div className="text-right">
                      <span
                        className="status-badge"
                        style={
                          proj.status === "LIVE"
                            ? {
                                background: "var(--green-bg)",
                                color: "var(--green-primary)",
                              }
                            : {
                                background: "var(--blue-bg)",
                                color: "var(--blue-primary)",
                              }
                        }
                      >
                        {proj.status}
                      </span>
                      <p
                        className="text-xs font-bold mt-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {proj.budget}
                      </p>
                    </div>
                  </div>
                  <h3
                    className="text-sm font-black tracking-tight leading-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {proj.name}
                  </h3>
                  <p
                    className="text-xs line-clamp-2 mt-1.5 leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {proj.description}
                  </p>
                </div>
                <div
                  className="pt-4 mt-4 space-y-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div
                    className="flex justify-between items-center text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span className="flex items-center gap-1">
                      <MapPin
                        className="w-3 h-3"
                        style={{ color: "var(--blue-primary)" }}
                      />
                      {proj.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Started {proj.createdAt}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span style={{ color: "var(--text-muted)" }}>
                        Compliance Integration
                      </span>
                      <span
                        className="font-bold font-mono"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {proj.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-[#F5C518] rounded-full"
                        style={{ width: `${proj.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <button
                    className="w-full text-[10px] font-bold py-2 flex items-center justify-center gap-1 uppercase tracking-wider"
                    style={{
                      background: "var(--bg3)",
                      borderRadius: 12,
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    Open Project Workspace{" "}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
