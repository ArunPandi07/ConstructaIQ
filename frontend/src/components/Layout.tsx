import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Bot,
  HardHat,
  Bell,
  Plus,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
<<<<<<< HEAD
import { useLoading } from "../context/LoadingContext";
import { FullscreenLoader, LoadingBar } from "./Loader";
=======
import { useAuth } from "../context/AuthContext";
>>>>>>> 6e84e374aae6fa0583c5dc8c7c9abceff753715d
import NewProjectModal from "./NewProjectModal";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/projects", label: "Projects", icon: Building2 },
  { path: "/ai-insights", label: "AI Insights", icon: Bot },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isModalOpen,
    setIsModalOpen,
    // , handleProjectCreated
  } = useAppContext();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    // Dashboard
    if (path === "/dashboard") {
      return (
        location.pathname === "/dashboard" ||
        (location.pathname.startsWith("/projects/") &&
          location.state?.from === "dashboard")
      );
    }

    // Projects
    if (path === "/projects") {
      return (
        location.pathname === "/projects" ||
        (location.pathname.startsWith("/projects/") &&
          location.state?.from === "projects")
      );
    }

    // AI Insights
    return location.pathname === path;
  };

  const { hasFullscreenLoader, routeTransition } = useLoading();

  return (
    <>
      <LoadingBar show={routeTransition} />
      <FullscreenLoader show={hasFullscreenLoader} rotateMessages />

<<<<<<< HEAD
      <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans antialiased relative pb-16 flex flex-col">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 opacity-[0.02] pointer-events-none select-none overflow-hidden text-[#1A1A1A]">
          <HardHat className="w-full h-full rotate-15 translate-x-12 -translate-y-12" />
=======
      {/* TOP NAVIGATION BAR */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-40 shadow-xs backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 h-18 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#F5C518] text-[#1A1A1A] flex items-center justify-center shadow-xs">
              <HardHat className="w-5.5 h-5.5 stroke-2" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-stone-950 block leading-tight font-sans">
                ConstructaIQ
              </span>
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block leading-none">
                Intelligence Platform
              </span>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className="hidden xl:flex bg-stone-100 p-1 rounded-full border border-stone-200 gap-1 text-xs">
            {navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={`px-4 py-2 rounded-full font-bold transition flex items-center gap-1.5 ${
                  isActive(path)
                    ? "bg-[#F5C518] text-[#1A1A1A] shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <button
              className="p-2.5 rounded-full hover:bg-stone-100 text-stone-500 transition relative shrink-0"
              aria-label="Notifications"
            >
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full"></span>
              <Bell className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="hidden sm:flex items-center gap-2 border bg-stone-50 hover:bg-stone-100 transition border-stone-200/80 px-4 py-2 rounded-xl text-xs text-stone-600 cursor-pointer h-10 font-bold"
            >
              <UserIcon className="w-4 h-4" />
              <span>{user?.full_name || "User"}</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
            </button>

            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 border bg-white hover:bg-stone-50 transition border-stone-200/80 px-3 py-2 rounded-xl text-xs text-stone-600 cursor-pointer h-10"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile nav */}
            <div className="xl:hidden flex gap-1">
              <select
                value={
                  location.pathname.startsWith("/projects/")
                    ? "/projects"
                    : location.pathname
                }
                onChange={(e) => {
                  window.location.href = e.target.value;
                }}
                className="bg-stone-100 hover:bg-stone-200 text-[#1A1A1A] text-xs font-bold px-3 py-2 rounded-xl focus:outline-hidden border border-stone-300"
              >
                {navItems.map(({ path, label }) => (
                  <option key={path} value={path}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
>>>>>>> 6e84e374aae6fa0583c5dc8c7c9abceff753715d
        </div>

        {/* TOP NAVIGATION BAR */}
        <header className="bg-white/90 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-40 shadow-xs supports-backdrop-blur:bg-white/95">
          <div className="max-w-400 mx-auto px-4 sm:px-6 lg:px-10 h-16 lg:h-18 flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#F5C518] text-[#1A1A1A] flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95">
                <HardHat className="w-5 h-5 lg:w-5.5 lg:h-5.5 stroke-2" />
              </div>
              <div>
                <span className="text-base lg:text-lg font-black tracking-tight text-stone-950 block leading-tight">
                  ConstructaIQ
                </span>
                <span className="text-[9px] lg:text-[10px] text-stone-400 font-bold uppercase tracking-wider block leading-none">
                  Intelligence Platform
                </span>
              </div>
            </div>

            {/* Navigation Pill Tabs - desktop */}
            <nav className="hidden lg:flex bg-stone-100 p-1 rounded-full border border-stone-200 gap-1 text-xs">
              {navItems.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={`px-3 xl:px-4 py-2 rounded-full font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive(path)
                      ? "bg-[#F5C518] text-[#1A1A1A] shadow-xs scale-105"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-200/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                className="p-2 lg:p-2.5 rounded-full hover:bg-stone-100 text-stone-500 transition-all duration-200 relative shrink-0 hover:scale-105 active:scale-95"
                aria-label="Notifications"
              >
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full animate-pulse"></span>
                <Bell className="w-4.5 h-4.5 lg:w-5 lg:h-5" />
              </button>

              <div className="hidden sm:flex items-center gap-2 border bg-stone-50 hover:bg-stone-100 hover:border-stone-300/80 transition-all duration-200 border-stone-200/80 px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[11px] lg:text-xs text-stone-600 cursor-pointer h-9 lg:h-10 font-bold hover:scale-[1.02] active:scale-[0.98]">
                <span>
                  👤 <span className="hidden md:inline">Madhesh</span>
                </span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              </div>

              {/* Mobile navigation dropdown */}
              <div className="lg:hidden flex gap-1">
                <select
                  value={
                    location.pathname.startsWith("/projects/")
                      ? "/projects"
                      : location.pathname
                  }
                  onChange={(e) => {
                    window.location.href = e.target.value;
                  }}
                  className="bg-stone-100 hover:bg-stone-200 text-[#1A1A1A] text-xs font-bold px-3 py-2 rounded-xl focus:outline-hidden border border-stone-300 transition-colors"
                >
                  {navItems.map(({ path, label }) => (
                    <option key={path} value={path}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-400 mx-auto px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8 flex-1 w-full animate-fade-in">
          <Outlet />
        </main>

        {/* New Project FAB */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 bg-[#F5C518] hover:bg-[#E2B30D] text-[#1A1A1A] p-3.5 sm:p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-30 font-black flex items-center justify-center gap-2 hover:scale-105 active:scale-95 border border-amber-400/60 hover:border-amber-400 animate-float"
          title="Onboard New Project"
        >
          <Plus className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-3" />
          <span className="hidden sm:inline text-xs font-sans font-bold select-none pr-1">
            New Build Onboard
          </span>
        </button>

        {isModalOpen && (
          <NewProjectModal
            onClose={() => setIsModalOpen(false)}
            open={isModalOpen}
            // onProjectCreated={handleProjectCreated}
          />
        )}
      </div>
    </>
  );
}
