import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { isBackendProjectId } from "../services/projectApi";
import ChatPanel from "./chat/ChatPanel";

export default function FloatingChatBot() {
  const location = useLocation();
  const { activeProjectId, projects } = useAppContext();
  const [open, setOpen] = useState(false);

  const routeProjectId = useMemo(() => {
    const match = location.pathname.match(/^\/projects\/(\d+)/);
    return match?.[1] ?? "";
  }, [location.pathname]);

  const projectId = isBackendProjectId(activeProjectId)
    ? activeProjectId
    : isBackendProjectId(routeProjectId)
      ? routeProjectId
      : "";

  const projectName = useMemo(() => {
    const match = projects.find((p) => String(p.id) === projectId);
    return match?.name ?? (projectId ? `Project ${projectId}` : "");
  }, [projects, projectId]);

  return (
    <div className="fixed bottom-22 right-8 z-50 flex flex-col items-end gap-3 pb-[env(safe-area-inset-bottom)]">
      {open && (
        <ChatPanel
          projectId={projectId}
          projectName={projectName}
          className="w-[360px]"
        />
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full bg-stone-900 hover:bg-stone-800 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105"
        aria-label={open ? "Close ConstructaIQ assistant" : "Open ConstructaIQ assistant"}
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6 text-[#F5C518]" />
        )}
      </button>
    </div>
  );
}
