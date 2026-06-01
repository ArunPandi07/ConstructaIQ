import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Brain, ShieldAlert, RefreshCw,
  GitBranch, Bot, Bell, Settings, ChevronRight, Zap, Activity,
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/upload', label: 'Project Upload', icon: Upload },
  { path: '/intelligence', label: 'Project Intelligence', icon: Brain },
  { path: '/risk', label: 'Risk Intelligence', icon: ShieldAlert },
  { path: '/recovery', label: 'Recovery Center', icon: RefreshCw },
  { path: '/change-impact', label: 'Change Impact', icon: GitBranch },
  { path: '/agents', label: 'Agent Insights', icon: Bot },
]

export default function Layout() {
  const location = useLocation()
  const currentPage = navItems.find(item => item.path === location.pathname)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f1f5f9' }}>
      {/* ── Sidebar ── */}
      <aside
        className="w-[230px] flex-shrink-0 flex flex-col border-r"
        style={{ background: '#ffffff', borderColor: '#e2e8f0' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
            >
              <Zap size={17} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight" style={{ color: '#0f172a' }}>
                BuildMind AI
              </div>
              <div className="text-xs" style={{ color: '#94a3b8', fontSize: '0.62rem' }}>
                Construction Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Active project chip */}
        <div
          className="mx-3 mt-3 px-3 py-2 rounded-lg"
          style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
        >
          <div className="text-xs font-medium" style={{ color: '#94a3b8', marginBottom: 2 }}>
            Active Project
          </div>
          <div className="text-xs font-semibold truncate" style={{ color: '#2563eb' }}>
            Tower A — Downtown
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span style={{ color: '#f97316', fontSize: '0.62rem', fontWeight: 600 }}>
              Risk: 82%
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div
            className="text-xs font-semibold uppercase tracking-wider px-2 pb-2"
            style={{ color: '#cbd5e1' }}
          >
            Navigation
          </div>
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <NavLink
                key={path}
                to={path}
                className="sidebar-item"
                style={isActive ? {
                  background: 'linear-gradient(135deg, #eff6ff, #eef2ff)',
                  color: '#2563eb',
                  borderColor: '#bfdbfe',
                } : {}}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                <span className="flex-1 text-xs font-semibold truncate">{label}</span>
                {isActive && <ChevronRight size={11} style={{ color: '#93c5fd', flexShrink: 0 }} />}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: '#e2e8f0' }}>
          <button className="sidebar-item w-full">
            <Settings size={14} />
            <span className="text-xs">Settings</span>
          </button>
          <div
            className="px-3 py-2 rounded-lg mt-1"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
          >
            <div className="flex items-center gap-2">
              <Activity size={12} style={{ color: '#16a34a' }} />
              <span style={{ fontSize: '0.62rem', color: '#16a34a', fontWeight: 600 }}>
                5 Agents Active
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-8 py-3.5 border-b"
          style={{ background: '#ffffff', borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: '#94a3b8' }}>BuildMind AI</span>
              <ChevronRight size={11} style={{ color: '#cbd5e1' }} />
              <span className="text-xs font-semibold" style={{ color: '#2563eb' }}>
                {currentPage?.label || 'Dashboard'}
              </span>
            </div>
            <h1 className="text-sm font-bold mt-0.5" style={{ color: '#0f172a' }}>
              {currentPage?.label || 'Dashboard'}
            </h1>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              Autonomous Construction Intelligence Platform
            </p>
          </div>

          <div className="flex items-center gap-3">



            <button
              className="relative p-2 rounded-lg transition-all"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            >
              <Bell size={15} style={{ color: '#64748b' }} />
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white"
                style={{ fontSize: '0.5rem', fontWeight: 700 }}
              >
                7
              </span>
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
              >
                JD
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-semibold" style={{ color: '#0f172a' }}>James Director</div>
                <div className="text-xs" style={{ color: '#94a3b8' }}>VP Projects</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main
          className="flex-1 overflow-y-auto p-6 bg-mesh"
          style={{ background: '#f1f5f9' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
