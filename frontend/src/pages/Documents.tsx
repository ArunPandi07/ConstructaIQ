import { useState } from "react";
import {
  FileText,
  Upload,
  Search,
  Compass,
  RefreshCw,
  Bot,
} from "lucide-react";

interface UploadedDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  agentEvaluated: boolean;
  uploadedAt: string;
}

const initialDocs: UploadedDocument[] = [
  {
    id: "doc-1",
    name: "structural_girder_elevation.dwg",
    size: "4.5 MB",
    type: "CAD / Blueprint",
    agentEvaluated: true,
    uploadedAt: "June 3, 2026",
  },
  {
    id: "doc-2",
    name: "foundation_zoning_clearance.pdf",
    size: "1.2 MB",
    type: "Permit Document",
    agentEvaluated: true,
    uploadedAt: "May 28, 2026",
  },
  {
    id: "doc-3",
    name: "sewer_connection_schematic.dwg",
    size: "2.8 MB",
    type: "Civil Engineering",
    agentEvaluated: false,
    uploadedAt: "June 9, 2026",
  },
  {
    id: "doc-4",
    name: "concrete_compaction_report.pdf",
    size: "840 KB",
    type: "Geotechnical Spec",
    agentEvaluated: true,
    uploadedAt: "June 1, 2026",
  },
];

