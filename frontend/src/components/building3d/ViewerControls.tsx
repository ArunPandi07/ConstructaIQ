import type { BuildingDefinition } from '../../types/building';
import type { CameraView } from './cameraPresets';

const VIEW_OPTIONS: { id: CameraView; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'angle', label: 'Angle' },
  { id: 'side', label: 'Side' },
  { id: 'top', label: 'Top' },
];

interface ViewerControlsProps {
  buildingDefinition: BuildingDefinition;
  isDayMode: boolean;
  onToggleDayNight: () => void;
  activeView: CameraView;
  onViewChange: (view: CameraView) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
}

export function ViewerControls({
  buildingDefinition,
  isDayMode,
  onToggleDayNight,
  activeView,
  onViewChange,
  autoRotate,
  onToggleAutoRotate,
}: ViewerControlsProps) {
  const { building } = buildingDefinition;
  const hText = isDayMode ? 'text-stone-900' : 'text-stone-100';
  const mText = isDayMode ? 'text-stone-600' : 'text-stone-400';
  const bgClass = isDayMode ? 'bg-white/80' : 'bg-black/60';
  const borderClass = isDayMode ? 'border-stone-200/50' : 'border-white/10';
  const activeBtnClass = isDayMode
    ? 'bg-[#F5C518] text-stone-900 border-[#F5C518]'
    : 'bg-[#F5C518] text-stone-900 border-[#F5C518]';
  const idleBtnClass = isDayMode
    ? 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
    : 'bg-white/10 text-stone-200 border-white/10 hover:bg-white/20';

  return (
    <div className="absolute inset-0 pointer-events-none z-10 p-4 font-sans">
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-2 rounded-full backdrop-blur-md border ${bgClass} ${borderClass} pointer-events-auto shadow-sm`}>
        <span className={`font-semibold text-sm ${hText}`}>
          {building.type.replaceAll('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
        <span className={mText}>|</span>
        <span className={`text-sm ${mText}`}>G + {building.stories - 1} Floors</span>
        <span className={mText}>|</span>
        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 text-xs font-medium">
          Three.js
        </span>
      </div>

      <div className={`absolute bottom-6 left-4 flex flex-wrap items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-md border ${bgClass} ${borderClass} pointer-events-auto max-w-[calc(100%-2rem)]`}>
        <span className={`text-xs font-semibold ${hText} shrink-0`}>⚙ Views</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {VIEW_OPTIONS.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => onViewChange(view.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                activeView === view.id ? activeBtnClass : idleBtnClass
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
        <span className={`hidden sm:inline ${mText}`}>|</span>
        <button
          type="button"
          onClick={onToggleAutoRotate}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
            autoRotate ? activeBtnClass : idleBtnClass
          }`}
        >
          Auto ⟳
        </button>
      </div>

      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-5 px-5 py-2 rounded-xl backdrop-blur-md border ${bgClass} ${borderClass} pointer-events-auto`}>
        <div className={`flex items-center gap-2 text-xs ${mText}`}>
          <kbd className={`px-2 py-0.5 rounded font-mono text-[10px] ${isDayMode ? 'bg-stone-200 text-stone-700' : 'bg-white/10 text-stone-300'}`}>Drag</kbd> Orbit
        </div>
        <div className={`flex items-center gap-2 text-xs ${mText}`}>
          <kbd className={`px-2 py-0.5 rounded font-mono text-[10px] ${isDayMode ? 'bg-stone-200 text-stone-700' : 'bg-white/10 text-stone-300'}`}>Scroll</kbd> Zoom
        </div>
        <div className={`flex items-center gap-2 text-xs ${mText}`}>
          <kbd className={`px-2 py-0.5 rounded font-mono text-[10px] ${isDayMode ? 'bg-stone-200 text-stone-700' : 'bg-white/10 text-stone-300'}`}>Right-Drag</kbd> Pan
        </div>
      </div>

      <div className={`absolute top-20 right-4 w-52 p-4 rounded-xl backdrop-blur-md border ${bgClass} ${borderClass} pointer-events-auto`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-[10px] font-bold uppercase tracking-wider ${mText}`}>Building Specs</h3>
          <button
            onClick={onToggleDayNight}
            className={`p-1.5 rounded-lg transition-colors ${isDayMode ? 'bg-stone-200 hover:bg-stone-300 text-amber-600' : 'bg-stone-800 hover:bg-stone-700 text-blue-400'}`}
            title="Toggle Day/Night"
          >
            {isDayMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="space-y-2">
          <InfoRow label="Floors" value={`G + ${building.stories - 1}`} isDayMode={isDayMode} />
          <InfoRow label="Height" value={`~${Math.round(building.totalHeight_m)} m`} isDayMode={isDayMode} />
          <InfoRow label="Footprint" value={`${building.footprint.width_m} x ${building.footprint.depth_m} m`} isDayMode={isDayMode} />
          <InfoRow label="Cladding" value={building.cladding_material?.split('_')[0] || 'N/A'} isDayMode={isDayMode} />
          <InfoRow label="Balconies" value={buildingDefinition.facade.balconies ? 'Yes' : 'No'} isDayMode={isDayMode} />
          <InfoRow label="Roof" value={building.roof_type} isDayMode={isDayMode} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, isDayMode }: { label: string; value: string; isDayMode: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1 border-b ${isDayMode ? 'border-stone-200/50' : 'border-white/5'} last:border-0`}>
      <span className={`text-xs ${isDayMode ? 'text-stone-500' : 'text-stone-400'}`}>{label}</span>
      <span className={`text-xs font-mono font-medium capitalize ${isDayMode ? 'text-blue-600' : 'text-emerald-400'}`}>{value}</span>
    </div>
  );
}
