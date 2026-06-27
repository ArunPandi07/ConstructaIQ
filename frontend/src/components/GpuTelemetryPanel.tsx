import { Activity, Cpu, Server, Zap } from "lucide-react";
import { useGpuTelemetry } from "../hooks/useGpuTelemetry";

export default function GpuTelemetryPanel() {
  const { metrics, history } = useGpuTelemetry();

  const maxVram = 24000;
  const vramPct = metrics ? Math.min(100, (metrics.vram_peak_mb / maxVram) * 100) : 0;
  const gpuPct = metrics?.gpu_utilization_avg || 0;

  return (
    <div className="glass-card p-6 border-[#F5C518]/30 bg-stone-900 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#F5C518]/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-[#F5C518]" />
          <h3 className="font-bold text-sm tracking-wide text-stone-100">Live Inference Compute</h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-stone-300">JarvisLabs vLLM Cluster</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
        {/* GPU Util */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-stone-400 font-medium">
            <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-[#F5C518]" /> Utilization</span>
            <span className="text-stone-200">{gpuPct}%</span>
          </div>
          <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-400 via-[#F5C518] to-orange-500"
              style={{ width: `${gpuPct}%` }}
            />
          </div>
          
          {/* Sparkline */}
          <div className="h-10 mt-3 flex items-end gap-1 opacity-60">
            {history.map((val, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-[#F5C518]/40 to-[#F5C518] rounded-t-[1px] transition-all duration-300 min-w-[3px]" 
                style={{ height: `${Math.max(2, val)}%` }} 
              />
            ))}
          </div>
        </div>

        {/* VRAM */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-stone-400 font-medium">
            <span className="flex items-center gap-1.5"><Cpu className="w-4 h-4 text-blue-400" /> VRAM Usage</span>
            <span className="text-stone-200">{metrics ? (metrics.vram_peak_mb / 1024).toFixed(1) : "0.0"} / 24 GB</span>
          </div>
          <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-indigo-400"
              style={{ width: `${vramPct}%` }}
            />
          </div>
          
          <div className="mt-5 pt-5 border-t border-stone-800 flex justify-between items-center">
            <div className="text-xs text-stone-400 flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Guided JSON Decoding
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-stone-300 bg-stone-800 px-2.5 py-1 rounded-full shadow-inner border border-stone-700">
              Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
