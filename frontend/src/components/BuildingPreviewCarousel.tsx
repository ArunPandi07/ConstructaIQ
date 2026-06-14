import {
  Box,
  ChevronLeft,
  ChevronRight,
  Download,
  ImageIcon,
  Maximize2,
  RefreshCw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BuildingSnapshotShot, BuildingSnapshotStatus } from "../types/buildingSnapshot";
import type { SnapshotPresentation } from "./building3d/snapshotPresets";

const AUTO_PLAY_MS = 4500;
const FADE_MS = 400;
const SWIPE_THRESHOLD = 48;

const PRESENTATION_LABELS: Record<SnapshotPresentation, string> = {
  studio_exterior: "Studio",
  street: "Street",
  aerial: "Aerial",
  corner: "Corner",
  dollhouse: "Interior",
  exploded: "Exploded",
  section: "Section",
};

const PRESENTATION_COLORS: Record<SnapshotPresentation, { bg: string; text: string }> = {
  studio_exterior: { bg: "bg-black/55", text: "text-white" },
  street:          { bg: "bg-sky-900/60", text: "text-sky-100" },
  aerial:          { bg: "bg-indigo-900/60", text: "text-indigo-100" },
  corner:          { bg: "bg-stone-900/60", text: "text-stone-100" },
  dollhouse:       { bg: "bg-amber-900/60", text: "text-amber-100" },
  exploded:        { bg: "bg-emerald-900/60", text: "text-emerald-100" },
  section:         { bg: "bg-[#F5C518]/75", text: "text-stone-900" },
};

const FILMSTRIP_LABELS: Record<SnapshotPresentation, string> = {
  studio_exterior: "Hero",
  street: "Street",
  aerial: "Aerial",
  corner: "Corner",
  dollhouse: "Interior",
  exploded: "Exploded",
  section: "Section",
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function downloadShot(shot: BuildingSnapshotShot) {
  const slug = shot.label.toLowerCase().replace(/\s+/g, "-");
  const ext = shot.dataUrl.startsWith("data:image/webp") ? "webp" : "jpg";
  const a = document.createElement("a");
  a.href = shot.dataUrl;
  a.download = `${slug}.${ext}`;
  a.click();
}

interface Props {
  shots: BuildingSnapshotShot[];
  status: BuildingSnapshotStatus;
  progress: { current: number; total: number };
  embedded?: boolean;
  onOpen3DTab?: () => void;
  onRegenerate?: () => void;
}

function PresentationBadge({ presentation }: { presentation?: SnapshotPresentation }) {
  if (!presentation) return null;
  const label = PRESENTATION_LABELS[presentation];
  const colors = PRESENTATION_COLORS[presentation];
  return (
    <span
      className={`absolute bottom-2.5 left-2.5 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase backdrop-blur-xs pointer-events-none ${colors.bg} ${colors.text}`}
    >
      {label}
    </span>
  );
}

function ViewerFrame({
  shot,
  total,
  currentIndex,
  onOpenLightbox,
  onTouchStart,
  onTouchEnd,
  fadeMs,
}: {
  shot: BuildingSnapshotShot;
  total: number;
  currentIndex: number;
  onOpenLightbox: () => void;
  onTouchStart: (x: number) => void;
  onTouchEnd: (x: number) => void;
  fadeMs: number;
}) {
  return (
    <button
      type="button"
      className="relative w-full aspect-video max-h-[300px] bg-[#e8eef4] rounded-xl overflow-hidden flex items-center justify-center group cursor-zoom-in"
      onClick={onOpenLightbox}
      onTouchStart={(e) => onTouchStart(e.touches[0]?.clientX ?? 0)}
      onTouchEnd={(e) => onTouchEnd(e.changedTouches[0]?.clientX ?? 0)}
      aria-label={`View ${shot.label} fullscreen`}
    >
      <img
        key={shot.id}
        src={shot.dataUrl}
        alt={shot.label}
        className="max-w-full max-h-full w-auto h-auto object-contain transition-opacity ease-out"
        style={{ transitionDuration: `${fadeMs}ms` }}
        decoding="async"
      />

      <PresentationBadge presentation={shot.presentation as SnapshotPresentation | undefined} />

      <span className="absolute top-2 right-2 text-[10px] font-bold font-mono text-white/90 bg-black/40 rounded-md px-2 py-0.5 backdrop-blur-xs pointer-events-none">
        {currentIndex + 1} / {total}
      </span>

      <span className="absolute top-2 left-2 rounded-md bg-white/90 p-1.5 shadow border border-stone-200 opacity-0 group-hover:opacity-100 transition-opacity">
        <Maximize2 className="w-3.5 h-3.5 text-stone-600" />
      </span>
    </button>
  );
}

function FilmstripThumb({
  shot,
  isActive,
  onClick,
}: {
  shot: BuildingSnapshotShot;
  isActive: boolean;
  onClick: () => void;
}) {
  const thumbSrc = shot.thumbDataUrl ?? shot.dataUrl;
  const shortLabel =
    shot.presentation
      ? FILMSTRIP_LABELS[shot.presentation as SnapshotPresentation] ?? shot.label
      : shot.label;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-label={`Show ${shot.label}`}
      onClick={onClick}
      className={`shrink-0 flex flex-col items-center gap-1 group transition-all`}
    >
      <div
        className={`rounded-lg overflow-hidden border-2 transition-all ${
          isActive
            ? "border-[#F5C518] ring-2 ring-[#F5C518]/30"
            : "border-stone-200 hover:border-stone-300 opacity-75 hover:opacity-100"
        }`}
      >
        <img
          src={thumbSrc}
          alt=""
          className="w-20 h-[45px] object-cover block"
          decoding="async"
        />
      </div>
      <span
        className={`text-[9px] font-bold leading-none transition-colors ${
          isActive ? "text-[#E2B30D]" : "text-stone-400 group-hover:text-stone-600"
        }`}
      >
        {shortLabel}
      </span>
    </button>
  );
}

