import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Upload, Brain, ShieldAlert,
  RefreshCw, GitBranch, Bot, Settings, Activity,
} from "lucide-react";

const navItems = [
  { path: "/dashboard",    label: "Dashboard",            icon: LayoutDashboard },
  { path: "/upload",       label: "Project Upload",        icon: Upload },
  { path: "/intelligence", label: "Project Intelligence",  icon: Brain },
  { path: "/risk",         label: "Risk Intelligence",     icon: ShieldAlert },
  { path: "/recovery",     label: "Recovery Center",       icon: RefreshCw },
  { path: "/change-impact",label: "Change Impact",         icon: GitBranch },
  { path: "/agents",       label: "Agent Insights",        icon: Bot },
];

export default function Layout() {
  const location = useLocation();
  const currentPage = navItems.find((i) => i.path === location.pathname);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Sidebar ── */}
      <aside className="flex flex-col shrink-0" style={{ width: 220, background: "var(--sidebar-bg)" }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 34, height: 34, background: "#2563eb" }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="9" width="3" height="6" rx="1" fill="#fff" />
              <rect x="6.5" y="5" width="3" height="10" rx="1" fill="#fff" />
              <rect x="12" y="2" width="3" height="13" rx="1" fill="#fff" />
            </svg>
          </div>
          <div>
            <div className="font-bold" style={{ fontSize: "0.85rem", color: "#ffffff" }}>ConstructaIQ</div>
            <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", marginTop: 1, letterSpacing: "0.04em" }}>Intelligence Platform</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", padding: "2px 8px 8px" }}>Navigation</div>
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <NavLink key={path} to={path} className={`sidebar-item ${active ? "active" : ""}`}>
                <Icon size={14} style={{ flexShrink: 0 }} />
                <span className="flex-1 truncate">{label}</span>
                {active && <div className="rounded-full shrink-0" style={{ width: 6, height: 6, background: "#6395ff" }} />}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 10 }}>
          <NavLink to="/settings" className={({ isActive }) => `sidebar-item w-full${isActive ? " active" : ""}`}>
            <Settings size={14} />
            <span>Settings</span>
          </NavLink>
          <div className="flex items-center gap-2 px-3 py-2 mt-1.5 rounded-lg" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <Activity size={10} className="animate-pulse" style={{ color: "#22c55e" }} />
            <span style={{ fontSize: "0.62rem", color: "#22c55e", fontWeight: 700, letterSpacing: "0.05em" }}>5 AGENTS ACTIVE</span>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between shrink-0 px-6" style={{ height: 56, background: "#ffffff", borderBottom: "1px solid var(--border)" }}>
          <div>
            <div className="flex items-center gap-1" style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
              <span style={{ color: "var(--text-secondary)" }}>ConstructaIQ</span>
              <span style={{ color: "var(--border2)", margin: "0 2px" }}>/</span>
              <span style={{ color: "var(--blue-primary)", fontWeight: 600 }}>{currentPage?.label ?? "Dashboard"}</span>
            </div>
            <div className="font-semibold" style={{ fontSize: "1rem", color: "var(--text-primary)", marginTop: 1 }}>
              {currentPage?.label ?? "Dashboard"}
            </div>
          </div>
          <div className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
            style={{ width: 36, height: 36, background: "#16a34a", fontSize: "0.72rem" }}>
            JD
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 overflow-y-auto" style={{ background: "var(--bg)" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
