import { useCallback, useEffect, useState } from "react";
import { Eye, FileText } from "lucide-react";
import {
  fetchProjectDocumentBlob,
  getProjectDocuments,
} from "../services/projectApi";
import type { ProjectDocument } from "../types";
import { RingSpinner } from "./Loader";

interface Props {
  projectId: string;
}

function formatBytes(size?: number | null): string {
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function typeLabel(documentType?: string | null): string {
  if (documentType === "contract") return "Contract";
  if (documentType === "blueprint") return "Blueprint";
  return documentType ?? "Document";
}

export default function ProjectDocumentsPanel({ projectId }: Props) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getProjectDocuments(Number(projectId))
      .then((res) => setDocuments(res.documents))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const viewDocument = useCallback(
    async (doc: ProjectDocument) => {
      if (!doc.has_file) return;
      setLoadingPdf(true);
      setSelectedId(doc.document_id);
      setError(null);
      try {
        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        const blob = await fetchProjectDocumentBlob(Number(projectId), doc.document_id);
        setPdfUrl(URL.createObjectURL(blob));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load PDF");
      } finally {
        setLoadingPdf(false);
      }
    },
    [projectId],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RingSpinner size={48} />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-stone-500 py-6 text-center">
        No uploaded documents for this project yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {documents.map((doc) => (
          <div
            key={doc.document_id}
            className={`glass-card p-4 flex items-start justify-between gap-3 border ${
              selectedId === doc.document_id
                ? "border-[#F5C518]/50"
                : "border-stone-100"
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[#F5C518]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {typeLabel(doc.document_type)}
                </p>
                <p className="text-sm font-bold text-stone-900 truncate">
                  {doc.file_name ?? "Untitled document"}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {formatBytes(doc.file_size_bytes)}
                  {doc.created_at
                    ? ` · ${new Date(doc.created_at).toLocaleDateString()}`
                    : ""}
                </p>
                {!doc.has_file && (
                  <p className="text-xs text-amber-700 mt-1">
                    File not stored — re-upload to view.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              disabled={!doc.has_file || loadingPdf}
              onClick={() => viewDocument(doc)}
              className="inline-flex items-center gap-1.5 shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-[#F5C518] text-stone-900 hover:bg-[#E2B30D] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Eye className="w-3.5 h-3.5" />
              View
            </button>
          </div>
        ))}
      </div>

      {loadingPdf && (
        <div className="flex items-center justify-center py-8">
          <RingSpinner size={40} />
        </div>
      )}

      {pdfUrl && !loadingPdf && (
        <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-50">
          <iframe
            title="Project document preview"
            src={pdfUrl}
            className="w-full h-[min(70vh,720px)] bg-white"
          />
        </div>
      )}
    </div>
  );
}
