import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileText, CheckCircle, Loader2,
  X, File, Bot, Zap, Clock, ArrowRight,
} from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { uploadProjectFiles } from '../services/api'
import type { FileType, FileStatus } from '../types'

interface LocalFile {
  id:       string
  name:     string
  size:     number
  type:     FileType
  status:   FileStatus
  progress: number
}

const agentSteps = [
  { id: 'contract',  name: 'Contract Agent',  description: 'Extracting clauses & obligations',      duration: 2400 },
  { id: 'blueprint', name: 'Blueprint Agent', description: 'Analyzing structural drawings',          duration: 4800 },
  { id: 'permit',    name: 'Permit Agent',    description: 'Cross-referencing permit requirements',  duration: 1800 },
  { id: 'risk',      name: 'Risk Agent',      description: 'Computing risk vectors & probabilities', duration: 6200 },
  { id: 'recovery',  name: 'Recovery Agent',  description: 'Generating recovery strategies',         duration: 3400 },
]

export default function ProjectUpload() {
  const navigate = useNavigate()
  const { setActiveProjectId, setUploadSessionId, setUploadJustCompleted } = useAppContext()

  const [isDragOver,      setIsDragOver]      = useState(false)
  const [files,           setFiles]           = useState<LocalFile[]>([])
  const [agentProgress,   setAgentProgress]   = useState<Record<string, 'pending'|'running'|'complete'>>({})
  const [isProcessing,    setIsProcessing]    = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [apiError,        setApiError]        = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /** Call mock API, then animate agent steps */
  const startProcessing = useCallback(async () => {
    setApiError(null)
    setIsProcessing(true)
    setOverallProgress(0)

    try {
      const res = await uploadProjectFiles(null, null)
      setUploadSessionId(res.data.sessionId)
      setActiveProjectId(res.data.projectId)
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : 'Upload failed')
      setIsProcessing(false)
      return
    }

    // Animate agent steps client-side (mirrors real SSE/WebSocket events)
    let elapsed = 0
    const totalTime = agentSteps.reduce((s, a) => s + a.duration, 0)
    const init: Record<string,'pending'|'running'|'complete'> = {}
    agentSteps.forEach(s => { init[s.id] = 'pending' })
    setAgentProgress(init)

    agentSteps.forEach((step, idx) => {
      const startDelay = agentSteps.slice(0, idx).reduce((s, a) => s + a.duration, 0)
      setTimeout(() => {
        setAgentProgress(p => ({ ...p, [step.id]: 'running' }))
        setOverallProgress(Math.round((elapsed / totalTime) * 100))
      }, startDelay)
      setTimeout(() => {
        elapsed += step.duration
        setAgentProgress(p => ({ ...p, [step.id]: 'complete' }))
        setOverallProgress(Math.round((elapsed / totalTime) * 100))
        if (idx === agentSteps.length - 1) {
          setTimeout(() => {
            setIsProcessing(false)
            setOverallProgress(100)
            setUploadJustCompleted(true)
          }, 300)
        }
      }, startDelay + step.duration)
    })
  }, [setActiveProjectId, setUploadSessionId, setUploadJustCompleted])

  const addFiles = (newFiles: FileList | Pick<File,'name'|'size'>[]) => {
    const arr = Array.from(newFiles)
    const uploaded: LocalFile[] = arr.map(f => ({
      id: Math.random().toString(36).slice(2),
      name: f.name, size: f.size,
      type: (f.name.toLowerCase().includes('blueprint') || f.name.toLowerCase().includes('plan'))
        ? 'blueprint' : 'contract',
      status: 'uploading', progress: 0,
    }))
    setFiles(prev => [...prev, ...uploaded])
    uploaded.forEach(file => {
      let prog = 0
      const iv = setInterval(() => {
        prog += Math.random() * 25
        if (prog >= 100) {
          clearInterval(iv)
          setFiles(p => p.map(f => f.id === file.id ? { ...f, status: 'complete', progress: 100 } : f))
        } else {
          setFiles(p => p.map(f => f.id === file.id ? { ...f, progress: Math.round(prog) } : f))
        }
      }, 200)
    })
  }

  const getAgentIcon = (status: string) => {
    if (status === 'complete') return <CheckCircle size={15} style={{ color: '#16a34a' }} />
    if (status === 'running')  return <Loader2    size={15} style={{ color: '#2563eb' }} className="animate-spin" />
    return <div className="w-3.5 h-3.5 rounded-full" style={{ background: '#e2e8f0', border: '1px solid #cbd5e1' }} />
  }

  const allFilesReady = files.length > 0 && files.every(f => f.status === 'complete')
  const uploadZoneStyle: React.CSSProperties = {
    borderColor: isDragOver ? '#2563eb' : '#bfdbfe',
    background:  isDragOver ? '#eff6ff' : '#f8faff',
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in-up">
      <div>
        <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Project Upload</h2>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
          Upload project documents for AI-powered intelligence extraction
        </p>
      </div>

      {/* Upload zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Contract PDF',  tag: 'Required', Icon: FileText,
            color: '#2563eb', bg: '#eff6ff', bd: '#bfdbfe', hint: 'PDF, DOC up to 50MB'  },
          { label: 'Blueprint PDF', tag: 'Optional',  Icon: File,
            color: '#7c3aed', bg: '#f5f3ff', bd: '#ddd6fe', hint: 'PDF, DWG up to 100MB' },
        ].map(({ label, tag, Icon, color, bg, bd, hint }) => (
          <div key={label}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: bg, border: `1px solid ${bd}` }}>
                <Icon size={13} style={{ color }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>{label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: bg, color, border: `1px solid ${bd}` }}>{tag}</span>
            </div>
            <div className="upload-zone p-8 text-center cursor-pointer" style={uploadZoneStyle}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => { e.preventDefault(); setIsDragOver(false); addFiles(e.dataTransfer.files) }}
              onClick={() => fileInputRef.current?.click()}>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: bg, border: `1px solid ${bd}` }}>
                <Upload size={22} style={{ color }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#0f172a' }}>
                Drop {label.toLowerCase()} here
              </p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>or click to browse · {hint}</p>
            </div>
          </div>
        ))}
      </div>

      <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.dwg"
        className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />

      {/* Demo button */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t" style={{ borderColor: '#e2e8f0' }} />
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:shadow-sm"
          style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}
          onClick={() => addFiles([
            { name: 'TowerA_Contract_2024.pdf', size: 2340000 },
            { name: 'TowerA_Blueprint_v3.pdf',  size: 8750000 },
          ])}>
          <Zap size={12} /> Load Demo Project Files
        </button>
        <div className="flex-1 border-t" style={{ borderColor: '#e2e8f0' }} />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold mb-4" style={{ color: '#0f172a' }}>Uploaded Documents</h3>
          <div className="space-y-3">
            {files.map(file => {
              const isBlue = file.type === 'contract'
              const clr = isBlue ? '#2563eb' : '#7c3aed'
              const bg  = isBlue ? '#eff6ff' : '#f5f3ff'
              const bd  = isBlue ? '#bfdbfe' : '#ddd6fe'
              return (
                <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: bg, border: `1px solid ${bd}` }}>
                    <FileText size={16} style={{ color: clr }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold truncate" style={{ color: '#0f172a' }}>{file.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded font-semibold uppercase"
                        style={{ background: bg, color: clr, border: `1px solid ${bd}`, fontSize: '0.58rem', letterSpacing: '0.04em' }}>
                        {file.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="progress-bar flex-1">
                        <div className="progress-fill" style={{
                          width: `${file.progress}%`,
                          background: file.status === 'complete'
                            ? 'linear-gradient(90deg,#16a34a,#22c55e)'
                            : `linear-gradient(90deg,${clr},${clr}99)`,
                        }} />
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: '#94a3b8' }}>{file.progress}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.status === 'complete'
                      ? <CheckCircle size={16} style={{ color: '#16a34a' }} />
                      : <Loader2    size={16} style={{ color: '#2563eb' }} className="animate-spin" />}
                    <button onClick={() => setFiles(p => p.filter(f => f.id !== file.id))}
                      className="p-1 rounded hover:bg-red-50 transition-colors">
                      <X size={14} style={{ color: '#94a3b8' }} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* API error */}
          {apiError && (
            <div className="mt-3 p-3 rounded-xl text-xs"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              ⚠️ {apiError}
            </div>
          )}

          {allFilesReady && !isProcessing && overallProgress < 100 && (
            <button onClick={startProcessing}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
              <Bot size={15} /> Start AI Agent Processing <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}

      {/* Agent processing panel */}
      {Object.keys(agentProgress).length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#0f172a' }}>AI Agent Processing</h3>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                Autonomous intelligence extraction in progress
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: '#2563eb' }}>{overallProgress}%</span>
              {isProcessing && <Loader2 size={14} style={{ color: '#2563eb' }} className="animate-spin" />}
              {!isProcessing && overallProgress === 100 && <CheckCircle size={14} style={{ color: '#16a34a' }} />}
            </div>
          </div>
          <div className="progress-bar mb-5" style={{ height: 8 }}>
            <div className="progress-fill" style={{
              width: `${overallProgress}%`,
              background: overallProgress === 100
                ? 'linear-gradient(90deg,#16a34a,#22c55e)'
                : 'linear-gradient(90deg,#2563eb,#4f46e5)',
            }} />
          </div>
          <div className="space-y-2">
            {agentSteps.map(step => {
              const status = agentProgress[step.id] || 'pending'
              return (
                <div key={step.id} className="flex items-center gap-4 p-3 rounded-xl transition-all"
                  style={{
                    background: status === 'running' ? '#eff6ff' : status === 'complete' ? '#f0fdf4' : '#f8fafc',
                    border: `1px solid ${status === 'running' ? '#bfdbfe' : status === 'complete' ? '#bbf7d0' : '#e2e8f0'}`,
                  }}>
                  <div className="flex-shrink-0">{getAgentIcon(status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold"
                        style={{ color: status === 'running' ? '#2563eb' : status === 'complete' ? '#16a34a' : '#94a3b8' }}>
                        {step.name}
                      </span>
                      {status === 'running' && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-semibold animate-pulse"
                          style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '0.58rem' }}>
                          RUNNING
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{step.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Clock size={11} style={{ color: '#cbd5e1' }} />
                    <span style={{ color: '#94a3b8', fontSize: '0.62rem' }}>{(step.duration / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              )
            })}
          </div>

          {overallProgress === 100 && !isProcessing && (
            <div className="mt-4 p-4 rounded-xl text-center"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <CheckCircle size={20} className="mx-auto mb-2" style={{ color: '#16a34a' }} />
              <p className="text-sm font-bold mb-1" style={{ color: '#16a34a' }}>Analysis Complete!</p>
              <p className="text-xs mb-3" style={{ color: '#64748b' }}>
                All agents finished. Navigate to any intelligence page to review results.
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {[
                  { label: 'Project Intelligence', path: '/intelligence' },
                  { label: 'Risk Intelligence',    path: '/risk' },
                  { label: 'Agent Insights',       path: '/agents' },
                ].map(({ label, path }) => (
                  <button key={path} onClick={() => navigate(path)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
