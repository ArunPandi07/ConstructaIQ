import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  ShieldCheck,
  Star,
  Zap,
  Brain,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import Badge from "../components/Badge";
import {
  StrategyCardSkeleton,
  CardSkeleton,
  ErrorState,
} from "../components/Skeleton";
import { useAsync } from "../hooks/useAsync";
import {
  fetchRecoveryStrategies,
  activateRecoveryStrategy,
} from "../services/api";
import { useAppContext } from "../context/AppContext";
import type { RecoveryStrategy } from "../types";
import type { RecoveryCenterData } from "../services/api";

// Extended strategy shape used by this page (adds fields mapped in api.ts)
type PageStrategy = RecoveryStrategy & {
  risk: string;
  confidence: number;
  cost: string;
  scheduleImpact: string;
  steps: string[];
};

export default function RecoveryCenter() {
  const navigate = useNavigate();
  const { activeProjectId } = useAppContext();
  const { data, loading, error, refetch } = useAsync<RecoveryCenterData>(
    () =>
      fetchRecoveryStrategies() as Promise<{ data: RecoveryCenterData }>,
      // activeProjectId
    [activeProjectId],
  );
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>("A");
  const [activating, setActivating] = useState<string | null>(null);
  const [activated, setActivated] = useState<string | null>(null);
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const handleActivate = async (strategyId: string) => {
    setActivating(strategyId);
    try {
      await activateRecoveryStrategy();
      // activeProjectId, strategyId
      setActivated(strategyId);
    } finally {
      setActivating(null);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Recovery Center
          </h2>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              marginTop: 3,
            }}
          >
            AI-generated recovery strategies · Tower A — Downtown Core
          </p>
        </div>
        <button
          onClick={() => navigate("/risk")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            color: "var(--amber)",
            fontSize: "0.76rem",
            fontWeight: 600,
            background: "var(--amber-bg)",
            border: "1px solid var(--amber-border)",
            borderRadius: 8,
            padding: "6px 12px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <ArrowRight size={12} /> View Risk Analysis
        </button>
      </div>

      {!loading && data && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
            marginBottom: 4,
          }}
        >
          {[
            {
              icon: ShieldCheck,
              label: "Risk Score",
              value: `${data.riskScore}/100`,
              color: "var(--red-primary)",
              bg: "var(--red-bg)",
              border: "var(--red-border)",
            },
            {
              icon: Star,
              label: "Strategies Generated",
              value: data.strategies.length,
              color: "var(--amber)",
              bg: "var(--amber-bg)",
              border: "var(--amber-border)",
            },
            {
              icon: Brain,
              label: "AI Confidence",
              value: `${data.aiConfidence}%`,
              color: "var(--green-primary)",
              bg: "var(--green-bg)",
              border: "var(--green-border)",
            },
          ].map(({ icon: Icon, label, value, color, bg, border }) => (
            <div
              key={label}
              style={{
                background: "var(--card)",
                border: `1px solid ${border}`,
                borderRadius: 10,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color,
                    letterSpacing: "-0.5px",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    marginTop: 3,
                  }}
                >
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StrategyCardSkeleton key={i} />
          ))}
          <CardSkeleton lines={2} />
        </div>
      ) : (
        data && (
          <div className="space-y-3">
            {(data.strategies as PageStrategy[]).map((strategy) => {
              const isExpanded = expandedStrategy === strategy.id;
              const isRecommended = strategy.id === "A";
              const isActivated = activated === strategy.id;
              const isActivating = activating === strategy.id;
              return (
                <div
                  key={strategy.id}
                  className={`strategy-card ${isRecommended ? "recommended" : ""}`}
                  onClick={() =>
                    setExpandedStrategy(isExpanded ? null : strategy.id)
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        {isRecommended && (
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              color: "var(--amber)",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            ★ AI Recommended
                          </span>
                        )}
                        <Badge
                          variant={
                            strategy.risk === "Low"
                              ? "green"
                              : strategy.risk === "Medium"
                                ? "yellow"
                                : "orange"
                          }
                          size="sm"
                        >
                          {strategy.risk} Risk
                        </Badge>
                        <Badge variant="gray" size="sm">
                          {strategy.confidence}% confidence
                        </Badge>
                      </div>
                      <div
                        style={{
                          fontSize: "0.86rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          marginBottom: 5,
                        }}
                      >
                        Strategy {strategy.id}: {strategy.name}
                      </div>
                      <p
                        style={{
                          fontSize: "0.76rem",
                          color: "var(--text-secondary)",
                          lineHeight: 1.55,
                        }}
                      >
                        {strategy.description}
                      </p>
                    </div>
                    <div style={{ flexShrink: 0, color: "var(--text-muted)" }}>
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        borderTop: "1px solid var(--border)",
                        marginTop: 14,
                        paddingTop: 14,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3,1fr)",
                          gap: 10,
                          marginBottom: 14,
                        }}
                      >
                        {[
                          {
                            label: "Time Saved",
                            value: strategy.timeSaved,
                            color: "var(--green-primary)",
                          },
                          {
                            label: "Cost",
                            value: strategy.cost,
                            color: "var(--amber)",
                          },
                          {
                            label: "Schedule Impact",
                            value: strategy.scheduleImpact,
                            color: "var(--blue-primary)",
                          },
                        ].map(({ label, value, color }) => (
                          <div
                            key={label}
                            style={{
                              background: "var(--bg3)",
                              borderRadius: 8,
                              padding: "10px 12px",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "1rem",
                                fontWeight: 700,
                                color,
                                letterSpacing: "-0.3px",
                              }}
                            >
                              {value}
                            </div>
                            <div
                              style={{
                                fontSize: "0.62rem",
                                color: "var(--text-muted)",
                                marginTop: 3,
                              }}
                            >
                              {label}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <div
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            marginBottom: 8,
                          }}
                        >
                          Implementation Steps
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {strategy.steps.map((step, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 5,
                                  background: "var(--amber-bg)",
                                  border: "1px solid var(--amber-border)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  marginTop: 1,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.6rem",
                                    fontWeight: 700,
                                    color: "var(--amber)",
                                  }}
                                >
                                  {i + 1}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "0.76rem",
                                  color: "var(--text-secondary)",
                                  lineHeight: 1.5,
                                }}
                              >
                                {step}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          !isActivated && handleActivate(strategy.id)
                        }
                        disabled={isActivated || !!activating}
                        style={{
                          width: "100%",
                          padding: "9px",
                          borderRadius: 8,
                          border: "none",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: isActivated ? "default" : "pointer",
                          fontFamily: "inherit",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          transition: "all 0.2s",
                          background: isActivated
                            ? "var(--green-bg)"
                            : "var(--green-primary)",
                          color: isActivated ? "var(--green-primary)" : "#000",
                          ...(isActivated
                            ? { border: "1px solid var(--green-border)" }
                            : {}),
                        }}
                      >
                        {isActivating ? (
                          <>
                            <Loader2
                              size={13}
                              style={{ animation: "spin 1s linear infinite" }}
                            />{" "}
                            Activating…
                          </>
                        ) : isActivated ? (
                          <>
                            <CheckCircle size={13} /> Strategy Activated
                          </>
                        ) : (
                          <>
                            <Zap size={13} /> Activate This Strategy
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
