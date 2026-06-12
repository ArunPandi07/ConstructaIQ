import { useEffect, useState, useRef } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

/* ─── Agent pipeline definition ─── */
export interface AgentStep {
  id: string;
  name: string;
  emoji: string;
  role: string;
  thinkingLines: string[];
  weight: number; // relative weight (proportion of total animation)
}

export const AGENT_STEPS: AgentStep[] = [
  {
    id: "contract",
    name: "ContractAgent",
    emoji: "📋",
    role: "Contract Analysis",
    thinkingLines: [
      "Parsing project clauses and legal obligations...",
      "Extracting budget constraints and payment schedules...",
      "Identifying scope of work and deliverable milestones...",
      "Cross-referencing penalty clauses and compliance terms...",
    ],
    weight: 12,
  },
  {
    id: "blueprint",
    name: "BlueprintAgent",
    emoji: "🏗️",
    role: "Structural Analysis",
    thinkingLines: [
      "Analyzing structural elevation specifications...",
      "Computing load-bearing requirements and spans...",
      "Reviewing architectural footprint and zoning parameters...",
      "Identifying geotechnical considerations...",
    ],
    weight: 11,
  },
  {
    id: "permit",
    name: "PermitAgent",
    emoji: "🏛️",
    role: "Regulatory & Permits",
    thinkingLines: [
      "Scanning local building codes and municipal regulations...",
      "Identifying required permits for the project location...",
      "Checking environmental compliance requirements...",
      "Estimating permit approval timelines...",
    ],
    weight: 10,
  },
  {
    id: "schedule",
    name: "ScheduleAgent",
    emoji: "📅",
    role: "Project Scheduling",
    thinkingLines: [
      "Generating phased construction schedule...",
      "Estimating duration for work packages...",
      "Mapping dependencies and milestones...",
      "Identifying critical path...",
    ],
    weight: 12,
  },
  {
    id: "supplier",
    name: "SupplierAgent",
    emoji: "📦",
    role: "Material Planning",
    thinkingLines: [
      "Analyzing material specifications and quantities...",
      "Selecting optimal suppliers based on historical reliability...",
      "Generating cost breakdown for materials...",
      "Computing supplier confidence scores...",
    ],
    weight: 12,
  },
  {
    id: "crew",
    name: "CrewAgent",
    emoji: "👷",
    role: "Workforce Management",
    thinkingLines: [
      "Evaluating labor budget constraints...",
      "Assigning available team members to work phases...",
      "Generating labor cost breakdown...",
      "Finalizing crew plan and confidence score...",
    ],
    weight: 12, // Last agent waits for resolved=true from the live job poll
  },
];

const TOTAL_WEIGHT = AGENT_STEPS.reduce((s, a) => s + a.weight, 0);

// Cumulative progress threshold (0–1) at which each agent STARTS
const AGENT_START_AT = AGENT_STEPS.reduce<number[]>((acc, step, i) => {
  if (i === 0) return [0];
  return [...acc, acc[i - 1] + AGENT_STEPS[i - 1].weight / TOTAL_WEIGHT];
}, []);

// Cumulative progress threshold at which each agent would normally END
// Animation caps below 100% until the live analyze job signals resolved=true
const RUNDOWN_CAP = 0.88; // animation never auto-advances past this
const FLUSH_INTERVAL_MS = 200; // ms between agents completing during flush phase
const TICK_MS = 80; // animation tick rate
const SIMULATED_TOTAL_MS = 34000; // reference timeline (doesn't need to match real time)

type AgentStatus = "pending" | "thinking" | "done" | "error";
type LoaderPhase = "running" | "flushing" | "done" | "error";

/* ─── Typing text hook ─── */
function useTypingText(text: string, active: boolean, speed = 22) {
  const [displayed, setDisplayed] = useState("");
  const idxRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!active || !text) { setDisplayed(""); idxRef.current = 0; return; }
    idxRef.current = 0;
    setDisplayed("");
    intervalRef.current = setInterval(() => {
      if (idxRef.current < text.length) {
        setDisplayed(text.slice(0, idxRef.current + 1));
        idxRef.current++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, speed);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [text, active, speed]);

  return displayed;
}

