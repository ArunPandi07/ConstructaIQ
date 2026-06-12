import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Project } from '../types'

// ─────────────────────────────────────────────────────────────
// BuildMind AI — Global App Context
// Carries cross-page state: active project, upload session, etc.
// ─────────────────────────────────────────────────────────────

interface AppContextValue {
  /** Currently active project ID (set after upload or project selection) */
  activeProjectId: string
  setActiveProjectId: (id: string) => void

  /** Upload session tracking */
  uploadSessionId: string | null
  setUploadSessionId: (id: string | null) => void

  /** Signals that upload just completed — drives Intelligence page banner */
  uploadJustCompleted: boolean
  setUploadJustCompleted: (v: boolean) => void

  /** Clear all transient state (e.g. on project switch) */
  reset: () => void

  /** Modal state for New Project Onboarding */
  isModalOpen: boolean
  setIsModalOpen: (v: boolean) => void

  /** Projects list */
  projects: Project[]
  setProjects: (projects: Project[]) => void
  handleProjectCreated: (newProj: Project, addedTelemetry?: any) => void
}

const DEFAULT_PROJECT_ID = 'proj-tower-a-2024'

const initialProjects: Project[] = [
  {
    id: "proj-1",
    name: "Urban Heights Commercial Complex",
    description:
      "Multi-story retail and office complex with high-density steel truss designs and reinforced concrete base foundations.",
    budget: "$2.5M",
    status: "LIVE",
    progress: 72,
    location: "Austin, TX",
    createdAt: "June 2, 2026",
    leadIcon: "HardHat",
  },
  {
    id: "proj-2",
    name: "Golden Gate Waterfront Terminal",
    description:
      "Industrial warehouse terminal with custom marine grading requirements and wind load resistance for ocean fronting environments.",
    budget: "$4.1M",
    status: "LIVE",
    progress: 40,
    location: "San Francisco, CA",
    createdAt: "May 28, 2026",
    leadIcon: "HardHat",
  },
  {
    id: "proj-3",
    name: "Pecos Valley Solar Storage Pad",
    description:
      "Grid solar thermal field protective structural pads with continuous concrete curing checks.",
    budget: "$1.8M",
    status: "PENDING",
    progress: 15,
    location: "Pecos, NM",
    createdAt: "June 8, 2026",
    leadIcon: "HardHat",
  },
  {
    id: "proj-4",
    name: "Metro Transit Depot Extension",
    description:
      "Heavy reinforced concrete girder structural expansion, platform layout, and municipal utility connections.",
    budget: "$3.2M",
    status: "LIVE",
    progress: 88,
    location: "Seattle, WA",
    createdAt: "May 15, 2026",
    leadIcon: "HardHat",
  },
];

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string>(DEFAULT_PROJECT_ID)
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null)
  const [uploadJustCompleted, setUploadJustCompleted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>(initialProjects)

  const handleProjectCreated = useCallback((newProj: Project, addedTelemetry?: any) => {
    setProjects((prev) => [newProj, ...prev])
  }, [])

  const reset = useCallback(() => {
    setUploadSessionId(null)
    setUploadJustCompleted(false)
  }, [])

  return (
    <AppContext.Provider
      value={{
        activeProjectId, setActiveProjectId,
        uploadSessionId, setUploadSessionId,
        uploadJustCompleted, setUploadJustCompleted,
        reset,
        isModalOpen, setIsModalOpen,
        projects, setProjects,
        handleProjectCreated,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>')
  return ctx
}
