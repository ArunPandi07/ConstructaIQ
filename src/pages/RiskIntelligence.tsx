/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ChevronDown, ChevronUp, ArrowDown, TrendingUp, Info, Zap, ArrowRight } from "lucide-react";
import Badge from "../components/Badge";
import { RiskCardSkeleton, CardSkeleton, ErrorState, Skeleton } from "../components/Skeleton";
import { useRiskIntelligence } from "../hooks/usePageData";
import { useAppContext } from "../context/AppContext";
import type { RiskFactor } from "../types";

const heatColors = ["#0d2818","#163a26","#1a4f1a","#854f0b","#7a3a0d","#8a2020","#7f1d1d","#6b1515","#4a0f0f"];
const getHeatColor = (v: number) => heatColors[Math.min(v - 1, heatColors.length - 1)];
const getHeatText  = (v: number) => v >= 7 ? "rgba(255,200,200,0.9)" : "rgba(150,230,150,0.7)";
const catBadge = (c: string) => (({ Regulatory: "red", "Supply Chain": "orange", Workforce: "yellow", Design: "purple" } as any)[c] ?? "blue");
const riskStyle = (s: number) =>
  s >= 80 ? { color: "var(--red-primary)",    bg: "var(--red-bg)",    border: "var(--red-border)"    } :
  s >= 60 ? { color: "var(--orange-primary)", bg: "var(--orange-bg)", border: "var(--orange-border)" } :
  s >= 40 ? { color: "#eab308",               bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)" } :
            { color: "var(--green-primary)",  bg: "var(--green-bg)",  border: "var(--green-border)"  };

