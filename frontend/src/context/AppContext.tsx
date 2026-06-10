import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

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
}

const DEFAULT_PROJECT_ID = 'proj-tower-a-2024'

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string>(DEFAULT_PROJECT_ID)
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null)
  const [uploadJustCompleted, setUploadJustCompleted] = useState(false)

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