interface Props {
  visible: boolean;
  projectName: string;
  mode: "text" | "documents";
  /** Set to true when the real API call succeeds — triggers flush animation */
  resolved: boolean;
  /** Set to a string when the API call fails */
  error: string | null;
  /** Live pipeline step from GET /analyze/status */
  progressStep?: string | null;
  /** Live overall percent from GET /analyze/status */
  overallPct?: number | null;
  onDismissError?: () => void;
  /** Called after the flush animation fully completes */
  onFlushComplete?: () => void;
}

export default function AgentThinkingLoader({
  visible,
  projectName,
  mode,
  resolved,
  error,
  progressStep,
  overallPct,
  onDismissError,
  onFlushComplete,
}: Props) {
  const [statuses, setStatuses] = useState<AgentStatus[]>(
    AGENT_STEPS.map(() => "pending")
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [thinkingLineIdx, setThinkingLineIdx] = useState(0);
  const [phase, setPhase] = useState<LoaderPhase>("running");
  const [elapsedMs, setElapsedMs] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  /* ── Reset on hide ── */
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!visible) {
      if (tickRef.current) clearInterval(tickRef.current);
      if (flushRef.current) clearInterval(flushRef.current);
      setStatuses(AGENT_STEPS.map(() => "pending"));
      setActiveIdx(0);
      setThinkingLineIdx(0);
      setPhase("running");
      setElapsedMs(0);
      startTimeRef.current = null;
    }
  }, [visible]);

  /* ── Main proportional tick animation ── */
  useEffect(() => {
    if (!visible || phase !== "running") return;

    startTimeRef.current = Date.now();

    tickRef.current = setInterval(() => {
      if (!mountedRef.current) return;

      const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
      setElapsedMs(elapsed);

      // Progress ratio — capped at RUNDOWN_CAP until the job completes
      const rawProgress = Math.min(elapsed / SIMULATED_TOTAL_MS, 1);
      const progress = Math.min(rawProgress, RUNDOWN_CAP);

      // Which agent should be ACTIVE?
      let targetIdx = 0;
      for (let i = AGENT_STEPS.length - 1; i >= 0; i--) {
        if (progress >= AGENT_START_AT[i]) { targetIdx = i; break; }
      }

      setActiveIdx(targetIdx);

      setStatuses((prev) => {
        const next = [...prev];
        // Mark all before targetIdx as done
        for (let i = 0; i < targetIdx; i++) {
          if (next[i] === "pending" || next[i] === "thinking") next[i] = "done";
        }
        // Mark targetIdx as thinking (unless already done/error)
        if (next[targetIdx] !== "done" && next[targetIdx] !== "error") {
          next[targetIdx] = "thinking";
        }
        return next;
      });

      // Cycle thinking lines proportionally within the active agent
      const agentStart = AGENT_START_AT[targetIdx];
      const agentEnd = targetIdx < AGENT_STEPS.length - 1
        ? AGENT_START_AT[targetIdx + 1]
        : RUNDOWN_CAP;
      const agentSpan = Math.max(agentEnd - agentStart, 0.01);
      const agentProgress = Math.min((progress - agentStart) / agentSpan, 0.999);
      const lineCount = AGENT_STEPS[targetIdx].thinkingLines.length;
      const lineIdx = Math.floor(agentProgress * lineCount);
      setThinkingLineIdx(Math.min(lineIdx, lineCount - 1));

    }, TICK_MS);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [visible, phase]);

  /* ── Sync agent statuses from live poll progress ── */
  useEffect(() => {
    if (!visible || !progressStep) return;
    const idx = AGENT_STEPS.findIndex((step) => step.name === progressStep);
    if (idx === -1) return;

    setActiveIdx(idx);
    setStatuses((prev) => {
      const next = [...prev];
      for (let i = 0; i < idx; i++) next[i] = "done";
      if (next[idx] !== "done") next[idx] = "thinking";
      for (let i = idx + 1; i < next.length; i++) next[i] = "pending";
      return next;
    });
  }, [progressStep, visible]);

  /* ── Handle error ── */
  useEffect(() => {
    if (!error || !visible) return;
    if (tickRef.current) clearInterval(tickRef.current);
    setPhase("error");
    setStatuses((prev) => {
      const next = [...prev];
      const idx = next.findIndex((s) => s === "thinking");
      if (idx !== -1) next[idx] = "error";
      return next;
    });
  }, [error, visible]);

  /* ── Handle resolved: flush remaining agents ── */
  useEffect(() => {
    if (!resolved || !visible || phase === "error" || phase === "done" || phase === "flushing") return;

    // Stop the tick
    if (tickRef.current) clearInterval(tickRef.current);
    setPhase("flushing");

    // Find the first non-done agent and flush from there
    let flushIdx = statuses.findIndex((s) => s !== "done");
    if (flushIdx === -1) flushIdx = AGENT_STEPS.length;

    // Flush each remaining agent in sequence
    let i = flushIdx;
    flushRef.current = setInterval(() => {
      if (!mountedRef.current) return;

      if (i < AGENT_STEPS.length) {
        const capturedI = i;
        setActiveIdx(capturedI);
        setStatuses((prev) => {
          const next = [...prev];
          if (capturedI > 0 && next[capturedI - 1] !== "done") next[capturedI - 1] = "done";
          next[capturedI] = "thinking";
          return next;
        });
        i++;
      } else {
        // Mark last agent done, finish
        if (flushRef.current) clearInterval(flushRef.current);
        setStatuses((prev) => {
          const next = [...prev];
          next[AGENT_STEPS.length - 1] = "done";
          return next;
        });
        setPhase("done");
        setTimeout(() => {
          if (mountedRef.current) onFlushComplete?.();
        }, 600);
      }
    }, FLUSH_INTERVAL_MS);

    return () => { if (flushRef.current) clearInterval(flushRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved, visible]);

  /* active thinking line for typewriter */
  const currentLine = AGENT_STEPS[activeIdx]?.thinkingLines[thinkingLineIdx] ?? "";
  const typedLine = useTypingText(
    currentLine,
    visible && statuses[activeIdx] === "thinking",
    22
  );

  const doneCount = statuses.filter((s) => s === "done").length;
  const simulatedProgress = phase === "flushing"
    ? Math.round((doneCount / AGENT_STEPS.length) * 100)
    : Math.round(Math.min(elapsedMs / SIMULATED_TOTAL_MS, RUNDOWN_CAP) * 100);
  const totalProgress = phase === "done"
    ? 100
    : overallPct != null
      ? overallPct
      : simulatedProgress;

  if (!visible) return null;

  const statusLabel =
    phase === "error" ? "Pipeline Error" :
      phase === "done" ? "Analysis Complete ✓" :
        phase === "flushing" ? "Finalizing results..." :
          "Agent Pipeline Running";

  const barColor =
    phase === "error" ? "linear-gradient(90deg, #ef4444, #dc2626)" :
      phase === "done" ? "linear-gradient(90deg, #22c55e, #16a34a)" :
        "linear-gradient(90deg, #f59e0b, #fbbf24)";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(8px)",
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        zIndex: 10,
        overflow: "hidden",
        animation: "aqFadeIn 0.25s ease forwards",
      }}
    >
      {/* ── Top header ── */}
      <div
        style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid #e2e8f0",
          flexShrink: 0,
        }}
      >
        {/* status row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <PulsingOrb phase={phase} />
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 800,
              color: phase === "error" ? "#dc2626" : phase === "done" ? "#16a34a" : "#d97706",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              transition: "color 0.3s",
              marginTop: "5px",
            }}
          >
            {statusLabel}
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.9rem",
              color: "#64748b",
              fontWeight: 600,
              fontFamily: "monospace",
            }}
          >
            {doneCount}/{AGENT_STEPS.length} · {totalProgress}%
          </span>
        </div>

        {/* project + mode label */}
        <p
          style={{
            margin: "0 0 10px",
            fontSize: "0.85rem",
            color: "#475569",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: "#94a3b8", fontWeight: 600 }}>Project: </span>
          {projectName}
        </p>

        {/* progress bar */}
        <div
          style={{
            height: 6,
            background: "#f1f5f9",
            borderRadius: 3,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${totalProgress}%`,
              background: barColor,
              borderRadius: 3,
              transition: "width 0.5s ease, background 0.4s ease",
              position: "relative",
              overflow: "hidden",
              boxShadow: phase === "error"
                ? "0 0 8px rgba(239,68,68,0.3)"
                : phase === "done"
                  ? "0 0 8px rgba(34,197,94,0.3)"
                  : "0 0 8px rgba(245,158,11,0.3)",
            }}
          >
            {/* animated stripes overlay */}
            {phase !== "done" && phase !== "error" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: "linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)",
                  backgroundSize: "20px 20px",
                  animation: "progressStripes 1s linear infinite",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Agent list ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {AGENT_STEPS.map((step, i) => {
          const status = statuses[i];
          const isActive = status === "thinking";
          const isDone = status === "done";
          const isError = status === "error";

          return (
            <div
              key={step.id}
              style={{
                padding: "12px 18px",
                display: "flex",
                flexDirection: "column",
                background: isActive ? "rgba(254,252,232,0.6)" : "transparent",
                borderLeft: isActive
                  ? "3px solid #f59e0b"
                  : isError
                    ? "3px solid #ef4444"
                    : "3px solid transparent",
                transition: "background 0.25s, border-color 0.25s",
                animation: isActive ? "aqPulseBg 2s ease-in-out infinite" : "none",
              }}
            >
              {/* agent row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* status icon */}
                <div
                  style={{
                    width: 24,
                    height: 24,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} color="#16a34a" />
                  ) : isError ? (
                    <XCircle size={18} color="#dc2626" />
                  ) : isActive ? (
                    <ThinkingDots />
                  ) : (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#cbd5e1",
                      }}
                    />
                  )}
                </div>

                <span style={{ fontSize: "1.1rem", lineHeight: 1, flexShrink: 0, animation: isActive ? "aqBounceIcon 1s ease infinite" : "none" }}>
                  {step.emoji}
                </span>

                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: isActive ? 800 : isDone ? 700 : 500,
                    color: isActive
                      ? "#0f172a"
                      : isDone
                        ? "#475569"
                        : isError
                          ? "#dc2626"
                          : "#94a3b8",
                    fontFamily: "monospace",
                    transition: "color 0.2s",
                    flex: 1,
                    minWidth: 0,
                    animation: isActive ? "aqSlideRight 0.3s ease forwards" : "none",
                  }}
                >
                  {step.name}
                </span>

                <span
                  style={{
                    fontSize: "0.75rem",
                    color: isActive ? "#d97706" : "#cbd5e1",
                    fontWeight: 700,
                    transition: "color 0.2s",
                    flexShrink: 0,
                  }}
                >
                  {step.role}
                </span>

                {isDone && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "#16a34a",
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.22)",
                      borderRadius: 4,
                      padding: "2px 6px",
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      marginLeft: 4,
                      flexShrink: 0,
                      animation: "aqPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                    }}
                  >
                    DONE
                  </span>
                )}
                {isError && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "#ef4444",
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.22)",
                      borderRadius: 4,
                      padding: "2px 6px",
                      fontWeight: 800,
                      marginLeft: 4,
                      flexShrink: 0,
                      animation: "aqPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                    }}
                  >
                    FAILED
                  </span>
                )}
              </div>

              {/* reasoning block — only active agent */}
              {isActive && (
                <div
                  style={{
                    marginTop: 8,
                    marginLeft: 38,
                    padding: "10px 14px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    borderRadius: 10,
                    animation: "aqSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                    transformOrigin: "top center",
                  }}
                >
                  {/* current line with typewriter cursor */}
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#475569",
                      fontStyle: "italic",
                      lineHeight: 1.55,
                    }}
                  >
                    <span style={{ color: "#d97706", fontStyle: "normal", fontWeight: 800 }}>
                      Reasoning ·{" "}
                    </span>
                    {typedLine}
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: "0.8em",
                        background: "#f59e0b",
                        marginLeft: 3,
                        verticalAlign: "middle",
                        animation: "aqBlink 0.65s step-end infinite",
                      }}
                    />
                  </div>

                  {/* previously completed lines (faded history) */}
                  {thinkingLineIdx > 0 && (
                    <div
                      style={{
                        marginTop: 6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {step.thinkingLines.slice(0, thinkingLineIdx).map((line, li) => (
                        <div
                          key={li}
                          style={{
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                            fontStyle: "italic",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            animation: "aqFadeIn 0.3s ease forwards",
                          }}
                        >
                          <CheckCircle2 size={12} color="#4ade80" />
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Error footer ── */}
      {phase === "error" && error && (
        <div
          style={{
            flexShrink: 0,
            margin: "0 14px 14px",
            padding: "14px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderLeft: "4px solid #ef4444",
            borderRadius: 10,
            animation: "aqSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          <p style={{ margin: "0 0 4px", fontSize: "0.85rem", fontWeight: 800, color: "#dc2626" }}>
            Pipeline failed
          </p>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: "0.75rem",
              color: "#991b1b",
              lineHeight: 1.5,
            }}
          >
            {error}
          </p>
          {onDismissError && (
            <button
              onClick={onDismissError}
              style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: 8,
                color: "#dc2626",
                fontSize: "0.8rem",
                fontWeight: 800,
                padding: "6px 16px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#fca5a5";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2";
              }}
            >
              ← Back to form
            </button>
          )}
        </div>
      )}

      {/* ── Done footer ── */}
      {phase === "done" && (
        <div
          style={{
            flexShrink: 0,
            margin: "0 14px 14px",
            padding: "14px 16px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "aqSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          <CheckCircle2 size={20} color="#16a34a" />
          <div>
            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 800, color: "#16a34a" }}>
              All agents complete
            </p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#15803d" }}>
              Navigating to Project Intelligence...
            </p>
          </div>
        </div>
      )}

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes aqFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aqSlideDown {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes aqSlideRight {
          from { transform: translateX(-4px); }
          to   { transform: translateX(0); }
        }
        @keyframes aqPopIn {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes aqPulseBg {
          0%, 100% { background: rgba(254,252,232, 0.4); }
          50%      { background: rgba(254,252,232, 1); }
        }
        @keyframes progressStripes {
          from { background-position: 40px 0; }
          to   { background-position: 0 0; }
        }
        @keyframes aqBounceIcon {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-2px); }
        }
        @keyframes aqBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes aqDot {
          0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
          40%           { transform: scale(1);   opacity: 1;   }
        }
        @keyframes aqOrbPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.55; transform: scale(0.82); }
        }
        @keyframes aqOrbRipple {
          0%   { opacity: 0.55; transform: scale(0.5); }
          100% { opacity: 0;    transform: scale(2.4); }
        }
      `}</style>
    </div>
  );
}

/* ─── Animated dots ─── */
function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#f59e0b",
            animation: `aqDot 1.15s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Pulsing orb ─── */
function PulsingOrb({ phase }: { phase: LoaderPhase }) {
  const color =
    phase === "error" ? "#ef4444" :
      phase === "done" ? "#22c55e" :
        "#f59e0b";

  return (
    <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: color,
          animation: phase === "done" ? "none" : "aqOrbPulse 1.3s ease-in-out infinite",
          transition: "background 0.3s",
        }}
      />
      {phase !== "done" && (
        <div
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            background: color,
            opacity: 0.2,
            animation: "aqOrbRipple 1.3s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}
