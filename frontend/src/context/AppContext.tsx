import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react'
import type { ReactNode } from 'react'
import type { AnalyzePipelineResult, Project } from '../types'
import { fetchDashboard } from '../services/api'
import { listProjects, mapProjectListToUI } from '../services/projectApi'
import { setDashboardCache } from '../services/dashboardCache'

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
  projectsLoading: boolean
  projectsError: string | null
  refreshProjects: (force?: boolean) => Promise<void>
  handleProjectCreated: (newProj: Project, addedTelemetry?: unknown) => void

  /** Latest async analyze pipeline result (6-agent keys) */
  latestAnalysisResult: AnalyzePipelineResult | null
  setLatestAnalysisResult: (result: AnalyzePipelineResult | null) => void

  /** Current analyze job id for status polling */
  analyzeJobId: string | null
  setAnalyzeJobId: (id: string | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string>('')
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null)
  const [uploadJustCompleted, setUploadJustCompleted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [latestAnalysisResult, setLatestAnalysisResult] =
    useState<AnalyzePipelineResult | null>(null)
  const [analyzeJobId, setAnalyzeJobId] = useState<string | null>(null)

  const projectsCacheRef = useRef<{ data: Project[]; at: number } | null>(null)
  const PROJECTS_TTL_MS = 60_000

  const bootstrapAppData = useCallback(async (force = false) => {
    const now = Date.now()
    if (
      !force &&
      projectsCacheRef.current &&
      now - projectsCacheRef.current.at < PROJECTS_TTL_MS
    ) {
      setProjects(projectsCacheRef.current.data)
      return
    }
    setProjectsLoading(true)
    setProjectsError(null)
    try {
      const res = await fetchDashboard({ includeProjects: true })
      const { projects: projectItems, ...dashboardOnly } = res.data
      if (projectItems?.length) {
        const mapped = mapProjectListToUI(projectItems)
        projectsCacheRef.current = { data: mapped, at: Date.now() }
        setProjects(mapped)
      } else {
        const items = await listProjects()
        const mapped = mapProjectListToUI(items)
        projectsCacheRef.current = { data: mapped, at: Date.now() }
        setProjects(mapped)
      }
      setDashboardCache(dashboardOnly)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load app data'
      setProjectsError(message)
    } finally {
      setProjectsLoading(false)
    }
  }, [])

  const refreshProjects = useCallback(async (force = false) => {
    if (!force) {
      await bootstrapAppData(false)
      return
    }
    setProjectsLoading(true)
    setProjectsError(null)
    try {
      const items = await listProjects()
      const mapped = mapProjectListToUI(items)
      projectsCacheRef.current = { data: mapped, at: Date.now() }
      setProjects(mapped)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load projects'
      setProjectsError(message)
    } finally {
      setProjectsLoading(false)
    }
  }, [bootstrapAppData])

  useEffect(() => {
    void bootstrapAppData()
  }, [bootstrapAppData])

  const handleProjectCreated = useCallback(
    (newProj: Project) => {
      setActiveProjectId(newProj.id)
      void refreshProjects(true)
    },
    [refreshProjects],
  )

  const reset = useCallback(() => {
    setUploadSessionId(null)
    setUploadJustCompleted(false)
    setAnalyzeJobId(null)
  }, [])

  return (
    <AppContext.Provider
      value={{
        activeProjectId,
        setActiveProjectId,
        uploadSessionId,
        setUploadSessionId,
        uploadJustCompleted,
        setUploadJustCompleted,
        reset,
        isModalOpen,
        setIsModalOpen,
        projects,
        setProjects,
        projectsLoading,
        projectsError,
        refreshProjects,
        handleProjectCreated,
        latestAnalysisResult,
        setLatestAnalysisResult,
        analyzeJobId,
        setAnalyzeJobId,
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
