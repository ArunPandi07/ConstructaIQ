import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  X,
  HardHat,
  FileText,
  UploadCloud,
  Upload,
  CheckCircle2,
  Loader2,
  FileCheck2,
  Trash2,
  AlertCircle,
  WifiOff,
  DraftingCompass,
} from "lucide-react";
import AgentThinkingLoader from "./AgentThinkingLoader";
import { useAppContext } from "../context/AppContext";
import {
  createProject,
  mapBackendProjectToUI,
  pollAnalyzeUntilComplete,
  startAnalyze,
  uploadProjectPdfs,
} from "../services/projectApi";
import { ApiError } from "../services/apiClient";

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "describe" | "upload";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  docType: "contract" | "blueprint";
}

/* ─── small reusable input focus helper ─── */
const focusInput = (el: HTMLInputElement | HTMLTextAreaElement) => {
  el.style.borderColor = "#eab308";
  el.style.boxShadow = "0 0 0 3px rgba(234,179,8,0.12)";
  el.style.background = "#ffffff";
};
const blurInput = (el: HTMLInputElement | HTMLTextAreaElement) => {
  el.style.borderColor = "#cbd5e1";
  el.style.boxShadow = "none";
  el.style.background = "#ffffff";
};

/* ─── shared field label ─── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "0.75rem",
        fontWeight: 700,
        color: "#64748b",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </label>
  );
}

/* ─── shared text input ─── */
const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  fontSize: "0.95rem",
  color: "#0f172a",
  background: "#ffffff",
  fontFamily: "inherit",
  transition: "all 0.15s",
  outline: "none",
};

