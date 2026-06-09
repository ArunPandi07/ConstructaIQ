/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  CheckCircle,
  Loader2,
  X,
  Bot,
  Zap,
  Clock,
  ArrowRight,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Layers,
  Ruler,
  User,
  HardHat,
  Flag,
  FileCheck,
  Package,
  LayoutList,
  ClipboardList,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { uploadProjectFiles } from "../services/api";
import type { FileType, FileStatus } from "../types";

interface LocalFile {
  id: string;
  name: string;
  size: number;
  type: FileType;
  category: string;
  status: FileStatus;
  progress: number;
}

interface ProjectFormData {
  projectName: string;
  projectType: string;
  clientName: string;
  projectLocation: string;
  totalBudget: string;
  currency: string;
  startDate: string;
  endDate: string;
  numberOfFloors: string;
  complexityLevel: string;
  squareFootage: string;
  areaUnit: string;
  projectManager: string;
  pmContact: string;
  contractor: string;
  priorityLevel: string;
  projectDescription: string;
}

const initialForm: ProjectFormData = {
  projectName: "",
  projectType: "",
  clientName: "",
  projectLocation: "",
  totalBudget: "",
  currency: "INR",
  startDate: "",
  endDate: "",
  numberOfFloors: "",
  complexityLevel: "",
  squareFootage: "",
  areaUnit: "sqft",
  projectManager: "",
  pmContact: "",
  contractor: "",
  priorityLevel: "",
  projectDescription: "",
};

const agentSteps = [
  {
    id: "contract",
    name: "Contract Agent",
    description: "Extracting clauses & obligations",
    duration: 2400,
  },
  {
    id: "blueprint",
    name: "Blueprint Agent",
    description: "Analyzing structural drawings",
    duration: 4800,
  },
  {
    id: "permit",
    name: "Permit Agent",
    description: "Cross-referencing permit requirements",
    duration: 1800,
  },
  {
    id: "risk",
    name: "Risk Agent",
    description: "Computing risk vectors & probabilities",
    duration: 6200,
  },
  {
    id: "recovery",
    name: "Recovery Agent",
    description: "Generating recovery strategies",
    duration: 3400,
  },
];

const fileCategories = [
  {
    id: "permit",
    label: "Permit Documents",
    description: "Building permits, approvals",
    hint: "PDF up to 50MB",
    accept: ".pdf",
    icon: FileCheck,
    color: "var(--blue-primary)",
    bg: "var(--blue-bg)",
    bd: "var(--blue-border)",
    agentNote: "Permit Agent analyzes these",
  },
  {
    id: "bom",
    label: "BOM / Material List",
    description: "Bill of Materials",
    hint: "PDF, XLS, CSV up to 20MB",
    accept: ".pdf,.xls,.xlsx,.csv",
    icon: Package,
    color: "var(--orange-primary)",
    bg: "var(--orange-bg)",
    bd: "var(--orange-border)",
    agentNote: "Cost & procurement risk",
  },
  {
    id: "schedule",
    label: "Project Schedule",
    description: "Gantt / MS Project / CSV timeline",
    hint: "MPP, XLS, CSV up to 20MB",
    accept: ".mpp,.xls,.xlsx,.csv",
    icon: LayoutList,
    color: "var(--purple-primary)",
    bg: "var(--purple-bg)",
    bd: "var(--purple-border)",
    agentNote: "Schedule risk detection",
  },
  {
    id: "inspection",
    label: "Previous Inspection Reports",
    description: "Past site inspection PDFs",
    hint: "PDF up to 50MB each",
    accept: ".pdf",
    icon: ClipboardList,
    color: "var(--teal-primary)",
    bg: "var(--teal-bg)",
    bd: "rgba(13,148,136,0.2)",
    agentNote: "Recovery agent uses history",
  },
];

const requiredFields: (keyof ProjectFormData)[] = [
  "projectName",
  "projectType",
  "clientName",
  "projectLocation",
  "totalBudget",
  "startDate",
  "endDate",
];

