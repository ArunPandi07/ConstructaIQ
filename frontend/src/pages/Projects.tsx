import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Calendar,
  Building2,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../hooks/usePageData";
import { useLoading } from "../context/LoadingContext";

export default function Projects() {
  const navigate = useNavigate();
  const { projects, loading, error, refreshProjects } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LIVE" | "PENDING">(
    "ALL",
  );

  const { setLoading, hasFullscreenLoader } = useLoading();
  useEffect(() => {
    setLoading("projects", loading, loading ? { type: "fullscreen", message: "Loading projects" } : undefined);
  }, [loading, setLoading]);

  const [pageReady, setPageReady] = useState(false);
  useEffect(() => {
    if (!loading && !hasFullscreenLoader) {
      const timer = setTimeout(() => setPageReady(true), 350);
      return () => clearTimeout(timer);
    } else {
      setPageReady(false);
    }
  }, [loading, hasFullscreenLoader]);

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={pageReady ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="glass-card p-6 space-y-6"
    >
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
      <motion.div
        variants={fadeUpVariants}
        initial="hidden"
        animate={pageReady ? "visible" : "hidden"}
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pb-4 border-b border-stone-200">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-stone-900">
              <Building2 className="w-5 h-5 text-stone-400" />
              Site Onboarding Registries
            </h2>
            <p className="text-xs text-stone-500">
              Track and manage onboarding status across regional divisions
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mt-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search projects by name, city or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-stone-100 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 transition"
            />
          </div>
          <div className="flex text-xs shrink-0 self-start sm:self-auto bg-stone-100 p-1 rounded-xl border border-stone-200">
            {(["ALL", "LIVE", "PENDING"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  statusFilter === f
                    ? "bg-white shadow-xs text-stone-900"
                    : "text-stone-500 hover:text-stone-800"
                }`}
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
      </motion.div>

      {!loading && filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-3xl mb-2">🏜️</p>
          <h3 className="text-sm font-bold text-stone-900">
            No project records found
          </h3>
          <p className="text-xs mt-1 max-w-xs mx-auto text-stone-500">
            Try adjusting your zoning search queries or onboard a brand new plot
            to kickstart.
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={pageReady ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filtered.map((proj) => {
            return (
              <motion.div
                key={proj.id}
                variants={cardVariants}
                onClick={() => navigate(`/projects/${proj.id}`, { state: { from: "projects" } })}
                className="glass-card p-5 hover:border-[#F5C518] hover:shadow-md transition duration-300 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-stone-100">
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
                      <p className="text-xs font-bold mt-1 text-stone-900">
                        {proj.budget}
                      </p>
                    </div>
                  </div>
                  <h3 className="text-sm font-black tracking-tight leading-tight text-stone-900 group-hover:text-[#E2B30D] transition-colors">
                    {proj.name}
                  </h3>
                  <p className="text-xs line-clamp-2 mt-1.5 leading-relaxed text-stone-500">
                    {proj.description}
                  </p>
                </div>
                <div className="pt-4 mt-4 space-y-3 border-t border-stone-100">
                  <div className="flex justify-between items-center text-[11px] text-stone-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      {proj.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Started {proj.createdAt}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-stone-500">
                      <span>Compliance Integration</span>
                      <span className="font-bold font-mono text-stone-900">
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
                  <button className="w-full text-[10px] font-bold py-2 flex items-center justify-center gap-1 uppercase tracking-wider bg-stone-100 rounded-xl text-stone-500 border border-stone-200 cursor-pointer hover:bg-stone-200 transition group-hover:border-[#F5C518]/30">
                    Open Project Workspace{" "}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