export default function RiskIntelligence() {
  const navigate = useNavigate();
  const { activeProjectId } = useAppContext();
  const { data, loading, error, refetch } = useRiskIntelligence(activeProjectId);
  const [expandedRisk, setExpandedRisk] = useState<number | null>(0);
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  const ss = data ? riskStyle(data.overallScore) : riskStyle(82);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Risk Intelligence</h2>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 3 }}>AI-powered risk identification, quantification, and reasoning</p>
        </div>
        {loading ? <Skeleton style={{ width: 110, height: 24 }} rounded="full" /> : data && (
          <Badge variant="red" dot pulse>{data.overallScore}/100 Critical</Badge>
        )}
      </div>

      {/* Top row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Score gauge */}
        {loading ? <CardSkeleton lines={4} /> : data && (
          <div className="glass-card p-5 flex flex-col items-center text-center" style={{ borderColor: ss.border }}>
            <div className="section-label" style={{ marginBottom: 14 }}>Overall Project Risk Score</div>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <svg width={120} height={120} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={60} cy={60} r={48} fill="none" stroke="var(--bg3)" strokeWidth={10} />
                <circle cx={60} cy={60} r={48} fill="none" stroke={ss.color} strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 48 * (data.overallScore / 100)} ${2 * Math.PI * 48}`}
                  style={{ filter: `drop-shadow(0 0 8px ${ss.color}50)` }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "1.9rem", fontWeight: 800, color: ss.color, letterSpacing: "-1px" }}>{data.overallScore}</span>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>/100</span>
              </div>
            </div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: ss.color, marginBottom: 4 }}>Critical Risk Level</div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: 14 }}>Trend: ↑ Increasing — Action required</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, width: "100%", marginBottom: 14 }}>
              {[{ l:"Critical",n:7,c:"var(--red-primary)",b:"var(--red-bg)",bd:"var(--red-border)" },
                { l:"High",n:12,c:"var(--orange-primary)",b:"var(--orange-bg)",bd:"var(--orange-border)" },
                { l:"Medium",n:24,c:"#eab308",b:"rgba(234,179,8,0.1)",bd:"rgba(234,179,8,0.2)" }].map(x => (
                <div key={x.l} style={{ background: x.b, border: `1px solid ${x.bd}`, borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: x.c }}>{x.n}</div>
                  <div style={{ fontSize: "0.6rem", color: x.c, marginTop: 1 }}>{x.l}</div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/recovery")}
              style={{ width: "100%", padding: "8px", borderRadius: 8, background: "var(--amber)", color: "#000", border: "none", fontSize: "0.76rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              View Recovery Plans <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* Heatmap */}
        {loading ? <CardSkeleton lines={5} /> : data && (
          <div className="glass-card p-5">
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--text-primary)" }}>Risk Heatmap</h3>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>Probability × Impact matrix</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingBlock: 10, width: 44 }}>
                {["V.High","High","Med","Low","V.Low"].map(l => (
                  <div key={l} style={{ textAlign: "right", fontSize: "0.6rem", color: "var(--text-muted)" }}>{l}</div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gridTemplateRows: "repeat(5,1fr)", gap: 4 }}>
                  {data.heatmap.map((row, ri) => row.map((val, ci) => (
                    <div key={`${ri}-${ci}`} className="heatmap-cell" style={{ background: getHeatColor(val), minHeight: 34, color: getHeatText(val) }} title={`Risk: ${val}`}>
                      {val >= 7 && <span style={{ fontSize: "0.55rem", fontWeight: 700 }}>{val}</span>}
                    </div>
                  )))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", marginTop: 4 }}>
                  {["V.Low","Low","Med","High","V.High"].map(l => (
                    <div key={l} style={{ textAlign: "center", fontSize: "0.6rem", color: "var(--text-muted)" }}>{l}</div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
              {[["#22c55e","#163a26","Low"],["#eab308","#854f0b","Medium"],["#ef4444","#7f1d1d","High"]].map(([c,b,l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: b, border: `1px solid ${c}30` }} />
                  <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning chain */}
        {loading ? <CardSkeleton lines={8} /> : data && (
          <div className="glass-card p-5">
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--text-primary)" }}>AI Reasoning Chain</h3>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>Causal risk propagation analysis</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {data.reasoningChain.map((node, i) => (
                <div key={i}>
                  <div className="chain-node" style={{ borderColor: `${node.color}25`, background: `${node.color}06` }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: `${node.color}14`, border: `1px solid ${node.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, color: node.color }}>{i + 1}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.76rem", fontWeight: 600, color: node.color }}>{node.event}</div>
                      <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", marginTop: 2 }}>{node.description}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <TrendingUp size={9} style={{ color: node.color }} />
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, color: node.color }}>{node.confidence}%</span>
                    </div>
                  </div>
                  {i < data.reasoningChain.length - 1 && (
                    <div className="chain-arrow"><ArrowDown size={12} /></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Risks */}
      <div className="glass-card p-5">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <ShieldAlert size={14} style={{ color: "var(--red-primary)" }} />
          <h3 style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--text-primary)" }}>Top Risk Factors</h3>
          {!loading && data && <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--text-muted)" }}>{data.topRisks.length} identified risks</span>}
        </div>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <RiskCardSkeleton key={i} />)}</div>
        ) : data && (
          <div className="space-y-2">
            {data.topRisks.map((risk: RiskFactor) => {
              const isExp = expandedRisk === risk.id;
              const rs = riskStyle(risk.score);
              return (
                <div key={risk.id} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${isExp ? rs.border : "var(--border)"}`, background: isExp ? rs.bg : "var(--bg3)", transition: "all 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: "pointer" }} onClick={() => setExpandedRisk(isExp ? null : risk.id)}>
                    <div style={{ width: 40, height: 40, borderRadius: 9, background: rs.bg, border: `1px solid ${rs.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.95rem", fontWeight: 800, color: rs.color }}>{risk.score}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{risk.name}</span>
                        <Badge variant={catBadge(risk.category)}>{risk.category}</Badge>
                        <Badge variant="gray" size="sm">P: {risk.probability}</Badge>
                        <Badge variant={risk.impact === "Critical" ? "red" : "orange"} size="sm">I: {risk.impact}</Badge>
                      </div>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{risk.description}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <div className="progress-bar" style={{ width: 60, height: 4 }}>
                        <div className="progress-fill" style={{ width: `${risk.score}%`, background: `linear-gradient(90deg,${rs.color}60,${rs.color})` }} />
                      </div>
                      {isExp ? <ChevronUp size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />}
                    </div>
                  </div>
                  {isExp && (
                    <div style={{ padding: "0 14px 14px" }}>
                      <div style={{ borderTop: `1px solid ${rs.border}`, paddingTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                            <Info size={11} style={{ color: "var(--amber)" }} />
                            <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--text-primary)" }}>Risk Factors</span>
                          </div>
                          {risk.details.map((d, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 5 }}>
                              <div style={{ width: 4, height: 4, borderRadius: "50%", background: rs.color, marginTop: 5, flexShrink: 0 }} />
                              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{d}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 10, padding: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                            <Zap size={11} style={{ color: "var(--green-primary)" }} />
                            <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--green-primary)" }}>AI Mitigation</span>
                          </div>
                          <p style={{ fontSize: "0.72rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>{risk.mitigation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
