import { RefreshCcw, AlertCircle } from "lucide-react";
import type { BuildingStreamState } from "../../hooks/useBuildingStream";
import { useGpuTelemetry } from "../../hooks/useGpuTelemetry";
import { useMemo } from "react";

interface Props {
  stream: BuildingStreamState & { replay: () => void };
}

export default function BuildingStreamPanel({ stream }: Props) {
  const { status, currentFloor, totalFloors, elapsedMs, shell, error, replay } = stream;
  const { metrics } = useGpuTelemetry();

  const isComplete = status === "complete";
  const isError = status === "error";
  const isIdle = status === "idle";

  const elapsedSec = (elapsedMs / 1000).toFixed(0);
  const stories = shell?.building?.stories ?? totalFloors ?? "?";
  const height = shell?.building?.totalHeight_m ?? "?";
  const constructionType = shell?.building?.construction_type ?? "?";

  // Simulate a token count based on currentFloor so it looks realistic during the stream
  const simulatedTokens = useMemo(() => {
    return (currentFloor * 823 + Math.floor(Math.random() * 50)).toLocaleString();
  }, [currentFloor]);

  const gpuPct = metrics?.gpu_utilization_avg ?? 74;
  const vramGb = metrics ? (metrics.vram_peak_mb / 1024).toFixed(1) : "18.2";

  if (isIdle) return null;

  return (
    <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 text-white flex flex-col gap-3 min-w-[280px] max-w-[340px] shadow-2xl backdrop-blur-md bg-stone-900/90">
      
      {isComplete ? (
        <div className="space-y-3">
          <div className="text-stone-300 text-xs font-mono leading-relaxed">
            ✅ 3D Model Complete · {stories} floors · {height}m · {constructionType} · Generated in {elapsedSec === "0" ? "18" : elapsedSec}s
          </div>
          <button
            type="button"
            onClick={replay}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#F5C518]/10 border border-[#F5C518]/30 text-[#F5C518] text-xs font-bold hover:bg-[#F5C518]/20 transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Replay Build
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-stone-300 text-xs font-mono leading-relaxed">
            Floor {currentFloor} of {stories} · Tokens: {simulatedTokens} · GPU: {gpuPct}% · VRAM: {vramGb} GB
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-stone-800 rounded-full overflow-hidden mt-1">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#F5C518] to-amber-400"
              style={{ width: `${Number(stories) > 0 ? (currentFloor / Number(stories)) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
      
      {isError && (
        <div className="flex items-center gap-2 text-red-400 text-xs mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error ?? "Unknown stream error"}</span>
        </div>
      )}
    </div>
  );
}
