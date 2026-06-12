import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, CheckCircle2, Circle, Loader2, AlertCircle, HardHat,
  Upload, FileText, ThumbsUp, ThumbsDown, Bot, Clock,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import type { Project } from '../types';

interface WorkflowProgressModalProps {
  projectName: string;
  requirementsFile: File | null;
  blueprintFile: File | null;
  onClose: () => void;
  onComplete: (project: Project, telemetry?: any) => void;
}

type AgentStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
type WorkflowPhase = 'uploading' | 'processing' | 'completed' | 'approved' | 'error';

interface AgentStepData {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  output: any;
  startedAt: string;
  completedAt: string;
}

const AGENT_DEFS: { id: string; name: string; description: string }[] = [
  { id: 'contract',  name: 'ContractAgent',  description: 'Extracting project parameters from requirements document' },
  { id: 'blueprint', name: 'BlueprintAgent', description: 'Analyzing blueprint and generating revised design' },
  { id: 'permit',    name: 'PermitAgent',    description: 'Assessing permit and regulatory requirements' },
  { id: 'schedule',  name: 'ScheduleAgent',  description: 'Generating project execution schedule' },
  { id: 'supplier',  name: 'SupplierAgent',  description: 'Analyzing material and supplier requirements' },
  { id: 'crew',      name: 'CrewAgent',       description: 'Assessing workforce and crew requirements' },
];

const AGENT_KEY_MAP: Record<string, string> = {
  projectSummary:    'contract',
  blueprintSummary:  'blueprint',
  permitAssessment:  'permit',
  projectPlan:       'schedule',
  supplierAnalysis:  'supplier',
  crewAnalysis:      'crew',
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const STATUS_ICON: Record<AgentStatus, React.ReactNode> = {
  pending:     <Circle className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />,
  in_progress: <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--blue-primary)' }} />,
  completed:   <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--green-primary)' }} />,
  failed:      <AlertCircle className="w-5 h-5" style={{ color: 'var(--red-primary)' }} />,
};