export default function Documents() {
  const [docs, setDocs] = useState<UploadedDocument[]>(initialDocs);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [analyzingDocName, setAnalyzingDocName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(e.type === "dragover" || e.type === "dragenter");
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0])
      addNewDoc(e.dataTransfer.files[0].name, e.dataTransfer.files[0].size);
  };
  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0])
      addNewDoc(e.target.files[0].name, e.target.files[0].size);
  };

  const addNewDoc = (name: string, sizeBytes: number) => {
    const sizeStr =
      sizeBytes > 1024 * 1024
        ? (sizeBytes / (1024 * 1024)).toFixed(1) + " MB"
        : (sizeBytes / 1024).toFixed(0) + " KB";
    const extension = name.split(".").pop() || "pdf";
    const type =
      extension.toUpperCase() === "DWG"
        ? "CAD / Blueprint"
        : "Project Document";
    setDocs((prev) => [
      {
        id: "doc-" + Date.now(),
        name,
        size: sizeStr,
        type,
        agentEvaluated: false,
        uploadedAt: "Just now",
      },
      ...prev,
    ]);
  };

  const analyzeDoc = async (doc: UploadedDocument) => {
    setIsAnalyzing(true);
    setAnalyzingDocName(doc.name);
    setActiveAnalysis(null);
    try {
      const response = await fetch("/api/analyze-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: doc.name }),
      });
      const result = await response.json();
      setDocs((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, agentEvaluated: true } : d)),
      );
      setActiveAnalysis(result.analysis);
    } catch {
      setActiveAnalysis(
        "**Blueprint Analysis (Simulated)**\n\n- Structural grid layout verified\n- Load-bearing columns: 24ft spacing\n- Egress compliance: 44.2in (needs 48in)",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredDocs = docs.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className="glass-card p-6 relative overflow-hidden transition-all duration-300"
          style={
            isDragOver
              ? {
                  background: "var(--blue-bg)",
                  borderColor: "var(--blue-primary)",
                }
              : {}
          }
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
            <Upload className="w-40 h-40" />
          </div>
          <div className="relative z-10 space-y-4">
            <div>
              <h3
                className="text-base font-extrabold tracking-tight flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <Upload
                  className="w-4.5 h-4.5"
                  style={{ color: "var(--blue-primary)" }}
                />
                Blueprint & Spec Upload
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Feed civil elevations to the BlueprintAgent
              </p>
            </div>
            <div
              className="upload-zone p-8 text-center transition cursor-pointer relative"
              style={
                isDragOver
                  ? {
                      borderColor: "var(--blue-primary)",
                      background: "var(--blue-bg)",
                    }
                  : {}
              }
            >
              <input
                type="file"
                id="doc-tab-uploader"
                onChange={handleManualUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              />
              <Compass
                className="w-10 h-10 mx-auto mb-3"
                style={{ color: "var(--text-muted)" }}
              />
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {isDragOver
                  ? "Drop file to analyze!"
                  : "Drag & Drop footprint specs here"}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Supports .DWG drafts, site elevations, and municipal PDFs up to
                15MB
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3
                className="text-sm font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Onboarded Document Logs
              </h3>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                Verified indices for active project schedules
              </p>
            </div>
            <div className="relative max-w-xs w-full sm:w-64">
              <Search
                className="absolute left-2.5 top-2.5 w-3.5 h-3.5"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                placeholder="Search drawings/PDFs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs focus:outline-hidden"
                style={{
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "6px 12px 6px 32px",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                  className="font-bold"
                >
                  <th className="pb-3 pt-1">File Identifier</th>
                  <th className="pb-3 pt-1">Drawing Scope</th>
                  <th className="pb-3 pt-1">Storage Weight</th>
                  <th className="pb-3 pt-1">AI Evaluated</th>
                  <th className="pb-3 pt-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    className="transition"
                  >
                    <td
                      className="py-3 font-semibold flex items-center gap-2 max-w-50 md:max-w-xs truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <FileText
                        className="w-4 h-4 shrink-0"
                        style={{ color: "var(--blue-primary)" }}
                      />
                      <span className="truncate">{doc.name}</span>
                    </td>
                    <td
                      className="py-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {doc.type}
                    </td>
                    <td
                      className="py-3 font-mono text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {doc.size}
                    </td>
                    <td className="py-3">
                      {doc.agentEvaluated ? (
                        <span
                          className="status-badge"
                          style={{
                            background: "var(--green-bg)",
                            color: "var(--green-primary)",
                          }}
                        >
                          <span
                            className="w-1 h-1 rounded-full"
                            style={{ background: "var(--green-primary)" }}
                          ></span>
                          ANALYZED
                        </span>
                      ) : (
                        <span
                          className="status-badge"
                          style={{
                            background: "var(--bg3)",
                            color: "var(--text-muted)",
                          }}
                        >
                          AWAITING
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => analyzeDoc(doc)}
                        disabled={isAnalyzing}
                        className="p-1 px-2.5 rounded-lg text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1 transition"
                        style={{
                          background: "var(--bg3)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <Bot className="w-3.5 h-3.5" /> Analyze
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 flex flex-col h-full min-h-100">
        <div
          className="pb-4 flex justify-between items-center shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h3
              className="text-sm font-bold tracking-tight flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}
            >
              <Bot
                className="w-4 h-4"
                style={{ color: "var(--blue-primary)" }}
              />
              AI Footprint Extraction
            </h3>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Extracted load parameters & safety checks
            </p>
          </div>
        </div>
        <div className="py-4 flex-1 overflow-y-auto max-h-125">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <RefreshCw
                className="w-10 h-10 animate-spin mb-4"
                style={{ color: "var(--blue-primary)" }}
              />
              <h4
                className="text-xs font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Reviewing Footprints
              </h4>
              <p
                className="text-[11px] italic max-w-xs mt-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                "BlueprintAgent is checking dimensional anchorages of `
                {analyzingDocName}` using Gemini..."
              </p>
            </div>
          ) : activeAnalysis ? (
            <div
              className="p-4 text-xs leading-relaxed font-sans space-y-4"
              style={{
                background: "var(--bg3)",
                borderRadius: 12,
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <div
                className="text-white p-3 flex items-center justify-between font-mono text-[9px]"
                style={{ background: "var(--sidebar-bg)", borderRadius: 8 }}
              >
                <span>AGENT: BlueprintAgent v3</span>
                <span style={{ color: "var(--blue-primary)" }}>VERIFIED ✔</span>
              </div>
              <div className="space-y-4">
                {activeAnalysis.split("\n\n").map((block, idx) => {
                  if (block.startsWith("# "))
                    return (
                      <h2
                        key={idx}
                        className="text-sm font-bold mt-3 flex items-center gap-1.5"
                        style={{
                          color: "var(--text-primary)",
                          borderBottom: "1px solid var(--border)",
                          paddingBottom: 4,
                        }}
                      >
                        📐 {block.replace("# ", "")}
                      </h2>
                    );
                  if (block.startsWith("## "))
                    return (
                      <h3
                        key={idx}
                        className="text-xs font-bold mt-2"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {block.replace("## ", "")}
                      </h3>
                    );
                  if (block.startsWith("- "))
                    return (
                      <ul
                        key={idx}
                        className="list-disc pl-4 space-y-1 font-sans"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {block.split("\n").map((li, liIdx) => (
                          <li key={liIdx}>
                            {li.replace("- ", "").replace(/\*\*/g, "")}
                          </li>
                        ))}
                      </ul>
                    );
                  return (
                    <p key={idx} style={{ color: "var(--text-secondary)" }}>
                      {block.replace(/\*\*/g, "")}
                    </p>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-24 text-center"
              style={{ color: "var(--text-muted)" }}
            >
              <Compass
                className="w-8 h-8 mb-2"
                style={{ color: "var(--border2)" }}
              />
              <p className="text-xs font-semibold">Select a schematic above</p>
              <p className="text-[10px] mt-1 max-w-45">
                Click "Analyze" to run automated structural zoning evaluation in
                real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