function DotIndicator({ total, current }: { total: number; current: number }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-200 ${
            i === current
              ? "w-4 h-1.5 bg-[#F5C518]"
              : "w-1.5 h-1.5 bg-stone-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function BuildingPreviewCarousel({
  shots,
  status,
  progress,
  embedded = false,
  onOpen3DTab,
  onRegenerate,
}: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? shots.length - 1 : i - 1));
  }, [shots.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= shots.length - 1 ? 0 : i + 1));
  }, [shots.length]);

  const handleTouchStart = useCallback((x: number) => {
    touchStartX.current = x;
  }, []);

  const handleTouchEnd = useCallback(
    (x: number) => {
      const delta = x - touchStartX.current;
      if (delta > SWIPE_THRESHOLD) goPrev();
      else if (delta < -SWIPE_THRESHOLD) goNext();
    },
    [goNext, goPrev],
  );

  useEffect(() => {
    if (
      status !== "ready" ||
      shots.length <= 1 ||
      paused ||
      lightboxOpen ||
      prefersReducedMotion
    ) {
      return;
    }
    const id = window.setInterval(goNext, AUTO_PLAY_MS);
    return () => window.clearInterval(id);
  }, [status, shots.length, paused, lightboxOpen, prefersReducedMotion, goNext]);

  useEffect(() => {
    setIndex((i) => (shots.length === 0 ? 0 : Math.min(i, shots.length - 1)));
  }, [shots.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, goPrev, goNext]);

  const shellClass = embedded
    ? "overflow-hidden"
    : "rounded-2xl border border-stone-200 bg-stone-50 overflow-hidden shadow-sm";

  const isGenerating =
    status === "loading-cache" || (status === "capturing" && shots.length === 0);

  if (status === "idle") {
    return (
      <div className={`${shellClass} p-6 text-center ${embedded ? "bg-stone-50" : ""}`}>
        <ImageIcon className="w-8 h-8 mx-auto text-stone-300 mb-2" />
        <p className="text-xs text-stone-500">
          3D previews will appear after blueprint extraction provides a building model.
        </p>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className={`${shellClass} p-6 ${embedded ? "bg-stone-50" : ""}`}>
        <p className="text-xs font-bold text-stone-700 mb-2">Generating 3D previews…</p>
        <div
          className="aspect-video max-h-[300px] rounded-xl bg-stone-200/80 animate-pulse mb-3"
          aria-hidden="true"
        />
        <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden">
          <div
            className="h-full bg-[#F5C518] transition-all duration-300"
            style={{
              width:
                status === "capturing" && progress.total > 0
                  ? `${(progress.current / progress.total) * 100}%`
                  : "12%",
            }}
          />
        </div>
        <p className="text-[10px] text-stone-400 mt-2 font-mono">
          {status === "capturing"
            ? `Shot ${progress.current} / ${progress.total}`
            : "Checking cache…"}
        </p>
      </div>
    );
  }

  if (status === "error" && shots.length === 0) {
    return (
      <div
        className={
          embedded
            ? "rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"
            : "rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"
        }
      >
        Could not generate 3D preview images. Open the 3D View tab to explore the model
        interactively.
      </div>
    );
  }

  if (shots.length === 0) return null;

  const safeIndex = Math.min(index, shots.length - 1);
  const activeShot = shots[safeIndex];
  const stillCapturing = status === "capturing";

  return (
    <>
      <div
        ref={containerRef}
        className={embedded ? "overflow-hidden" : shellClass.replace("bg-stone-50", "bg-white")}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") goPrev();
          else if (e.key === "ArrowRight") goNext();
        }}
      >
        {stillCapturing && (
          <div className="px-3 pt-3">
            <div className="h-1 rounded-full bg-stone-200 overflow-hidden">
              <div
                className="h-full bg-[#F5C518] transition-all duration-300"
                style={{
                  width:
                    progress.total > 0
                      ? `${(progress.current / progress.total) * 100}%`
                      : "8%",
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 p-3">
          <button
            type="button"
            onClick={goPrev}
            className="shrink-0 rounded-full bg-white p-2 shadow border border-stone-200 hover:bg-stone-50 transition-colors"
            aria-label="Previous preview"
          >
            <ChevronLeft className="w-4 h-4 text-stone-700" />
          </button>

          <div className="flex-1 min-w-0">
            <ViewerFrame
              shot={activeShot}
              total={shots.length}
              currentIndex={safeIndex}
              fadeMs={prefersReducedMotion ? 0 : FADE_MS}
              onOpenLightbox={() => setLightboxOpen(true)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          <button
            type="button"
            onClick={goNext}
            className="shrink-0 rounded-full bg-white p-2 shadow border border-stone-200 hover:bg-stone-50 transition-colors"
            aria-label="Next preview"
          >
            <ChevronRight className="w-4 h-4 text-stone-700" />
          </button>
        </div>

        <div className="px-4 pb-1 text-center">
          <p className="text-xs font-bold text-stone-900 leading-tight">{activeShot.label}</p>
          {activeShot.description && (
            <p className="text-[10px] text-stone-400 mt-0.5">{activeShot.description}</p>
          )}
        </div>

        <div className="px-4 pb-1">
          <DotIndicator total={shots.length} current={safeIndex} />
        </div>

        <div
          className="flex gap-3 px-3 pb-3 overflow-x-auto scrollbar-thin"
          role="tablist"
          aria-label="Preview thumbnails"
        >
          {shots.map((shot, i) => (
            <FilmstripThumb
              key={shot.id}
              shot={shot}
              isActive={i === safeIndex}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>

        {(onOpen3DTab || onRegenerate) && (
          <div className="flex items-center justify-center gap-2 px-3 pb-3 border-t border-stone-100 pt-3">
            {onOpen3DTab && (
              <button
                type="button"
                onClick={onOpen3DTab}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-700 bg-stone-100 hover:bg-[#F5C518]/20 border border-stone-200 rounded-lg px-3 py-1.5 transition-colors"
              >
                <Box className="w-3.5 h-3.5" />
                Open interactive 3D
              </button>
            )}
            {onRegenerate && status === "ready" && (
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-500 hover:text-stone-700 px-2 py-1.5 transition-colors"
                aria-label="Regenerate previews"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen preview"
        >
          {/* Top bar */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadShot(activeShot)}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              aria-label="Download image"
              title="Download full-resolution image"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close fullscreen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
            aria-label="Previous preview"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="max-w-5xl w-full flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={activeShot.dataUrl}
                alt={activeShot.label}
                className="max-h-[75vh] max-w-full object-contain rounded-xl"
              />
              <PresentationBadge
                presentation={activeShot.presentation as SnapshotPresentation | undefined}
              />
            </div>
            <div className="text-center">
              <p className="text-white text-sm font-bold">{activeShot.label}</p>
              {activeShot.description && (
                <p className="text-white/60 text-xs mt-0.5">{activeShot.description}</p>
              )}
            </div>
            <DotIndicator total={shots.length} current={safeIndex} />
          </div>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
            aria-label="Next preview"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}