export default function NewProjectModal({ open, onClose }: NewProjectModalProps) {
  const navigate = useNavigate();
  const {
    setLatestAnalysisResult,
    setAnalyzeJobId,
    setActiveProjectId,
    handleProjectCreated,
    setUploadJustCompleted,
  } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>("describe");

  /* tab 1 — describe */
  const [projectName, setProjectName] = useState("");
  const [scope, setScope] = useState("");
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [describeError, setDescribeError] = useState<string | null>(null);

  /* tab 2 — upload */
  const [uploadProjectName, setUploadProjectName] = useState("");
  const [contractFiles, setContractFiles] = useState<UploadedFile[]>([]);
  const [blueprintFiles, setBlueprintFiles] = useState<UploadedFile[]>([]);
  const [contractDrag, setContractDrag] = useState(false);
  const [blueprintDrag, setBlueprintDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /* raw File objects for the upload tab */
  const [contractRawFiles, setContractRawFiles] = useState<File[]>([]);
  const [blueprintRawFiles, setBlueprintRawFiles] = useState<File[]>([]);

  /* agent thinking loader */
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingMode, setThinkingMode] = useState<"text" | "documents">("text");
  const [thinkingProjectName, setThinkingProjectName] = useState("");
  const [thinkingError, setThinkingError] = useState<string | null>(null);
  const [thinkingResolved, setThinkingResolved] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [overallPct, setOverallPct] = useState<number | null>(null);
  const [completedProjectId, setCompletedProjectId] = useState<string | null>(null);

  const contractRef = useRef<HTMLInputElement>(null);
  const blueprintRef = useRef<HTMLInputElement>(null);

  const makeFileObj = (f: File, docType: "contract" | "blueprint"): UploadedFile => ({
    id: Math.random().toString(36).slice(2),
    name: f.name,
    size: f.size,
    docType,
  });

  const addFiles = useCallback(
    (list: FileList | null, docType: "contract" | "blueprint") => {
      if (!list) return;
      const rawArr = Array.from(list);
      const arr = rawArr.map((f) => makeFileObj(f, docType));
      if (docType === "contract") {
        setContractFiles((p) => [...p, ...arr]);
        setContractRawFiles((p) => [...p, ...rawArr]);
      } else {
        setBlueprintFiles((p) => [...p, ...arr]);
        setBlueprintRawFiles((p) => [...p, ...rawArr]);
      }
    },
    []
  );

  const removeFile = (id: string, docType: "contract" | "blueprint") => {
    if (docType === "contract") {
      setContractFiles((p) => {
        const idx = p.findIndex((f) => f.id === id);
        setContractRawFiles((r) => r.filter((_, i) => i !== idx));
        return p.filter((f) => f.id !== id);
      });
    } else {
      setBlueprintFiles((p) => {
        const idx = p.findIndex((f) => f.id === id);
        setBlueprintRawFiles((r) => r.filter((_, i) => i !== idx));
        return p.filter((f) => f.id !== id);
      });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatApiError = (e: unknown): string => {
    if (e instanceof ApiError) return e.message;
    if (e instanceof TypeError && e.message.includes("fetch")) {
      return "Cannot reach backend — is the server running on port 8000?";
    }
    return e instanceof Error ? e.message : "Unexpected error";
  };

  const runAnalyzeJob = async (
    projectId: number,
    description: string | undefined,
    uiProject: ReturnType<typeof mapBackendProjectToUI>,
  ) => {
    const job = await startAnalyze(projectId, description);
    setAnalyzeJobId(job.job_id);
    setProgressStep("ContractAgent");
    setOverallPct(0);

    const result = await pollAnalyzeUntilComplete(projectId, job.job_id, {
      onProgress: (status) => {
        setProgressStep(status.progress_step ?? null);
        setOverallPct(status.overall_pct ?? null);
      },
    });

    setLatestAnalysisResult(result);
    setActiveProjectId(String(projectId));
    handleProjectCreated({ ...uiProject, progress: 100 });
    setUploadJustCompleted(true);
    setCompletedProjectId(String(projectId));
    setValidated(true);
    setThinkingResolved(true);
  };

  /* ── Lifecycle: create project → async analyze ── */
  const handleValidate = async () => {
    if (!projectName.trim()) return;
    setDescribeError(null);
    setIsThinking(true);
    setThinkingMode("text");
    setThinkingProjectName(projectName.trim());
    setThinkingError(null);
    setThinkingResolved(false);
    setProgressStep(null);
    setOverallPct(null);
    setCompletedProjectId(null);
    setValidating(true);
    try {
      const description = scope.trim() || projectName.trim();
      const backendProject = await createProject({
        project_name: projectName.trim(),
        scope: description,
      });
      const uiProject = mapBackendProjectToUI(backendProject, 0);
      await runAnalyzeJob(backendProject.project_id, description, uiProject);
    } catch (e: unknown) {
      const msg = formatApiError(e);
      setThinkingError(msg);
      setDescribeError(msg);
    } finally {
      setValidating(false);
    }
  };

  /* ── Lifecycle: upload PDFs → async analyze ── */
  const handleUploadAnalyse = async () => {
    if (!uploadProjectName.trim()) return;
    setUploadError(null);
    setIsThinking(true);
    setThinkingMode("documents");
    setThinkingProjectName(uploadProjectName.trim());
    setThinkingError(null);
    setThinkingResolved(false);
    setProgressStep(null);
    setOverallPct(null);
    setCompletedProjectId(null);
    setUploading(true);
    try {
      const upload = await uploadProjectPdfs(
        uploadProjectName.trim(),
        contractRawFiles,
        blueprintRawFiles,
      );
      const uiProject = mapBackendProjectToUI(
        {
          project_id: upload.project_id,
          project_name: uploadProjectName.trim(),
        },
        0,
      );

      await runAnalyzeJob(upload.project_id, undefined, uiProject);
    } catch (e: unknown) {
      const msg = formatApiError(e);
      setThinkingError(msg);
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const resetAndClose = () => {
    setActiveTab("describe");
    setProjectName("");
    setScope("");
    setValidating(false);
    setValidated(false);
    setDescribeError(null);
    setUploadProjectName("");
    setContractFiles([]);
    setBlueprintFiles([]);
    setContractRawFiles([]);
    setBlueprintRawFiles([]);
    setUploading(false);
    setUploadError(null);
    setIsThinking(false);
    setThinkingError(null);
    setThinkingResolved(false);
    setProgressStep(null);
    setOverallPct(null);
    setCompletedProjectId(null);
    onClose();
  };


  const canUpload =
    uploadProjectName.trim() &&
    (contractFiles.length > 0 || blueprintFiles.length > 0);

  if (!open) return null;

  return createPortal(
    <>
      {/* ── Backdrop + centering shell ── */}
      <div
        onClick={resetAndClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5,8,20,0.75)",
          backdropFilter: "blur(10px)",
          zIndex: 1998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          animation: "npBgIn 0.2s ease forwards",
        }}
      >
        {/* ── Modal shell ── */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Onboard New Project"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            zIndex: 1999,
            width: "100%",
            maxWidth: 860,
            display: "flex",
            flexDirection: "column",
            animation: "npSlideIn 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards",
            margin: "auto",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)",
            }}
          >
            {/* ── Agent Thinking Loader overlay ── */}
            <AgentThinkingLoader
              visible={isThinking}
              projectName={thinkingProjectName}
              mode={thinkingMode}
              resolved={thinkingResolved}
              error={thinkingError}
              progressStep={progressStep}
              overallPct={overallPct}
              onDismissError={() => {
                setIsThinking(false);
                setThinkingError(null);
                setThinkingResolved(false);
              }}
              onFlushComplete={() => {
                const targetId = completedProjectId;
                resetAndClose();
                if (targetId) {
                  navigate(`/projects/${targetId}`);
                } else {
                  navigate("/projects");
                }
              }}
            />


            {/* ═══ DARK HEADER ═══ */}
            <div
              style={{
                background: "linear-gradient(135deg, #1a1f2e 0%, #111827 100%)",
                padding: "20px 22px 0",
                flexShrink: 0,
              }}
            >
              {/* title row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  {/* amber icon badge */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 14px rgba(245,158,11,0.4)",
                      flexShrink: 0,
                    }}
                  >
                    <HardHat size={22} color="#1a1f2e" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "1.18rem",
                        fontWeight: 800,
                        color: "#ffffff",
                        letterSpacing: "-0.2px",
                        lineHeight: 1.2,
                      }}
                    >
                      Onboard New Project
                    </h2>
                    <p
                      style={{
                        margin: "3px 0 0",
                        fontSize: "0.7rem",
                        color: "rgba(255,255,255,0.45)",
                        fontWeight: 400,
                      }}
                    >
                      Autonomous design-build setup and compliance check
                    </p>
                  </div>
                </div>

                {/* close */}
                <button
                  id="np-close-btn"
                  onClick={resetAndClose}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.55)",
                    transition: "all 0.15s",
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    const b = e.currentTarget;
                    b.style.background = "rgba(239,68,68,0.18)";
                    b.style.borderColor = "rgba(239,68,68,0.4)";
                    b.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    const b = e.currentTarget;
                    b.style.background = "rgba(255,255,255,0.07)";
                    b.style.borderColor = "rgba(255,255,255,0.12)";
                    b.style.color = "rgba(255,255,255,0.55)";
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* ── Tab bar (inside header, bottom border glows) ── */}

            </div>
            <div style={{ padding: "0" }}>
              <div style={{ display: "flex", background: "#f8fafc", padding: "10px", borderBottom: "1px solid #e2e8f0" }}>
                {(
                  [
                    { id: "describe", label: "Describe Your Project", Icon: HardHat },
                    { id: "upload", label: "Upload Documents", Icon: DraftingCompass },
                  ] as const
                ).map(({ id, label, Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      id={`np-tab-${id}`}
                      onClick={() => setActiveTab(id)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "14px 10px",
                        border: "1px solid",
                        borderColor: active ? "#e2e8f0" : "transparent",
                        borderBottomColor: active ? "#e2e8f0" : "transparent",
                        background: active ? "#ffffff" : "transparent",
                        color: active ? "#0f172a" : "#64748b",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                        marginBottom: -1,
                        transition: "all 0.15s",
                      }}
                    >
                      <Icon size={18} color={active ? "#eab308" : "#94a3b8"} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* ═══ BODY ═══ */}
            <div
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                overflowY: "auto",
                background: "#ffffff",
                flex: 1,
                minHeight: 0,
              }}
            >

              {/* ────────────────────────────────────────
                TAB 1 — Describe Your Project
            ──────────────────────────────────────── */}
              {activeTab === "describe" && (
                <>
                  {/* Project Name & Identifier */}
                  <div>
                    <FieldLabel>Project Name &amp; Identifier</FieldLabel>
                    <input
                      id="np-project-name"
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. Pecos Solar Phase 2, Austin Residential Core"
                      style={inputBase}
                      onFocus={(e) => focusInput(e.currentTarget)}
                      onBlur={(e) => blurInput(e.currentTarget)}
                    />
                  </div>

                  {/* Scope of Building & Project Specifications */}
                  <div>
                    <FieldLabel>Scope of Building &amp; Project Specifications</FieldLabel>
                    <textarea
                      id="np-scope"
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      placeholder={`Describe architectural footprint, materials, estimated budget, targeted city location, and zoning parameters. ContractAnalysisAgent will perform immediate verification.`}
                      rows={4}
                      style={{
                        ...inputBase,
                        resize: "vertical",
                        lineHeight: 1.65,
                      }}
                      onFocus={(e) => focusInput(e.currentTarget)}
                      onBlur={(e) => blurInput(e.currentTarget)}
                    />
                  </div>


                  {validated ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "14px 20px",
                        background: "rgba(22,163,74,0.08)",
                        border: "1.5px solid rgba(22,163,74,0.3)",
                        borderRadius: 12,
                        color: "#15803d",
                        fontSize: "0.88rem",
                        fontWeight: 700,
                      }}
                    >
                      <CheckCircle2 size={18} />
                      Pipeline Complete — Navigating to Project Intelligence...
                    </div>
                  ) : (
                    <button
                      id="np-validate-btn"
                      onClick={handleValidate}
                      disabled={!projectName.trim() || validating}
                      style={{
                        width: "100%",
                        padding: "16px 20px",
                        background:
                          !projectName.trim()
                            ? "#e5e7eb"
                            : "#eab308",
                        color: !projectName.trim() ? "#9ca3af" : "#ffffff",
                        border: "none",
                        borderRadius: 12,
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        cursor: !projectName.trim() ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 9,
                        transition: "all 0.2s",
                        boxShadow: projectName.trim()
                          ? "0 4px 14px rgba(234,179,8,0.2)"
                          : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (projectName.trim() && !validating) {
                          const b = e.currentTarget;
                          b.style.transform = "translateY(-1px)";
                          b.style.boxShadow = "0 6px 20px rgba(234,179,8,0.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        const b = e.currentTarget;
                        b.style.transform = "translateY(0)";
                        b.style.boxShadow = projectName.trim()
                          ? "0 4px 14px rgba(234,179,8,0.2)"
                          : "none";
                      }}
                    >
                      {validating ? (
                        <>
                          <Loader2 size={18} style={{ animation: "npSpin 0.8s linear infinite" }} />
                          Validating with ContractAnalysisAgent...
                        </>
                      ) : (
                        <>
                          <HardHat size={18} color="#ffffff" />
                          Validate &amp; Create Onboarding Blueprint
                        </>
                      )}
                    </button>
                  )}

                  {/* API error banner — Tab 1 */}
                  {describeError && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "11px 14px",
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        borderLeft: "3px solid #ef4444",
                        borderRadius: 10,
                        animation: "npFadeUp 0.2s ease forwards",
                      }}
                    >
                      <WifiOff size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: "0.73rem", fontWeight: 700, color: "#dc2626" }}>
                          Request Failed
                        </p>
                        <p style={{ margin: 0, fontSize: "0.7rem", color: "#7f1d1d", lineHeight: 1.5 }}>
                          {describeError}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ────────────────────────────────────────
                TAB 2 — Upload Documents
            ──────────────────────────────────────── */}
              {activeTab === "upload" && (
                <>
                  {/* Target Project Name */}
                  <div>
                    <FieldLabel>Target Project Name</FieldLabel>
                    <input
                      id="np-upload-project-name"
                      type="text"
                      value={uploadProjectName}
                      onChange={(e) => setUploadProjectName(e.target.value)}
                      placeholder="e.g. Seattle Freight Terminal"
                      style={inputBase}
                      onFocus={(e) => focusInput(e.currentTarget)}
                      onBlur={(e) => blurInput(e.currentTarget)}
                    />
                  </div>

                  {/* ── Contract + Blueprint side by side ── */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {/* Contract Document */}
                    <div>
                      <FieldLabel>Contract Document</FieldLabel>
                      <DropZone
                        label="Drop Contract PDF here"
                        subLabel="Legal PDFs, Agreements up to 25MB"
                        dragActive={contractDrag}
                        onDragOver={(e) => { e.preventDefault(); setContractDrag(true); }}
                        onDragLeave={() => setContractDrag(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setContractDrag(false);
                          addFiles(e.dataTransfer.files, "contract");
                        }}
                        onClick={() => contractRef.current?.click()}
                      />
                      <input
                        ref={contractRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        style={{ display: "none" }}
                        onChange={(e) => addFiles(e.target.files, "contract")}
                      />
                      {contractFiles.length > 0 && (
                        <FileList files={contractFiles} onRemove={(id) => removeFile(id, "contract")} formatSize={formatSize} />
                      )}
                    </div>

                    {/* Blueprint Document */}
                    <div>
                      <FieldLabel>Blueprint / Elevation File</FieldLabel>
                      <DropZone
                        label="Drop Blueprint PDF here"
                        subLabel="DWG, site plans, architectural PDFs up to 10MB"
                        dragActive={blueprintDrag}
                        onDragOver={(e) => { e.preventDefault(); setBlueprintDrag(true); }}
                        onDragLeave={() => setBlueprintDrag(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setBlueprintDrag(false);
                          addFiles(e.dataTransfer.files, "blueprint");
                        }}
                        onClick={() => blueprintRef.current?.click()}
                      />
                      <input
                        ref={blueprintRef}
                        type="file"
                        multiple
                        accept=".pdf,.dwg,.jpg,.jpeg,.png"
                        style={{ display: "none" }}
                        onChange={(e) => addFiles(e.target.files, "blueprint")}
                      />
                      {blueprintFiles.length > 0 && (
                        <FileList files={blueprintFiles} onRemove={(id) => removeFile(id, "blueprint")} formatSize={formatSize} />
                      )}
                    </div>
                  </div>



                  {/* Upload & Extract CTA */}
                  <button
                    id="np-upload-analyse-btn"
                    onClick={handleUploadAnalyse}
                    disabled={!canUpload || uploading}
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      background: !canUpload
                        ? "#e5e7eb"
                        : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: !canUpload ? "#9ca3af" : "#1a1f2e",
                      border: "none",
                      borderRadius: 12,
                      fontSize: "0.9rem",
                      fontWeight: 800,
                      cursor: !canUpload ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 9,
                      transition: "all 0.2s",
                      boxShadow: canUpload
                        ? "0 4px 18px rgba(245,158,11,0.38)"
                        : "none",
                      letterSpacing: "0.01em",
                    }}
                    onMouseEnter={(e) => {
                      if (canUpload && !uploading) {
                        const b = e.currentTarget;
                        b.style.transform = "translateY(-1px)";
                        b.style.boxShadow = "0 8px 26px rgba(245,158,11,0.5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      const b = e.currentTarget;
                      b.style.transform = "translateY(0)";
                      b.style.boxShadow = canUpload
                        ? "0 4px 18px rgba(245,158,11,0.38)"
                        : "none";
                    }}
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={17} style={{ animation: "npSpin 0.8s linear infinite" }} />
                        Extracting Structural Analytics...
                      </>
                    ) : (
                      <>
                        <UploadCloud size={17} />
                        Upload &amp; Extract Structural Analytics
                      </>
                    )}
                  </button>

                  {!canUpload && !uploading && (
                    <p
                      style={{
                        margin: "-8px 0 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: "0.68rem",
                        color: "#9ca3af",
                      }}
                    >
                      <AlertCircle size={12} />
                      Enter a project name and upload at least one document
                    </p>
                  )}

                  {/* API error banner — Tab 2 */}
                  {uploadError && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "11px 14px",
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        borderLeft: "3px solid #ef4444",
                        borderRadius: 10,
                        animation: "npFadeUp 0.2s ease forwards",
                      }}
                    >
                      <WifiOff size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: "0.73rem", fontWeight: 700, color: "#dc2626" }}>
                          Upload Failed
                        </p>
                        <p style={{ margin: 0, fontSize: "0.7rem", color: "#7f1d1d", lineHeight: 1.5 }}>
                          {uploadError}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>

      </div>
      {/* ── Animations ── */}
      <style>{`
        @keyframes npBgIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes npSlideIn {
          from { opacity: 0; transform: scale(0.93) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes npSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes npFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>,
    document.body
  );
}

/* ────────────── Drop Zone sub-component ────────────── */
function DropZone({
  label,
  subLabel,
  dragActive,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
}: {
  label: string;
  subLabel: string;
  dragActive: boolean;
  onDragOver: React.DragEventHandler;
  onDragLeave: React.DragEventHandler;
  onDrop: React.DragEventHandler;
  onClick: () => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      style={{
        border: `2px dashed ${dragActive ? "#f59e0b" : "#d1d5db"}`,
        borderRadius: 12,
        background: dragActive ? "rgba(245,158,11,0.05)" : "#f3f4f6",
        padding: "28px 20px",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 9,
        animation: "npFadeUp 0.2s ease forwards",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: dragActive ? "rgba(245,158,11,0.15)" : "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
      >
        <Upload size={20} color={dragActive ? "#d97706" : "#6b7280"} />
      </div>
      <div>
        <div
          style={{
            fontSize: "0.84rem",
            fontWeight: 700,
            color: "#1f2937",
            marginBottom: 4,
          }}
          dangerouslySetInnerHTML={{ __html: label }}
        />
        <div style={{ fontSize: "0.7rem", color: "#6b7280", lineHeight: 1.4 }}
          dangerouslySetInnerHTML={{ __html: subLabel }}
        />
      </div>
    </div>
  );
}

/* ────────────── File list sub-component ────────────── */
function FileList({
  files,
  onRemove,
  formatSize,
}: {
  files: { id: string; name: string; size: number; docType: "contract" | "blueprint" }[];
  onRemove: (id: string) => void;
  formatSize: (n: number) => string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
      {files.map((f) => (
        <div
          key={f.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 9,
            animation: "npFadeUp 0.2s ease forwards",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: f.docType === "blueprint" ? "#fef3c7" : "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {f.docType === "blueprint" ? (
              <FileText size={14} color="#d97706" />
            ) : (
              <FileCheck2 size={14} color="#16a34a" />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#111827",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {f.name}
            </div>
            <div style={{ fontSize: "0.63rem", color: "#9ca3af", marginTop: 1 }}>
              {formatSize(f.size)} · {f.docType === "blueprint" ? "Blueprint" : "Contract"}
            </div>
          </div>
          <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0 }} />
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(f.id); }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#d1d5db",
              display: "flex",
              alignItems: "center",
              padding: 3,
              borderRadius: 5,
              transition: "color 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#d1d5db"; }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
