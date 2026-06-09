import React, { useState } from "react";
import {
  User,
  Bell,
  Lock,
  Bot,
  Building2,
  Plug,
  Palette,
  Languages,
  Camera,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  CheckCircle2,
  RefreshCw,
  DollarSign,
  GitBranch,
  FileText,
  Users,
  ShieldCheck,
  Calendar,
  Copy,
  RotateCcw,
} from "lucide-react";
import { allProjects } from "../data/mockData";

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey =
  | "profile"
  | "notifications"
  | "security"
  | "agents"
  | "projects"
  | "integrations"
  | "appearance"
  | "language";

interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Toggle({ value, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: value ? "var(--green-primary)" : "var(--border2)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.18s",
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: value ? 19 : 3,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "var(--card)",
          transition: "left 0.18s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
        }}
      />
    </button>
  );
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card" style={{ padding: "18px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function FormRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <label
        style={{
          display: "block",
          fontSize: "0.72rem",
          fontWeight: 500,
          color: "var(--text-secondary)",
          marginBottom: 5,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 34,
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "0 10px",
  fontSize: "0.78rem",
  color: "var(--text-primary)",
  background: "var(--bg3)",
  outline: "none",
  fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  paddingRight: 8,
};

function SaveBtn({
  onClick,
  saved,
}: {
  onClick: () => void;
  saved?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 16px",
        background: saved ? "#dcfce7" : "var(--green-primary)",
        color: saved ? "#15803d" : "#fff",
        border: saved ? "1px solid var(--green-border)" : "none",
        borderRadius: 6,
        fontSize: "0.72rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.18s",
        display: "flex",
        alignItems: "center",
        gap: 5,
        whiteSpace: "nowrap",
      }}
    >
      {saved ? (
        <>
          <CheckCircle2 size={12} /> Saved!
        </>
      ) : (
        "Save changes"
      )}
    </button>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "9px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div>
        <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-primary)" }}>
          {label}
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
          {sub}
        </div>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const [form, setForm] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@constructaiq.com",
    phone: "+91 98765 43210",
    role: "Project Manager",
    department: "Civil Engineering",
    org: "Downtown Development Corp",
    bio: "Experienced PM with 12+ years in large-scale construction projects.",
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard
        title="Profile Information"
        subtitle="Update your personal details and contact info"
        action={<SaveBtn onClick={handleSave} saved={saved} />}
      >
        {/* Avatar row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 18,
            paddingBottom: 18,
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--green-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {form.firstName[0]}{form.lastName[0]}
          </div>
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {form.firstName} {form.lastName}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
              {form.role} · Admin
            </div>
            <button
              style={{
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                border: "1px solid var(--border)",
                borderRadius: 5,
                fontSize: "0.7rem",
                color: "var(--text-secondary)",
                background: "var(--card)",
                cursor: "pointer",
              }}
            >
              <Camera size={11} /> Change photo
            </button>
          </div>
        </div>

        <FormRow>
          <Field label="First name">
            <input
              style={inputStyle}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </Field>
          <Field label="Last name">
            <input
              style={inputStyle}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Email address">
            <input
              style={inputStyle}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Phone number">
            <input
              style={inputStyle}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Role">
            <select
              style={selectStyle}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option>Project Manager</option>
              <option>Site Engineer</option>
              <option>Quantity Surveyor</option>
              <option>Architect</option>
              <option>Admin</option>
            </select>
          </Field>
          <Field label="Department">
            <input
              style={inputStyle}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </Field>
        </FormRow>
        <div style={{ marginBottom: 12 }}>
          <Field label="Organization" full>
            <input
              style={inputStyle}
              value={form.org}
              onChange={(e) => setForm({ ...form, org: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Bio" full>
          <textarea
            style={{
              ...inputStyle,
              height: 68,
              resize: "vertical",
              padding: "8px 10px",
              lineHeight: 1.5,
            }}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </Field>
      </SectionCard>
    </div>
  );
}

function NotificationsTab() {
  const [alerts, setAlerts] = useState({
    risk: true,
    agentTask: true,
    milestoneDelay: false,
    budgetOverrun: true,
    permitStatus: true,
    crewChanges: false,
    changeImpact: true,
    recoveryPlan: false,
  });
  const [channels, setChannels] = useState({
    inApp: true,
    email: true,
    sms: false,
    slack: false,
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard
        title="Alert Preferences"
        subtitle="Choose what notifications you receive"
        action={<SaveBtn onClick={handleSave} saved={saved} />}
      >
        <ToggleRow label="Risk score alerts" sub="Notify when project risk exceeds 75%" value={alerts.risk} onChange={(v) => setAlerts({ ...alerts, risk: v })} />
        <ToggleRow label="Agent task completion" sub="Updates when AI agents complete assigned tasks" value={alerts.agentTask} onChange={(v) => setAlerts({ ...alerts, agentTask: v })} />
        <ToggleRow label="Milestone delays" sub="Alerts when any milestone slips beyond 3 days" value={alerts.milestoneDelay} onChange={(v) => setAlerts({ ...alerts, milestoneDelay: v })} />
        <ToggleRow label="Budget overruns" sub="Alert when spend exceeds approved budget threshold" value={alerts.budgetOverrun} onChange={(v) => setAlerts({ ...alerts, budgetOverrun: v })} />
        <ToggleRow label="Permit status updates" sub="Notify on permit approval or rejection" value={alerts.permitStatus} onChange={(v) => setAlerts({ ...alerts, permitStatus: v })} />
        <ToggleRow label="Crew availability changes" sub="When crew assignments are updated or removed" value={alerts.crewChanges} onChange={(v) => setAlerts({ ...alerts, crewChanges: v })} />
        <ToggleRow label="Change impact alerts" sub="Downstream effects detected by Change Impact agent" value={alerts.changeImpact} onChange={(v) => setAlerts({ ...alerts, changeImpact: v })} />
        <div style={{ borderBottom: "none" }}>
          <ToggleRow label="Recovery plan updates" sub="When Recovery Center generates new strategies" value={alerts.recoveryPlan} onChange={(v) => setAlerts({ ...alerts, recoveryPlan: v })} />
        </div>
      </SectionCard>

      <SectionCard title="Delivery Channels" subtitle="How you want to receive notifications">
        <ToggleRow label="In-app notifications" sub="Show alerts inside ConstructaIQ dashboard" value={channels.inApp} onChange={(v) => setChannels({ ...channels, inApp: v })} />
        <ToggleRow label="Email notifications" sub="Send daily digest to john@constructaiq.com" value={channels.email} onChange={(v) => setChannels({ ...channels, email: v })} />
        <ToggleRow label="SMS alerts" sub="Critical alerts only via SMS to registered mobile" value={channels.sms} onChange={(v) => setChannels({ ...channels, sms: v })} />
        <div style={{ borderBottom: "none" }}>
          <ToggleRow label="Slack integration" sub="Push notifications to #constructaiq channel" value={channels.slack} onChange={(v) => setChannels({ ...channels, slack: v })} />
        </div>
      </SectionCard>
    </div>
  );
}

function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const [twoFA, setTwoFA] = useState({ totp: true, sms: false, loginAlert: true });

  function handlePasswordSave() {
    if (!passwords.current) { setPwError("Enter your current password."); return; }
    if (passwords.newPass.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (passwords.newPass !== passwords.confirm) { setPwError("Passwords do not match."); return; }
    setPwError("");
    setPwSaved(true);
    setPasswords({ current: "", newPass: "", confirm: "" });
    setTimeout(() => setPwSaved(false), 2500);
  }

  const sessions = [
    { device: "MacBook Pro — Chrome", location: "Chennai, IN", time: "Just now", current: true },
    { device: "iPhone 15 — Safari", location: "Chennai, IN", time: "2h ago", current: false },
    { device: "Windows PC — Edge", location: "Mumbai, IN", time: "3d ago", current: false },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard
        title="Change Password"
        subtitle="Use a strong password with 8+ characters"
        action={<SaveBtn onClick={handlePasswordSave} saved={pwSaved} />}
      >
        {pwError && (
          <div
            style={{
              marginBottom: 10,
              padding: "8px 12px",
              background: "var(--red-bg)",
              border: "1px solid var(--red-border)",
              borderRadius: 6,
              fontSize: "0.72rem",
              color: "var(--red-primary)",
            }}
          >
            {pwError}
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <Field label="Current password" full>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingRight: 34 }}
                type={showCurrent ? "text" : "password"}
                value={passwords.current}
                placeholder="Enter current password"
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
              >
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
        </div>
        <FormRow>
          <Field label="New password">
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingRight: 34 }}
                type={showNew ? "text" : "password"}
                value={passwords.newPass}
                placeholder="Min 8 characters"
                onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <Field label="Confirm new password">
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingRight: 34 }}
                type={showConfirm ? "text" : "password"}
                value={passwords.confirm}
                placeholder="Re-enter password"
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
        </FormRow>
      </SectionCard>

      <SectionCard title="Two-Factor Authentication" subtitle="Add an extra layer of protection">
        <ToggleRow label="Authenticator app (TOTP)" sub="Use Google Authenticator or Authy" value={twoFA.totp} onChange={(v) => setTwoFA({ ...twoFA, totp: v })} />
        <ToggleRow label="SMS one-time password" sub="Receive OTP to your registered mobile number" value={twoFA.sms} onChange={(v) => setTwoFA({ ...twoFA, sms: v })} />
        <div style={{ borderBottom: "none" }}>
          <ToggleRow label="Login email alerts" sub="Email you on every new device login" value={twoFA.loginAlert} onChange={(v) => setTwoFA({ ...twoFA, loginAlert: v })} />
        </div>
      </SectionCard>

      <SectionCard
        title="Active Sessions"
        subtitle="Devices currently logged in to your account"
        action={
          <button style={{ padding: "5px 12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>
            Revoke all
          </button>
        }
      >
        {sessions.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 0",
              borderBottom: i < sessions.length - 1 ? "1px solid var(--border-subtle)" : "none",
            }}
          >
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-primary)" }}>{s.device}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>{s.location} · {s.time}</div>
            </div>
            {s.current ? (
              <span style={{ padding: "3px 9px", background: "var(--green-bg)", color: "#15803d", borderRadius: 20, fontSize: "0.65rem", fontWeight: 700 }}>CURRENT</span>
            ) : (
              <button style={{ padding: "4px 10px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 5, fontSize: "0.7rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                Revoke
              </button>
            )}
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

function AgentsTab() {
  const agentDefs = [
    { key: "risk", label: "Risk Intelligence Agent", desc: "Monitors risk signals in real-time · Runs every 15 min", Icon: ShieldCheck, color: "#dcfce7", iconColor: "#16a34a", defaultOn: true },
    { key: "schedule", label: "Schedule Optimizer Agent", desc: "Suggests timeline adjustments & critical path fixes", Icon: Calendar, color: "#dbeafe", iconColor: "#2563eb", defaultOn: true },
    { key: "budget", label: "Budget Tracker Agent", desc: "Tracks expenditure vs. approved budget plan", Icon: DollarSign, color: "#fef3c7", iconColor: "#d97706", defaultOn: false },
    { key: "change", label: "Change Impact Agent", desc: "Analyses downstream effects of scope changes", Icon: GitBranch, color: "#f5f3ff", iconColor: "#7c3aed", defaultOn: true },
    { key: "contract", label: "Contract Analysis Agent", desc: "Extracts obligations and key clauses from contracts", Icon: FileText, color: "#fff7ed", iconColor: "#ea580c", defaultOn: true },
    { key: "crew", label: "Crew Management Agent", desc: "Optimises crew allocation across site activities", Icon: Users, color: "#fee2e2", iconColor: "#dc2626", defaultOn: false },
    { key: "recovery", label: "Recovery Center Agent", desc: "Generates recovery strategies for at-risk projects", Icon: RefreshCw, color: "#ecfdf5", iconColor: "#059669", defaultOn: true },
  ];

  const initState = Object.fromEntries(agentDefs.map((a) => [a.key, a.defaultOn]));
  const [agentState, setAgentState] = useState<Record<string, boolean>>(initState);
  const [globalConfig, setGlobalConfig] = useState({ freq: "Every 15 minutes", threshold: "75", model: "GPT-4o (default)" });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard title="Agent Configuration" subtitle="Enable, disable, and tune each AI agent">
        {agentDefs.map(({ key, label, desc, Icon, color, iconColor }) => (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 0",
              borderBottom: key !== "recovery" ? "1px solid var(--border-subtle)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, background: color, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={14} style={{ color: iconColor }} />
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 1 }}>{desc}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                padding: "2px 8px", borderRadius: 20, fontSize: "0.65rem", fontWeight: 700,
                background: agentState[key] ? "var(--green-bg)" : "var(--border-subtle)",
                color: agentState[key] ? "#15803d" : "var(--text-muted)",
              }}>
                {agentState[key] ? "ACTIVE" : "IDLE"}
              </span>
              <Toggle value={agentState[key]} onChange={(v) => setAgentState({ ...agentState, [key]: v })} />
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="Global Agent Settings"
        subtitle="Applied to all active agents"
        action={<SaveBtn onClick={handleSave} saved={saved} />}
      >
        <FormRow>
          <Field label="Run frequency">
            <select style={selectStyle} value={globalConfig.freq} onChange={(e) => setGlobalConfig({ ...globalConfig, freq: e.target.value })}>
              <option>Every 15 minutes</option>
              <option>Every 30 minutes</option>
              <option>Every hour</option>
              <option>Manual only</option>
            </select>
          </Field>
          <Field label="Risk threshold alert (%)">
            <input style={inputStyle} type="number" min={1} max={100} value={globalConfig.threshold} onChange={(e) => setGlobalConfig({ ...globalConfig, threshold: e.target.value })} />
          </Field>
        </FormRow>
        <Field label="AI Model" full>
          <select style={selectStyle} value={globalConfig.model} onChange={(e) => setGlobalConfig({ ...globalConfig, model: e.target.value })}>
            <option>GPT-4o (default)</option>
            <option>GPT-4 Turbo</option>
            <option>Claude Sonnet 4</option>
          </select>
        </Field>
      </SectionCard>
    </div>
  );
}

function ProjectsTab() {
  const statusMap: Record<string, { label: string; bg: string; color: string }> = {
    "on-track": { label: "ON TRACK", bg: "#dcfce7", color: "#15803d" },
    "at-risk": { label: "HIGH RISK", bg: "#fee2e2", color: "#dc2626" },
    delayed: { label: "DELAYED", bg: "#fef3c7", color: "#d97706" },
    planning: { label: "PLANNING", bg: "#dbeafe", color: "#1d4ed8" },
  };

  const [activeProject, setActiveProject] = useState("tower-a");
  const [defaults, setDefaults] = useState({ currency: "INR (₹)", budgetAlert: "80% of budget", timeUnit: "Days", riskRecalc: "Every 15 min" });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard title="Project List" subtitle="Manage and switch your active project">
        {allProjects.map((p) => {
          const s = statusMap[p.status];
          const isActive = p.id === activeProject;
          return (
            <div
              key={p.id}
              onClick={() => setActiveProject(p.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 6,
                cursor: "pointer",
                border: `1px solid ${isActive ? "var(--green-border)" : "var(--border)"}`,
                background: isActive ? "#f0fdf4" : "#fff",
                transition: "all 0.15s",
              }}
            >
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {p.type} · {p.duration} · Budget: {p.budget}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: "0.65rem", fontWeight: 700, background: s.bg, color: s.color }}>{s.label}</span>
                {isActive && <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: "0.65rem", fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>ACTIVE</span>}
              </div>
            </div>
          );
        })}
      </SectionCard>

      <SectionCard
        title="Default Project Settings"
        subtitle="Applied when creating new projects"
        action={<SaveBtn onClick={handleSave} saved={saved} />}
      >
        <FormRow>
          <Field label="Default currency">
            <select style={selectStyle} value={defaults.currency} onChange={(e) => setDefaults({ ...defaults, currency: e.target.value })}>
              <option>INR (₹)</option>
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>AED (د.إ)</option>
            </select>
          </Field>
          <Field label="Budget alert threshold">
            <select style={selectStyle} value={defaults.budgetAlert} onChange={(e) => setDefaults({ ...defaults, budgetAlert: e.target.value })}>
              <option>80% of budget</option>
              <option>85% of budget</option>
              <option>90% of budget</option>
              <option>95% of budget</option>
            </select>
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Default timeline unit">
            <select style={selectStyle} value={defaults.timeUnit} onChange={(e) => setDefaults({ ...defaults, timeUnit: e.target.value })}>
              <option>Days</option>
              <option>Weeks</option>
              <option>Months</option>
            </select>
          </Field>
          <Field label="Risk recalculation">
            <select style={selectStyle} value={defaults.riskRecalc} onChange={(e) => setDefaults({ ...defaults, riskRecalc: e.target.value })}>
              <option>Every 15 min</option>
              <option>Every hour</option>
              <option>Daily</option>
            </select>
          </Field>
        </FormRow>
      </SectionCard>
    </div>
  );
}

function IntegrationsTab() {
  const services = [
    { key: "gdrive", name: "Google Drive", desc: "Sync blueprints and contracts from Drive", icon: "📁", color: "#e8f5e9", defaultConn: true },
    { key: "slack", name: "Slack", desc: "Push alerts to project channels", icon: "💬", color: "#f3e5f5", defaultConn: false },
    { key: "azure", name: "Azure Blob Storage", desc: "Store and retrieve large construction files", icon: "☁️", color: "#e3f2fd", defaultConn: true },
    { key: "sendgrid", name: "SendGrid", desc: "Email delivery for reports and alerts", icon: "📧", color: "#fce4ec", defaultConn: true },
    { key: "teams", name: "Microsoft Teams", desc: "Daily summary reports to Teams channels", icon: "🟦", color: "#ede7f6", defaultConn: false },
    { key: "sheets", name: "Google Sheets", desc: "Export budget and schedule data as sheets", icon: "📊", color: "#e8f5e9", defaultConn: false },
  ];

  const initConn = Object.fromEntries(services.map((s) => [s.key, s.defaultConn]));
  const [connected, setConnected] = useState<Record<string, boolean>>(initConn);

  const [apiKeys] = useState([
    { id: "ciq_live_sk_••••••••••••4f2a", created: "12 Jan 2025", used: "Today" },
    { id: "ciq_live_sk_••••••••••••9b1c", created: "3 Mar 2025", used: "2d ago" },
  ]);
  const [copied, setCopied] = useState<number | null>(null);

  function handleCopy(i: number) {
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard title="Connected Services" subtitle="Manage third-party integrations">
        {services.map((s) => (
          <div
            key={s.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 0",
              borderBottom: s.key !== "sheets" ? "1px solid var(--border-subtle)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, background: s.color, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.88rem", flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 1 }}>{s.desc}</div>
              </div>
            </div>
            <button
              onClick={() => setConnected({ ...connected, [s.key]: !connected[s.key] })}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                fontSize: "0.72rem",
                fontWeight: 600,
                cursor: "pointer",
                border: connected[s.key] ? "1px solid var(--green-border)" : "1px solid var(--border)",
                background: connected[s.key] ? "var(--green-bg)" : "#fff",
                color: connected[s.key] ? "#15803d" : "var(--text-secondary)",
                transition: "all 0.15s",
              }}
            >
              {connected[s.key] ? "Connected" : "Connect"}
            </button>
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="API Access"
        subtitle="Manage API keys for external integrations"
        action={
          <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "var(--green-primary)", color: "#fff", border: "none", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600, cursor: "pointer" }}>
            <Plus size={12} /> Generate key
          </button>
        }
      >
        {apiKeys.map((k, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: i < apiKeys.length - 1 ? "1px solid var(--border-subtle)" : "none",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-primary)", fontWeight: 600 }}>{k.id}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>Created: {k.created} · Last used: {k.used}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => handleCopy(i)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 5, fontSize: "0.7rem", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <Copy size={10} /> {copied === i ? "Copied!" : "Copy"}
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", background: "var(--card)", border: "1px solid var(--red-border)", borderRadius: 5, fontSize: "0.7rem", color: "var(--red-primary)", cursor: "pointer" }}>
                <Trash2 size={10} /> Revoke
              </button>
            </div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

function AppearanceTab() {
  const [theme, setTheme] = useState("light");
  const [accent, setAccent] = useState("#16a34a");
  const [display, setDisplay] = useState({ sidebar: "Default (210px)", density: "Default", dateFormat: "DD/MM/YYYY", numberFormat: "1,00,000 (Indian)" });
  const [saved, setSaved] = useState(false);

  const themes = [
    { key: "light", label: "Light (default)", sub: "Green sidebar, light content", sidebar: "#1b3a2d", bg: "var(--bg)" },
    { key: "dark", label: "Dark", sub: "Full dark forest green", sidebar: "#0d2318", bg: "#0f1a14" },
    { key: "steel", label: "Steel blue", sub: "Blue sidebar, light content", sidebar: "#1e3a5f", bg: "var(--bg)" },
    { key: "mono", label: "Monochrome", sub: "Black sidebar, clean white", sidebar: "#18181b", bg: "#f9f9f9" },
  ];

  const accents = ["#16a34a", "#2563eb", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard title="Theme" subtitle="Choose your preferred interface mode">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {themes.map((t) => (
            <div
              key={t.key}
              onClick={() => setTheme(t.key)}
              style={{
                border: `2px solid ${theme === t.key ? "var(--green-primary)" : "var(--border)"}`,
                borderRadius: 8,
                padding: 10,
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ height: 50, borderRadius: 5, marginBottom: 8, overflow: "hidden", display: "flex", background: t.bg }}>
                <div style={{ width: "38%", background: t.sidebar }} />
                <div style={{ flex: 1, padding: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ height: 7, background: "var(--card)", borderRadius: 2 }} />
                  <div style={{ height: 7, background: "var(--border)", borderRadius: 2, width: "65%" }} />
                </div>
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", textAlign: "center" }}>{t.label}</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center", marginTop: 2 }}>{t.sub}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Accent Color" subtitle="Pick your primary highlight color">
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          {accents.map((c) => (
            <button
              key={c}
              onClick={() => setAccent(c)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: c,
                border: `2px solid ${accent === c ? "var(--text-primary)" : "transparent"}`,
                cursor: "pointer",
                outline: accent === c ? `2px solid ${c}` : "none",
                outlineOffset: 2,
                transition: "all 0.12s",
              }}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Display Preferences"
        subtitle="Layout and density settings"
        action={<SaveBtn onClick={handleSave} saved={saved} />}
      >
        <FormRow>
          <Field label="Sidebar width">
            <select style={selectStyle} value={display.sidebar} onChange={(e) => setDisplay({ ...display, sidebar: e.target.value })}>
              <option>Compact (180px)</option>
              <option>Default (210px)</option>
              <option>Wide (240px)</option>
            </select>
          </Field>
          <Field label="Table density">
            <select style={selectStyle} value={display.density} onChange={(e) => setDisplay({ ...display, density: e.target.value })}>
              <option>Comfortable</option>
              <option>Default</option>
              <option>Compact</option>
            </select>
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Date format">
            <select style={selectStyle} value={display.dateFormat} onChange={(e) => setDisplay({ ...display, dateFormat: e.target.value })}>
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </Field>
          <Field label="Number format">
            <select style={selectStyle} value={display.numberFormat} onChange={(e) => setDisplay({ ...display, numberFormat: e.target.value })}>
              <option>1,00,000 (Indian)</option>
              <option>100,000 (Global)</option>
            </select>
          </Field>
        </FormRow>
      </SectionCard>
    </div>
  );
}

function LanguageTab() {
  const languages = [
    { key: "en", name: "English", native: "English" },
    { key: "ta", name: "Tamil", native: "தமிழ்" },
    { key: "hi", name: "Hindi", native: "हिन्दी" },
    { key: "te", name: "Telugu", native: "తెలుగు" },
    { key: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
    { key: "ar", name: "Arabic", native: "العربية" },
  ];

  const [lang, setLang] = useState("en");
  const [regional, setRegional] = useState({
    timezone: "IST — Asia/Kolkata (UTC+5:30)",
    timeFormat: "12-hour (1:30 PM)",
    firstDay: "Sunday",
    currency: "Symbol (₹)",
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SectionCard title="Interface Language" subtitle="Choose the language for the ConstructaIQ UI">
        {languages.map((l) => (
          <div
            key={l.key}
            onClick={() => setLang(l.key)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 12px",
              borderRadius: 7,
              border: `1px solid ${lang === l.key ? "var(--green-primary)" : "var(--border)"}`,
              background: lang === l.key ? "#f0fdf4" : "#fff",
              marginBottom: 6,
              cursor: "pointer",
              transition: "all 0.12s",
            }}
          >
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{l.name}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 1 }}>{l.native}</div>
            </div>
            {lang === l.key && (
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--green-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={11} color="#fff" />
              </div>
            )}
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="Regional Settings"
        subtitle="Localise dates, numbers, and time zones"
        action={<SaveBtn onClick={handleSave} saved={saved} />}
      >
        <FormRow>
          <Field label="Time zone">
            <select style={selectStyle} value={regional.timezone} onChange={(e) => setRegional({ ...regional, timezone: e.target.value })}>
              <option>IST — Asia/Kolkata (UTC+5:30)</option>
              <option>GST — Asia/Dubai (UTC+4:00)</option>
              <option>EST — America/New_York (UTC-5:00)</option>
              <option>GMT — Europe/London (UTC+0:00)</option>
            </select>
          </Field>
          <Field label="Time format">
            <select style={selectStyle} value={regional.timeFormat} onChange={(e) => setRegional({ ...regional, timeFormat: e.target.value })}>
              <option>12-hour (1:30 PM)</option>
              <option>24-hour (13:30)</option>
            </select>
          </Field>
        </FormRow>
        <FormRow>
          <Field label="First day of week">
            <select style={selectStyle} value={regional.firstDay} onChange={(e) => setRegional({ ...regional, firstDay: e.target.value })}>
              <option>Sunday</option>
              <option>Monday</option>
              <option>Saturday</option>
            </select>
          </Field>
          <Field label="Currency display">
            <select style={selectStyle} value={regional.currency} onChange={(e) => setRegional({ ...regional, currency: e.target.value })}>
              <option>Symbol (₹)</option>
              <option>Code (INR)</option>
            </select>
          </Field>
        </FormRow>
      </SectionCard>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

const TAB_GROUPS = [
  {
    label: "ACCOUNT",
    tabs: [
      { key: "profile" as TabKey, label: "Profile", Icon: User },
      { key: "notifications" as TabKey, label: "Notifications", Icon: Bell },
      { key: "security" as TabKey, label: "Security", Icon: Lock },
    ],
  },
  {
    label: "PLATFORM",
    tabs: [
      { key: "agents" as TabKey, label: "AI Agents", Icon: Bot },
      { key: "projects" as TabKey, label: "Projects", Icon: Building2 },
      { key: "integrations" as TabKey, label: "Integrations", Icon: Plug },
    ],
  },
  {
    label: "PREFERENCES",
    tabs: [
      { key: "appearance" as TabKey, label: "Appearance", Icon: Palette },
      { key: "language" as TabKey, label: "Language", Icon: Languages },
    ],
  },
];

const TAB_PANELS: Record<TabKey, () => React.ReactElement> = {
  profile: ProfileTab,
  notifications: NotificationsTab,
  security: SecurityTab,
  agents: AgentsTab,
  projects: ProjectsTab,
  integrations: IntegrationsTab,
  appearance: AppearanceTab,
  language: LanguageTab,
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const ActivePanel = TAB_PANELS[activeTab];

  return (
    <div className="animate-fade-in-up" style={{ display: "flex", gap: 0, height: "100%", minHeight: 0 }}>
      {/* Left tab nav */}
      <div
        style={{
          width: 178,
          flexShrink: 0,
          paddingRight: 16,
          overflowY: "auto",
        }}
      >
        {TAB_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                letterSpacing: "0.09em",
                padding: "0 8px",
                marginBottom: 5,
              }}
            >
              {group.label}
            </div>
            {group.tabs.map(({ key, label, Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "7px 9px",
                    borderRadius: 6,
                    fontSize: "0.78rem",
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    background: active ? "var(--card)" : "transparent",
                    border: active ? "1px solid var(--border)" : "1px solid transparent",
                    boxShadow: active ? "var(--shadow-sm)" : "none",
                    cursor: "pointer",
                    marginBottom: 1,
                    textAlign: "left",
                    transition: "all 0.13s",
                  }}
                >
                  <Icon
                    size={14}
                    style={{
                      flexShrink: 0,
                      color: active ? "var(--green-primary)" : "var(--text-muted)",
                    }}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: 1, background: "var(--border)", flexShrink: 0, marginRight: 20 }} />

      {/* Panel */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 20 }}>
        <ActivePanel />
      </div>
    </div>
  );
}