function FieldLabel({
  label,
  required,
  hint,
}: {
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}
    >
      <span
        style={{
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {label}
      </span>
      {required && (
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            color: "var(--red-primary)",
          }}
        >
          *
        </span>
      )}
      {hint && (
        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
          — {hint}
        </span>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  fontSize: "0.78rem",
  border: "1px solid var(--border2)",
  borderRadius: 8,
  background: "var(--bg2)",
  color: "var(--text-primary)",
  outline: "none",
};

export default function ProjectUpload() {
  const navigate = useNavigate();
  const { setActiveProjectId, setUploadSessionId, setUploadJustCompleted } =
    useAppContext();

  const [form, setForm] = useState<ProjectFormData>(initialForm);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof ProjectFormData, boolean>>
  >({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isDragOver, setIsDragOver] = useState<string | null>(null);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [agentProgress, setAgentProgress] = useState<
    Record<string, "pending" | "running" | "complete">
  >({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const setField = (key: keyof ProjectFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: false }));
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof ProjectFormData, boolean>> = {};
    requiredFields.forEach((field) => {
      if (!form[field]?.trim()) errors[field] = true;
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getDuration = () => {
    if (!form.startDate || !form.endDate) return null;
    const diffMs =
      new Date(form.endDate).getTime() - new Date(form.startDate).getTime();
    if (diffMs <= 0) return null;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} days`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} months`;
    return `${(months / 12).toFixed(1)} years`;
  };

  const startProcessing = useCallback(async () => {
    setFormSubmitted(true);
    if (!validateForm()) return;
    setApiError(null);
    setIsProcessing(true);
    setOverallProgress(0);
    try {
      const res = await uploadProjectFiles();
      setUploadSessionId(res.data.sessionId);
      setActiveProjectId(res.data.projectId);
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : "Upload failed");
      setIsProcessing(false);
      return;
    }
    let elapsed = 0;
    const totalTime = agentSteps.reduce((s, a) => s + a.duration, 0);
    const init: Record<string, "pending" | "running" | "complete"> = {};
    agentSteps.forEach((s) => {
      init[s.id] = "pending";
    });
    setAgentProgress(init);
    agentSteps.forEach((step, idx) => {
      const startDelay = agentSteps
        .slice(0, idx)
        .reduce((s, a) => s + a.duration, 0);
      setTimeout(() => {
        setAgentProgress((p) => ({ ...p, [step.id]: "running" }));
        setOverallProgress(Math.round((elapsed / totalTime) * 100));
      }, startDelay);
      setTimeout(() => {
        elapsed += step.duration;
        setAgentProgress((p) => ({ ...p, [step.id]: "complete" }));
        setOverallProgress(Math.round((elapsed / totalTime) * 100));
        if (idx === agentSteps.length - 1) {
          setTimeout(() => {
            setIsProcessing(false);
            setOverallProgress(100);
            setUploadJustCompleted(true);
          }, 300);
        }
      }, startDelay + step.duration);
    });
  }, [form, setActiveProjectId, setUploadSessionId, setUploadJustCompleted]);

  const addFiles = (
    newFiles: FileList | Pick<File, "name" | "size">[],
    category: string,
  ) => {
    const arr = Array.from(newFiles);
    const uploaded: LocalFile[] = arr.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      type: f.name.toLowerCase().includes("blueprint")
        ? "blueprint"
        : "contract",
      category,
      status: "uploading",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...uploaded]);
    uploaded.forEach((file) => {
      let prog = 0;
      const iv = setInterval(() => {
        prog += Math.random() * 25;
        if (prog >= 100) {
          clearInterval(iv);
          setFiles((p) =>
            p.map((f) =>
              f.id === file.id
                ? { ...f, status: "complete", progress: 100 }
                : f,
            ),
          );
        } else {
          setFiles((p) =>
            p.map((f) =>
              f.id === file.id ? { ...f, progress: Math.round(prog) } : f,
            ),
          );
        }
      }, 200);
    });
  };

  const getAgentIcon = (status: string) => {
    if (status === "complete")
      return (
        <CheckCircle size={14} style={{ color: "var(--green-primary)" }} />
      );
    if (status === "running")
      return (
        <Loader2
          size={14}
          style={{ color: "var(--green-primary)" }}
          className="animate-spin"
        />
      );
    return (
      <div
        className="w-3.5 h-3.5 rounded-full"
        style={{ background: "var(--border)", border: "1px solid #d1d5db" }}
      />
    );
  };

  const duration = getDuration();
  const hasRequiredError =
    formSubmitted && Object.values(formErrors).some(Boolean);

  const sectionHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: "1px solid var(--border)",
  };

  const iconBox = (c: string, bg: string, bd: string): React.CSSProperties => ({
    width: 28,
    height: 28,
    borderRadius: 8,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: bg,
    border: `1px solid ${bd}`,
  });

  const chevronStyle: React.CSSProperties = {
    position: "absolute",
    right: 9,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-muted)",
    pointerEvents: "none",
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h2
          className="text-base font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          New Project Setup
        </h2>
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          Fill in project details and upload documents for AI-powered
          intelligence extraction
        </p>
      </div>

      {/* ── SECTION 1: Basic Project Info ── */}
      <div className="glass-card p-5">
        <div style={sectionHeaderStyle}>
          <div
            style={iconBox(
              "var(--green-primary)",
              "var(--green-bg)",
              "var(--green-border)",
            )}
          >
            <Building2 size={14} style={{ color: "var(--green-primary)" }} />
          </div>
          <div>
            <p
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Basic Project Info
            </p>
            <p
              style={{
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              Required fields — must complete before processing
            </p>
          </div>
          <span
            className="ml-auto"
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 20,
              background: "var(--red-bg)",
              color: "var(--red-primary)",
              border: "1px solid var(--red-border)",
            }}
          >
            Required
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FieldLabel
              label="Project Name"
              required
              hint='Unique identifier, e.g. "Tower A – Adyar"'
            />
            <input
              type="text"
              placeholder="e.g. Tower A – Adyar Residential Complex"
              value={form.projectName}
              onChange={(e) => setField("projectName", e.target.value)}
              style={{
                ...inputStyle,
                border: formErrors.projectName
                  ? "1px solid var(--red-border)"
                  : "1px solid var(--border2)",
              }}
            />
            {formErrors.projectName && (
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "var(--red-primary)",
                  marginTop: 3,
                }}
              >
                <AlertCircle
                  size={10}
                  style={{ display: "inline", marginRight: 3 }}
                />
                Project name is required
              </p>
            )}
          </div>

          <div>
            <FieldLabel label="Project Type" required />
            <div style={{ position: "relative" }}>
              <select
                value={form.projectType}
                onChange={(e) => setField("projectType", e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  paddingRight: 28,
                  border: formErrors.projectType
                    ? "1px solid var(--red-border)"
                    : "1px solid var(--border2)",
                  color: form.projectType
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                }}
              >
                <option value="" disabled>
                  Select project type
                </option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="mixed_use">Mixed Use</option>
              </select>
              <ChevronDown size={13} style={chevronStyle} />
            </div>
            {formErrors.projectType && (
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "var(--red-primary)",
                  marginTop: 3,
                }}
              >
                <AlertCircle
                  size={10}
                  style={{ display: "inline", marginRight: 3 }}
                />
                Select a project type
              </p>
            )}
          </div>

          <div>
            <FieldLabel
              label="Client Name"
              required
              hint="AI agents reference this from contracts"
            />
            <input
              type="text"
              placeholder="Client or company name"
              value={form.clientName}
              onChange={(e) => setField("clientName", e.target.value)}
              style={{
                ...inputStyle,
                border: formErrors.clientName
                  ? "1px solid var(--red-border)"
                  : "1px solid var(--border2)",
              }}
            />
            {formErrors.clientName && (
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "var(--red-primary)",
                  marginTop: 3,
                }}
              >
                <AlertCircle
                  size={10}
                  style={{ display: "inline", marginRight: 3 }}
                />
                Client name is required
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <FieldLabel
              label="Project Location"
              required
              hint="City / site address — permit & risk agents use this"
            />
            <div style={{ position: "relative" }}>
              <MapPin
                size={13}
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="e.g. Adyar, Chennai, Tamil Nadu"
                value={form.projectLocation}
                onChange={(e) => setField("projectLocation", e.target.value)}
                style={{
                  ...inputStyle,
                  paddingLeft: 28,
                  border: formErrors.projectLocation
                    ? "1px solid var(--red-border)"
                    : "1px solid var(--border2)",
                }}
              />
            </div>
            {formErrors.projectLocation && (
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "var(--red-primary)",
                  marginTop: 3,
                }}
              >
                <AlertCircle
                  size={10}
                  style={{ display: "inline", marginRight: 3 }}
                />
                Project location is required
              </p>
            )}
          </div>

          <div>
            <FieldLabel label="Total Budget" required hint="Project budget" />
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ position: "relative", width: 90, flexShrink: 0 }}>
                <select
                  value={form.currency}
                  onChange={(e) => setField("currency", e.target.value)}
                  style={{
                    ...inputStyle,
                    appearance: "none",
                    paddingRight: 20,
                    fontWeight: 600,
                  }}
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                </select>
                <ChevronDown size={11} style={{ ...chevronStyle, right: 5 }} />
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <DollarSign
                  size={13}
                  style={{
                    position: "absolute",
                    left: 9,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="number"
                  placeholder="e.g. 50000000"
                  value={form.totalBudget}
                  onChange={(e) => setField("totalBudget", e.target.value)}
                  style={{
                    ...inputStyle,
                    paddingLeft: 26,
                    border: formErrors.totalBudget
                      ? "1px solid var(--red-border)"
                      : "1px solid var(--border2)",
                  }}
                />
              </div>
            </div>
            {formErrors.totalBudget && (
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "var(--red-primary)",
                  marginTop: 3,
                }}
              >
                <AlertCircle
                  size={10}
                  style={{ display: "inline", marginRight: 3 }}
                />
                Budget is required
              </p>
            )}
          </div>

          <div>
            <FieldLabel
              label="Start & End Date"
              required
              hint="Duration auto-calculated"
            />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Calendar
                  size={12}
                  style={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  style={{
                    ...inputStyle,
                    paddingLeft: 26,
                    border: formErrors.startDate
                      ? "1px solid var(--red-border)"
                      : "1px solid var(--border2)",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                }}
              >
                →
              </span>
              <div style={{ flex: 1, position: "relative" }}>
                <Calendar
                  size={12}
                  style={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                  style={{
                    ...inputStyle,
                    paddingLeft: 26,
                    border: formErrors.endDate
                      ? "1px solid var(--red-border)"
                      : "1px solid var(--border2)",
                  }}
                />
              </div>
            </div>
            {(formErrors.startDate || formErrors.endDate) && (
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "var(--red-primary)",
                  marginTop: 3,
                }}
              >
                <AlertCircle
                  size={10}
                  style={{ display: "inline", marginRight: 3 }}
                />
                Both dates required
              </p>
            )}
            {duration && (
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "var(--green-primary)",
                  marginTop: 3,
                }}
              >
                <Clock
                  size={10}
                  style={{ display: "inline", marginRight: 3 }}
                />
                Duration: <strong>{duration}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Construction Details ── */}
      <div className="glass-card p-5">
        <div style={sectionHeaderStyle}>
          <div
            style={iconBox(
              "var(--blue-primary)",
              "var(--blue-bg)",
              "var(--blue-border)",
            )}
          >
            <HardHat size={14} style={{ color: "var(--blue-primary)" }} />
          </div>
          <div>
            <p
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Construction Details
            </p>
            <p
              style={{
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              Optional — improves agent accuracy & risk scoring
            </p>
          </div>
          <span
            className="ml-auto"
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 20,
              background: "var(--blue-bg)",
              color: "var(--blue-primary)",
              border: "1px solid var(--blue-border)",
            }}
          >
            Optional
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel
              label="Number of Floors"
              hint="Blueprint agent structural analysis"
            />
            <div style={{ position: "relative" }}>
              <Layers
                size={13}
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="number"
                min="1"
                placeholder="e.g. 12"
                value={form.numberOfFloors}
                onChange={(e) => setField("numberOfFloors", e.target.value)}
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
          </div>

          <div>
            <FieldLabel label="Complexity Level" hint="Risk scoring" />
            <div style={{ position: "relative" }}>
              <select
                value={form.complexityLevel}
                onChange={(e) => setField("complexityLevel", e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  paddingRight: 28,
                  color: form.complexityLevel
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                }}
              >
                <option value="">Select complexity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="very_high">Very High</option>
              </select>
              <ChevronDown size={13} style={chevronStyle} />
            </div>
          </div>

          <div>
            <FieldLabel
              label="Square Footage / Area"
              hint="Total built-up area"
            />
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Ruler
                  size={12}
                  style={{
                    position: "absolute",
                    left: 9,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  value={form.squareFootage}
                  onChange={(e) => setField("squareFootage", e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 28 }}
                />
              </div>
              <div style={{ position: "relative", width: 78, flexShrink: 0 }}>
                <select
                  value={form.areaUnit}
                  onChange={(e) => setField("areaUnit", e.target.value)}
                  style={{
                    ...inputStyle,
                    appearance: "none",
                    paddingRight: 20,
                    fontSize: "0.72rem",
                  }}
                >
                  <option value="sqft">sq.ft</option>
                  <option value="sqm">sq.m</option>
                </select>
                <ChevronDown size={11} style={{ ...chevronStyle, right: 5 }} />
              </div>
            </div>
          </div>

          <div>
            <FieldLabel label="Priority Level" hint="Dashboard ordering" />
            <div style={{ position: "relative" }}>
              <Flag
                size={13}
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
              <select
                value={form.priorityLevel}
                onChange={(e) => setField("priorityLevel", e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  paddingLeft: 28,
                  paddingRight: 28,
                  color: form.priorityLevel
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                }}
              >
                <option value="">Select priority</option>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
              <ChevronDown size={13} style={chevronStyle} />
            </div>
          </div>

          <div>
            <FieldLabel
              label="Project Manager"
              hint="Notifications & reports"
            />
            <div style={{ position: "relative" }}>
              <User
                size={13}
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Full name"
                value={form.projectManager}
                onChange={(e) => setField("projectManager", e.target.value)}
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
          </div>

          <div>
            <FieldLabel label="PM Contact" hint="Email or phone" />
            <input
              type="text"
              placeholder="email@example.com or +91 98765 43210"
              value={form.pmContact}
              onChange={(e) => setField("pmContact", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div className="md:col-span-2">
            <FieldLabel
              label="Contractor / Vendor"
              hint="Contract agent matches with document"
            />
            <div style={{ position: "relative" }}>
              <HardHat
                size={13}
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Primary contractor name"
                value={form.contractor}
                onChange={(e) => setField("contractor", e.target.value)}
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <FieldLabel
              label="Project Description"
              hint="Optional — scope, objectives, special notes"
            />
            <textarea
              rows={4}
              placeholder="Describe the project scope, key objectives, site conditions, special requirements, or any notes for the AI agents..."
              value={form.projectDescription}
              onChange={(e) => setField("projectDescription", e.target.value)}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: 90,
                lineHeight: 1.6,
              }}
            />
            <p
              style={{
                fontSize: "0.62rem",
                color: "var(--text-muted)",
                marginTop: 3,
              }}
            >
              {form.projectDescription.length}/1000 characters
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Document Upload ── */}
      <div className="glass-card p-5">
        <div style={sectionHeaderStyle}>
          <div
            style={iconBox(
              "var(--purple-primary)",
              "var(--purple-bg)",
              "var(--purple-border)",
            )}
          >
            <Upload size={14} style={{ color: "var(--purple-primary)" }} />
          </div>
          <div>
            <p
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Document Upload
            </p>
            <p
              style={{
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                margin: 0,
              }}
            >
              Upload documents for AI agent analysis — all optional
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fileCategories.map(
            ({
              id,
              label,
              description,
              hint,
              accept,
              icon: Icon,
              color,
              bg,
              bd,
              agentNote,
            }) => {
              const catFiles = files.filter((f) => f.category === id);
              const isOver = isDragOver === id;
              return (
                <div key={id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: bg,
                        border: `1px solid ${bd}`,
                      }}
                    >
                      <Icon size={12} style={{ color }} />
                    </div>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 10,
                        background: bg,
                        color,
                        border: `1px solid ${bd}`,
                      }}
                    >
                      Optional
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-muted)",
                      marginBottom: 8,
                    }}
                  >
                    {agentNote}
                  </p>
                  <div
                    className="upload-zone p-5 text-center cursor-pointer"
                    style={{
                      borderColor: isOver ? color : bd,
                      background: isOver ? bg : "#f9fffc",
                      minHeight: 96,
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(id);
                    }}
                    onDragLeave={() => setIsDragOver(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(null);
                      addFiles(e.dataTransfer.files, id);
                    }}
                    onClick={() => fileInputRefs.current[id]?.click()}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        margin: "0 auto 8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: bg,
                        border: `1px solid ${bd}`,
                      }}
                    >
                      <Upload size={15} style={{ color }} />
                    </div>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 2,
                      }}
                    >
                      {description}
                    </p>
                    <p
                      style={{
                        fontSize: "0.62rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Drop here · {hint}
                    </p>
                  </div>
                  <input
                    ref={(el) => {
                      fileInputRefs.current[id] = el;
                    }}
                    type="file"
                    multiple
                    accept={accept}
                    className="hidden"
                    onChange={(e) =>
                      e.target.files && addFiles(e.target.files, id)
                    }
                  />
                  {catFiles.length > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {catFiles.map((file) => (
                        <div
                          key={file.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "7px 10px",
                            borderRadius: 8,
                            background: "var(--bg3)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 7,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              background: bg,
                              border: `1px solid ${bd}`,
                            }}
                          >
                            <FileText size={12} style={{ color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                color: "var(--text-primary)",
                              }}
                            >
                              {file.name}
                            </span>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginTop: 3,
                              }}
                            >
                              <div className="progress-bar" style={{ flex: 1 }}>
                                <div
                                  className="progress-fill"
                                  style={{
                                    width: `${file.progress}%`,
                                    background:
                                      file.status === "complete"
                                        ? "var(--green-primary)"
                                        : color,
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: "0.6rem",
                                  color: "var(--text-muted)",
                                  flexShrink: 0,
                                }}
                              >
                                {file.progress}%
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              flexShrink: 0,
                            }}
                          >
                            {file.status === "complete" ? (
                              <CheckCircle
                                size={13}
                                style={{ color: "var(--green-primary)" }}
                              />
                            ) : (
                              <Loader2
                                size={13}
                                style={{ color: "var(--green-primary)" }}
                                className="animate-spin"
                              />
                            )}
                            <button
                              onClick={() =>
                                setFiles((p) =>
                                  p.filter((f) => f.id !== file.id),
                                )
                              }
                              className="p-1 rounded hover:bg-red-50 transition-colors"
                            >
                              <X
                                size={11}
                                style={{ color: "var(--text-muted)" }}
                              />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>

      {/* Demo divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, borderTop: "1px solid var(--border)" }} />
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 8,
            fontSize: "0.72rem",
            fontWeight: 600,
            background: "var(--green-bg)",
            border: "1px solid var(--green-border)",
            color: "var(--green-primary)",
            cursor: "pointer",
          }}
          onClick={() => {
            setForm({
              projectName: "Tower A – Adyar Residential Complex",
              projectType: "residential",
              clientName: "Prestige Group Chennai",
              projectLocation: "Adyar, Chennai, Tamil Nadu",
              totalBudget: "45000000",
              currency: "INR",
              startDate: "2025-03-01",
              endDate: "2027-06-30",
              numberOfFloors: "22",
              complexityLevel: "high",
              squareFootage: "180000",
              areaUnit: "sqft",
              projectManager: "Arjun Krishnamurthy",
              pmContact: "arjun.k@prestige.in",
              contractor: "L&T Construction Ltd",
              priorityLevel: "high",
              projectDescription:
                "High-rise residential tower with 22 floors, 88 units across 3 BHK and 4 BHK configurations. Site includes basement parking for 150 vehicles. RERA approved project with strict completion timeline.",
            });
            setFormErrors({});
            addFiles(
              [
                { name: "TowerA_Contract_2024.pdf", size: 2340000 },
                { name: "TowerA_Blueprint_v3.pdf", size: 8750000 },
              ],
              "permit",
            );
            addFiles([{ name: "TowerA_BOM_Q1.xlsx", size: 450000 }], "bom");
          }}
        >
          <Zap size={12} /> Load Demo Project
        </button>
        <div style={{ flex: 1, borderTop: "1px solid var(--border)" }} />
      </div>

      {/* Validation error */}
      {hasRequiredError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 8,
            background: "var(--red-bg)",
            border: "1px solid var(--red-border)",
            color: "var(--red-primary)",
            fontSize: "0.72rem",
          }}
        >
          <AlertCircle size={14} />
          <span>
            Please fill in all required fields (marked with *) before starting
            AI processing.
          </span>
        </div>
      )}

      {apiError && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "var(--red-bg)",
            border: "1px solid var(--red-border)",
            color: "var(--red-primary)",
            fontSize: "0.72rem",
          }}
        >
          ⚠️ {apiError}
        </div>
      )}

      {/* Launch button */}
      {!isProcessing && overallProgress < 100 && (
        <button
          onClick={startProcessing}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
          style={{ background: "var(--green-primary)" }}
        >
          <Bot size={15} /> Start AI Agent Processing <ArrowRight size={13} />
        </button>
      )}

      {/* Agent Processing Panel */}
      {Object.keys(agentProgress).length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--text-primary)" }}
              >
                AI Agent Processing
              </h3>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Autonomous intelligence extraction in progress
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold"
                style={{ color: "var(--green-primary)" }}
              >
                {overallProgress}%
              </span>
              {isProcessing && (
                <Loader2
                  size={13}
                  style={{ color: "var(--green-primary)" }}
                  className="animate-spin"
                />
              )}
              {!isProcessing && overallProgress === 100 && (
                <CheckCircle
                  size={13}
                  style={{ color: "var(--green-primary)" }}
                />
              )}
            </div>
          </div>
          <div className="progress-bar mb-4" style={{ height: 6 }}>
            <div
              className="progress-fill"
              style={{
                width: `${overallProgress}%`,
                background:
                  overallProgress === 100 ? "#15803d" : "var(--green-primary)",
              }}
            />
          </div>
          <div className="space-y-2">
            {agentSteps.map((step) => {
              const status = agentProgress[step.id] || "pending";
              return (
                <div
                  key={step.id}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all"
                  style={{
                    background:
                      status === "running"
                        ? "var(--green-bg)"
                        : status === "complete"
                          ? "#f0fdf4"
                          : "var(--bg3)",
                    border: `1px solid ${status !== "pending" ? "var(--green-border)" : "var(--border)"}`,
                  }}
                >
                  <div className="shrink-0">{getAgentIcon(status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color:
                            status !== "pending"
                              ? "var(--green-primary)"
                              : "var(--text-muted)",
                        }}
                      >
                        {step.name}
                      </span>
                      {status === "running" && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-semibold animate-pulse"
                          style={{
                            background: "var(--green-bg)",
                            color: "var(--green-primary)",
                            border: "1px solid var(--green-border)",
                            fontSize: "0.55rem",
                          }}
                        >
                          RUNNING
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {step.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock size={10} style={{ color: "var(--text-muted)" }} />
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.62rem",
                      }}
                    >
                      {(step.duration / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {overallProgress === 100 && !isProcessing && (
            <div
              className="mt-4 p-4 rounded-xl text-center"
              style={{
                background: "var(--green-bg)",
                border: "1px solid var(--green-border)",
              }}
            >
              <CheckCircle
                size={18}
                className="mx-auto mb-2"
                style={{ color: "var(--green-primary)" }}
              />
              <p
                className="text-sm font-bold mb-1"
                style={{ color: "var(--green-primary)" }}
              >
                Analysis Complete!
              </p>
              <p
                className="text-xs mb-3"
                style={{ color: "var(--text-secondary)" }}
              >
                All agents finished. Navigate to any intelligence page to review
                results.
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {[
                  { label: "Project Intelligence", path: "/intelligence" },
                  { label: "Risk Intelligence", path: "/risk" },
                  { label: "Agent Insights", path: "/agents" },
                ].map(({ label, path }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ background: "var(--green-primary)" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
