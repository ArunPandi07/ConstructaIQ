import { useState } from "react";
import { Calendar, Clock, CheckCircle2, AlertTriangle, Activity } from "lucide-react";

interface ScheduleItem {
  id: string; phase: string; subTask: string; span: string;
  progress: number; critical: boolean; division: string; icon: string;
}

const initialSchedule: ScheduleItem[] = [
  { id: "sch-1", phase: "Phase 1: Grading & Compact", subTask: "Geotechnical core excavations", span: "June 2 - June 10", progress: 100, critical: true, division: "Zoning / Core Land", icon: "🚜" },
  { id: "sch-2", phase: "Phase 2: Foundations Excavation", subTask: "C40 cement grading bases layer", span: "June 11 - June 18", progress: 40, critical: true, division: "Foundations Base", icon: "🏗️" },
  { id: "sch-3", phase: "Phase 3: Framing Erect", subTask: "ASTM A992 structural steel girders erection", span: "June 19 - June 30", progress: 10, critical: true, division: "Structural Framing", icon: "🔩" },
  { id: "sch-4", phase: "Phase 4: Cladding & Roofing", subTask: "Double-face high density thermal panels", span: "July 1 - July 14", progress: 0, critical: false, division: "Enclosure Envelope", icon: "🏠" },
  { id: "sch-5", phase: "Phase 5: MEP Rough-Ins", subTask: "HVAC risers and high-amperage feeds", span: "July 15 - July 30", progress: 0, critical: false, division: "Mechanical Systems", icon: "⚡" },
];

export default function Schedule() {
  const [schedule] = useState<ScheduleItem[]>(initialSchedule);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const displayedList = showCriticalOnly ? schedule.filter((s) => s.critical) : schedule;

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Calendar className="w-5 h-5" style={{ color: "var(--blue-primary)" }} />
            Site Mobilization Gantt Timeline
          </h2>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Autonomous Gantt scheduling reconciled daily against ready-mix freight holds</p>
        </div>
        <div className="flex text-xs" style={{ background: "var(--bg3)", padding: 2, borderRadius: 8, border: "1px solid var(--border)" }}>
          <button onClick={() => setShowCriticalOnly(false)}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${!showCriticalOnly ? "shadow-xs" : ""}`}
            style={!showCriticalOnly ? { background: "var(--card)", color: "var(--text-primary)" } : { color: "var(--text-secondary)" }}>All Work Phases</button>
          <button onClick={() => setShowCriticalOnly(true)}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${showCriticalOnly ? "shadow-xs" : ""}`}
            style={showCriticalOnly ? { background: "var(--card)", color: "var(--blue-primary)" } : { color: "var(--text-secondary)" }}>🚧 Critical Path Only</button>
        </div>
      </div>

      <div className="space-y-4">
        {displayedList.map((item) => (
          <div key={item.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition" style={{ border: "1px solid var(--border)", background: "var(--card)", borderRadius: 12 }}>
            <div className="flex items-center gap-3.5 max-w-sm w-full">
              <span className="text-xl p-2.5" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-sm)" }}>{item.icon}</span>
              <div>
                <span className="text-[9px] font-bold tracking-widest uppercase font-mono block" style={{ color: "var(--blue-primary)" }}>
                  {item.division} {item.critical && "· CRITICAL PATH"}
                </span>
                <h4 className="text-sm font-black tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>{item.phase}</h4>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{item.subTask}</p>
              </div>
            </div>

            <div className="flex-1 w-full max-w-md">
              <div className="flex justify-between items-center text-[10px] mb-1">
                <span className="font-mono font-medium flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                  <Clock className="w-3.5 h-3.5" style={{ color: "var(--blue-primary)" }} />{item.span}
                </span>
                <span className="font-bold font-mono" style={{ color: "var(--text-primary)" }}>{item.progress}% Completed</span>
              </div>
              <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                <div className="h-2 bg-[#F5C518] rounded-full" style={{ width: `${item.progress}%` }}></div>
              </div>
            </div>

            <div className="self-end md:self-auto shrink-0 pl-1.5">
              {item.progress === 100 ? (
                <span className="status-badge" style={{ background: "var(--green-bg)", color: "var(--green-primary)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" />VERIFIED DONE
                </span>
              ) : item.progress > 0 ? (
                <span className="status-badge animate-pulse" style={{ background: "var(--blue-bg)", color: "var(--blue-primary)" }}>
                  <Activity className="w-3.5 h-3.5" />ACTIVE BUILD
                </span>
              ) : (
                <span className="status-badge" style={{ background: "var(--bg3)", color: "var(--text-muted)" }}>STAGED QUEUE</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 flex gap-3" style={{ background: "#f0f2f5", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-primary)" }}>
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--blue-primary)" }} />
        <div className="text-xs">
          <span className="font-bold" style={{ color: "var(--text-primary)" }}>🚨 Autonomous Scheduling Safeguard Activated:</span>
          <p className="mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Ready-mix cement pouring scheduling checks detect rain forecast in division 4 area around June 14. ScheduleAgent has pre-scheduled mechanical delivery delays by 48 hrs.
          </p>
        </div>
      </div>
    </div>
  );
}
