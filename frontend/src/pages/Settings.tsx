import { Settings as SettingsIcon, Lock, Bell, CheckCircle, ShieldAlert } from "lucide-react";

export default function Settings() {
  const hasApiKey = true;

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <SettingsIcon className="w-5 h-5" style={{ color: "var(--blue-primary)" }} />
          Workspace Alpha Settings
        </h2>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Configure core ConstructaIQ AI parameters and automated auditing logs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <Lock className="w-4 h-4" style={{ color: "var(--blue-primary)" }} />
            Construct-Model Credentials
          </h3>
          <div className="p-4 space-y-3.5" style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12 }}>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Gemini AI Model</span>
              <span className="font-mono text-[10px]" style={{ color: "var(--text-secondary)", background: "var(--card)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 6 }}>
                gemini-3.5-flash
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>API Credentials</span>
              {hasApiKey ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />Active Secrets Panel
                </span>
              ) : (
                <span className="font-bold flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  <ShieldAlert className="w-4 h-4" />Standard Fallback
                </span>
              )}
            </div>
            <div className="text-[10px] p-3 leading-normal" style={{ background: "var(--blue-bg)", color: "var(--text-primary)", borderRadius: 12 }}>
              <strong>Security Protocol</strong>: The active Gemini API Key is evaluated and resolved only on the secure node container. It remains hidden from client frames.
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <Bell className="w-4 h-4" style={{ color: "var(--blue-primary)" }} />
            Site Alert Handlers
          </h3>
          <div className="space-y-3">
            {[
              { label: "Critical Weather Crane Stop", desc: "Send alerts if wind levels surge past 25mph", checked: true },
              { label: "Automatic Zoning Code Push", desc: "Submit elevations to municipal Stage 1 queues instantly", checked: true },
              { label: "Lumber Price Index Hedge Alerts", desc: "Notify SupplierAgent if material quotes exceed 4% indexes", checked: false },
            ].map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 text-xs" style={{ border: "1px solid var(--border)", borderRadius: 12, background: "#f0f2f5" }}>
                <div>
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>{alert.label}</span>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{alert.desc}</p>
                </div>
                <input type="checkbox" defaultChecked={alert.checked} className="w-4 h-4" style={{ accentColor: "var(--blue-primary)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
