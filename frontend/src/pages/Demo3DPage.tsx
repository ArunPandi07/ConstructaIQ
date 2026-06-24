/**
 * Demo3DPage.tsx
 *
 * Public, auth-free route (/demo3d) that renders the 3D building viewer
 * against the demo fixture — no backend required.
 *
 * Accessible via: http://localhost:5173/demo3d
 */

import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ExternalLink,
  Info,
  Layers3,
  RotateCcw,
  ZoomIn,
} from "lucide-react";
import { BuildingScene, ViewerControls } from "../components/building3d";
import BuildingInfoBadge from "../components/building3d/BuildingInfoBadge";
import { useBuildingStore } from "../stores/buildingStore";
import { DEMO_BUILDING_DEFINITION, getDemoVariant } from "../data/demoBuilding";
import type { DemoVariant } from "../data/demoBuilding";
import type { BuildingDefinition } from "../types/building";
import { Component, type ReactNode } from "react";

// ── WebGL Error Boundary ────────────────────────────────────────────────────
class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-stone-500 gap-3">
          <p className="text-sm font-semibold text-stone-700">WebGL failed to initialise</p>
          <p className="text-xs text-stone-400 text-center max-w-xs">
            Try closing other browser tabs that use 3D, then refresh.
          </p>
          <button
            onClick={() => this.setState({ failed: false })}
            className="text-xs px-3 py-1.5 bg-stone-100 rounded-lg hover:bg-stone-200 transition font-semibold"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Variant selector option ─────────────────────────────────────────────────
const VARIANTS: Array<{ id: DemoVariant; label: string; floors: number; tag: string }> = [
  { id: "residential_tower", label: "Residential Tower",   floors: 7,  tag: "7F • 28×18m" },
  { id: "office_tower",      label: "Office Tower",        floors: 12, tag: "12F • 40×24m" },
  { id: "mixed_use",         label: "Mixed-Use Complex",   floors: 9,  tag: "9F • 32×20m" },
];

// ── Main page ───────────────────────────────────────────────────────────────
export default function Demo3DPage() {
  const setDefinition = useBuildingStore((s) => s.setDefinition);
  const resetView     = useBuildingStore((s) => s.resetView);

  const [variant, setVariant] = useState<DemoVariant>("residential_tower");
  const [definition, setLocalDefinition] = useState<BuildingDefinition>(DEMO_BUILDING_DEFINITION);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync into store whenever variant changes
  useEffect(() => {
    const def = getDemoVariant(variant);
    setLocalDefinition(def);
    setDefinition(def);
    resetView();
    return () => setDefinition(null);
  }, [variant, setDefinition, resetView]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0f1623] via-[#151d2e] to-[#0b1220] text-white"
      style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
    >
      {/* Top Bar */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5C518]">
              <Building2 className="w-4 h-4 text-[#1a1a1a]" />
            </div>
            <div>
              <span className="text-sm font-black text-white">ConstructaIQ</span>
              <span className="ml-2 text-[10px] font-semibold tracking-widest uppercase text-[#F5C518]/80">
                3D Viewer · Demo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live · No backend required
            </span>
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold transition"
            >
              Sign in to ConstructaIQ
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Title + variant selector */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
              Blueprint-Derived Parametric Model
            </p>
            <h1 className="text-2xl font-black text-white leading-tight">
              3D Building Viewer
            </h1>
            <p className="text-xs text-white/50 mt-1 max-w-lg">
              Generated from structured BlueprintAgent outputs: room polygons, wall paths,
              openings, stairs, facade rules, and dimensions.
            </p>
          </div>

          {/* Building type switcher */}
          <div className="flex gap-2 flex-wrap">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariant(v.id)}
                className={`rounded-xl px-3 py-2 text-xs font-bold border transition flex flex-col items-start ${
                  variant === v.id
                    ? "bg-[#F5C518] text-[#1a1a1a] border-[#F5C518]"
                    : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                }`}
              >
                <span>{v.label}</span>
                <span className={`text-[10px] font-normal mt-0.5 ${variant === v.id ? "text-[#1a1a1a]/60" : "text-white/40"}`}>
                  {v.tag}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main 3-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

          {/* 3D Viewport — takes 8/12 cols */}
          <div className="xl:col-span-8">
            <div
              ref={containerRef}
              className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a1018] shadow-2xl"
              style={{ height: "600px" }}
            >
              {/* Info badge overlay */}
              <BuildingInfoBadge definition={definition} />

              {/* Viewer */}
              <WebGLBoundary>
                <BuildingScene definition={definition} />
              </WebGLBoundary>
            </div>

            {/* Control hints */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-white/40">
              {[
                { icon: <RotateCcw className="w-3 h-3" />, text: "Drag to orbit" },
                { icon: <ZoomIn className="w-3 h-3" />, text: "Scroll to zoom" },
                { icon: <Layers3 className="w-3 h-3" />, text: "Click rooms in interior mode" },
              ].map(({ icon, text }) => (
                <span
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 border border-white/10"
                >
                  {icon}
                  {text}
                </span>
              ))}
            </div>
          </div>

          {/* Sidebar controls — 4/12 cols */}
          <div className="xl:col-span-4 space-y-3">
            {/* ViewerControls widget */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-1 shadow-xl">
              <ViewerControls definition={definition} />
            </div>

            {/* Building stats */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Demo Building
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: "Type",        value: definition.building.type.replace(/_/g, " ") },
                  { label: "Stories",     value: String(definition.building.stories) },
                  { label: "Height",      value: `${Math.round(definition.building.totalHeight_m)} m` },
                  { label: "Footprint",   value: `${definition.building.footprint.width_m}×${definition.building.footprint.depth_m} m` },
                  { label: "Roof",        value: definition.building.roof_type },
                  { label: "Facade",      value: definition.facade.window_pattern },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-white/5 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">{label}</p>
                    <p className="font-black capitalize text-white/90 leading-tight">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Info note */}
            <div className="rounded-2xl border border-[#F5C518]/20 bg-[#F5C518]/5 p-4 flex gap-3 text-xs">
              <Info className="w-4 h-4 text-[#F5C518] shrink-0 mt-0.5" />
              <p className="text-white/60 leading-relaxed">
                This is a <strong className="text-white/80">static demo</strong> built from
                a hard-coded fixture. In production, room polygons, wall paths, and facade
                data come from the BlueprintAgent pipeline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