export function WorkflowProgressModal({
  projectName,
  requirementsFile,
  blueprintFile,
  onClose,
  onComplete,
}: WorkflowProgressModalProps) {
  const [phase, setPhase] = useState<WorkflowPhase>('uploading');
  const [agents, setAgents] = useState<AgentStepData[]>(() =>
    AGENT_DEFS.map((a) => ({
      ...a,
      status: 'pending' as AgentStatus,
      output: null,
      startedAt: '',
      completedAt: '',
    })),
  );
  const [apiResult, setApiResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [revealedCount, setRevealedCount] = useState(0);
  const [approved, setApproved] = useState(false);

  const startTimeRef = useRef<string>('');
  const mountedRef = useRef(true);

  const startApiCall = useCallback(async () => {
    if (!requirementsFile && !blueprintFile) {
      setPhase('error');
      setErrorMessage('At least one document is required.');
      return;
    }

    startTimeRef.current = formatTime(new Date());
    setPhase('processing');
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        status: 'in_progress' as AgentStatus,
        startedAt: startTimeRef.current,
      })),
    );

    try {
      const formData = new FormData();
      formData.append('project_name', projectName.trim());
      if (requirementsFile) formData.append('project_requirements', requirementsFile);
      if (blueprintFile) formData.append('blueprint', blueprintFile);

      const response = await fetch('/api/analyze/blueprint-revision', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!mountedRef.current) return;

      const completionTime = formatTime(new Date());

      setApiResult(result);

      const updatedAgents = agents.map((a) => {
        const matchedKey = Object.entries(AGENT_KEY_MAP).find(([, v]) => v === a.id)?.[0];
        return {
          ...a,
          status: 'completed' as AgentStatus,
          output: matchedKey ? result[matchedKey] : null,
          completedAt: completionTime,
        };
      });
      setAgents(updatedAgents);
      setPhase('completed');

      let count = 0;
      const interval = setInterval(() => {
        count++;
        setRevealedCount(count);
        if (count >= AGENT_DEFS.length) clearInterval(interval);
      }, 250);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setPhase('error');
      setErrorMessage(err.message || 'An unexpected error occurred during analysis.');
      setAgents((prev) =>
        prev.map((a) => ({ ...a, status: 'failed' as AgentStatus })),
      );
    }
  }, [projectName, requirementsFile, blueprintFile, agents]);

  useEffect(() => {
    mountedRef.current = true;
    startApiCall();
    return () => { mountedRef.current = false; };
  }, []);

  const handleApprove = () => {
    setApproved(true);
    setPhase('approved');

    const result = apiResult;
    const ps = result?.projectSummary || {};
    const bs = result?.blueprintSummary || {};

    const newProj: Project = {
      id: 'proj-' + Date.now(),
      name: projectName,
      description: bs?.revised_blueprint_summary || `Revised blueprint from ${requirementsFile?.name || 'requirements'} + ${blueprintFile?.name || 'blueprint'}`,
      budget: ps?.budget || '$2.5M',
      status: 'LIVE',
      progress: 20,
      location: ps?.location || 'Austin, TX',
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
      leadIcon: 'DraftingCompass',
    };

    setTimeout(() => {
      onComplete(newProj, result);
    }, 1200);
  };

  const handleRetry = () => {
    setErrorMessage('');
    setApiResult(null);
    setPhase('uploading');
    setRevealedCount(0);
    setAgents(AGENT_DEFS.map((a) => ({
      ...a,
      status: 'pending' as AgentStatus,
      output: null,
      startedAt: '',
      completedAt: '',
    })));
    startApiCall();
  };

  const handleReject = () => {
    onClose();
  };

  // ── Shared modal wrapper ────────────────────────────────────

  const modalFrame = (body: React.ReactNode) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div
        className="w-full overflow-hidden flex flex-col"
        style={{
          background: 'var(--bg)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          maxWidth: 520,
          maxHeight: '85vh',
        }}
      >
        {/* Header */}
        <div
          className="text-white p-5 flex justify-between items-center shrink-0"
          style={{ background: '#242445' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--blue-primary)', color: '#fff' }}
            >
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-sans tracking-tight">
                Blueprint Revision Workflow
              </h2>
              <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>
                {phase === 'uploading' && 'Uploading documents...'}
                {phase === 'processing' && 'AI agents processing...'}
                {phase === 'completed' && 'All agents completed'}
                {phase === 'approved' && 'Approved ✓'}
                {phase === 'error' && 'Workflow failed'}
              </p>
            </div>
          </div>
          {phase !== 'uploading' && phase !== 'processing' && (
            <button onClick={onClose} className="p-1.5 transition" style={{ color: 'var(--sidebar-text)', borderRadius: 8, cursor: 'pointer' }} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {body}
        </div>
      </div>
    </div>
  );

  // ── Phase: Uploading ────────────────────────────────────────

  if (phase === 'uploading') {
    return modalFrame(
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Upload className="w-12 h-12 mb-4 animate-pulse" style={{ color: 'var(--blue-primary)' }} />
        <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Uploading Documents</h3>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Sending {requirementsFile?.name || 'requirements'} and {blueprintFile?.name || 'blueprint'} to analysis pipeline...
        </p>
        <div className="w-full max-w-xs progress-bar mt-5">
          <div className="progress-fill animate-pulse" style={{ width: '60%', background: 'var(--blue-primary)' }} />
        </div>
      </div>,
    );
  }

  // ── Phase: Error ────────────────────────────────────────────

  if (phase === 'error') {
    return modalFrame(
      <div className="flex flex-col items-center py-6 text-center">
        <AlertCircle className="w-12 h-12 mb-4" style={{ color: 'var(--red-primary)' }} />
        <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Workflow Error</h3>
        <p className="text-xs mb-5 max-w-sm" style={{ color: 'var(--text-secondary)' }}>{errorMessage}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold transition" style={{ background: 'var(--bg3)', color: 'var(--text-primary)', borderRadius: 9, cursor: 'pointer', border: '1px solid var(--border)' }}>
            Cancel
          </button>
          <button onClick={handleRetry} className="px-5 py-2.5 text-sm font-bold transition flex items-center gap-2" style={{ background: 'var(--blue-primary)', color: '#fff', borderRadius: 9, cursor: 'pointer' }}>
            <Loader2 className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>,
    );
  }

  // ── Phase: Approved ─────────────────────────────────────────

  if (phase === 'approved') {
    return modalFrame(
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--green-bg)' }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--green-primary)' }} />
        </div>
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Project Created Successfully</h3>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {projectName} has been onboarded with the revised blueprint.
        </p>
      </div>,
    );
  }

  // ── Phase: Processing ───────────────────────────────────────

  const allPending = agents.every((a) => a.status === 'pending' || a.status === 'in_progress');

  if (phase === 'processing') {
    return modalFrame(
      <div className="space-y-4">
        {phase === 'processing' && (
          <div className="w-full progress-bar mb-2">
            <div className="progress-fill animate-pulse" style={{ width: '90%', background: 'var(--blue-primary)' }} />
          </div>
        )}

        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Started at {startTimeRef.current || '...'}
        </p>

        <div className="space-y-0">
          {agents.map((agent, idx) => (
            <div
              key={agent.id}
              className="flex items-start gap-3 px-4 py-3.5"
              style={{
                borderLeft: `2px solid ${agent.status === 'completed' ? 'var(--green-primary)' : agent.status === 'in_progress' ? 'var(--blue-primary)' : 'var(--border)'}`,
                opacity: agent.status === 'pending' ? 0.5 : 1,
                background: idx % 2 === 0 ? 'transparent' : 'var(--bg3)',
              }}
            >
              <div className="mt-0.5 shrink-0">{STATUS_ICON[agent.status]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{agent.name}</span>
                  {agent.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--green-primary)' }} />}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{agent.description}</p>
              </div>
              {agent.completedAt && (
                <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{agent.completedAt}</span>
              )}
            </div>
          ))}
        </div>
      </div>,
    );
  }

  // ── Phase: Completed ────────────────────────────────────────

  return modalFrame(
    <div className="space-y-5">
      {/* Overall status badge */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'var(--green-bg)', borderRadius: 10, border: '1px solid var(--green-border)' }}>
        <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--green-primary)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--green-primary)' }}>All agents completed successfully</span>
      </div>

      {/* Agent results */}
      <div className="space-y-1">
        {agents.map((agent, idx) => (
          <AgentResultCard
            key={agent.id}
            agent={agent}
            index={idx}
            isRevealed={idx < revealedCount}
          />
        ))}
      </div>

      {/* ── Human Verification ──────────────────────────────── */}
      <div
        className="p-5 space-y-4"
        style={{
          background: 'var(--card)',
          borderRadius: 12,
          border: '2px solid var(--amber-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <HardHat className="w-5 h-5" style={{ color: 'var(--amber)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Human Verification Required</h3>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Review the revised blueprint and associated analysis below before approving.
          Until approved, generated changes remain in review state.
        </p>

        {apiResult?.blueprintSummary && (
          <div className="p-3 space-y-2 text-xs" style={{ background: 'var(--bg3)', borderRadius: 8 }}>
            {apiResult.blueprintSummary.revised_blueprint_summary && (
              <div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Summary: </span>
                <span style={{ color: 'var(--text-secondary)' }}>{apiResult.blueprintSummary.revised_blueprint_summary}</span>
              </div>
            )}
            {apiResult.blueprintSummary.modifications_made && (
              <div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Modifications: </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {Array.isArray(apiResult.blueprintSummary.modifications_made)
                    ? apiResult.blueprintSummary.modifications_made.join('; ')
                    : apiResult.blueprintSummary.modifications_made}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-2"
            style={{ background: 'var(--bg3)', color: 'var(--text-primary)', borderRadius: 9, cursor: 'pointer', border: '1px solid var(--border)' }}
          >
            <ThumbsDown className="w-4 h-4" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            className="flex-1 py-3 text-sm font-bold transition flex items-center justify-center gap-2"
            style={{ background: 'var(--green-primary)', color: '#fff', borderRadius: 9, cursor: 'pointer' }}
          >
            <ThumbsUp className="w-4 h-4" />
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Agent Result Card ───────────────────────────────────────────

function AgentResultCard({
  agent,
  index,
  isRevealed,
}: {
  agent: AgentStepData;
  index: number;
  isRevealed: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="transition-all duration-300"
      style={{
        opacity: isRevealed ? 1 : 0,
        transform: isRevealed ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer"
        style={{
          background: index % 2 === 0 ? 'transparent' : 'var(--bg3)',
          borderRadius: 8,
        }}
        onClick={() => agent.output && setExpanded(!expanded)}
      >
        <div className="mt-0.5 shrink-0">
          {STATUS_ICON.completed}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{agent.name}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>✓ {agent.completedAt}</span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{agent.description}</p>
          {agent.output && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs" style={{ color: 'var(--blue-primary)' }}>
                {expanded ? 'Hide details' : 'View details'}
              </span>
            </div>
          )}
        </div>
        {agent.output && (
          <div style={{ color: 'var(--text-muted)' }}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        )}
      </div>
      {expanded && agent.output && (
        <div className="px-4 pb-3 pt-1">
          <pre
            className="text-xs p-3 overflow-x-auto whitespace-pre-wrap"
            style={{
              background: 'var(--bg3)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
              maxHeight: 200,
            }}
          >
            {typeof agent.output === 'string' ? agent.output : JSON.stringify(agent.output, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
