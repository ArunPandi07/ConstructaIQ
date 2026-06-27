import { X, Box, Ruler, FileText, Layers, Hash } from 'lucide-react';
import type { ViewerState } from './useViewerState';

interface InspectorPanelProps {
  viewerState: ViewerState;
}

export function InspectorPanel({ viewerState }: InspectorPanelProps) {
  const { selectedElement, setSelectedElement } = viewerState;

  if (!selectedElement) {
    return null;
  }

  const { type, levelName, name, dimensions, roomUsage, wallType } = selectedElement;

  return (
    <div className="absolute right-4 top-16 w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-4 text-sm z-10 transition-all">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Box className="w-4 h-4 text-primary-500" />
          Inspector
        </h3>
        <button
          onClick={() => setSelectedElement(null)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          title="Deselect"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-slate-400" />
          <div className="flex-1">
            <span className="text-xs text-slate-500 block uppercase tracking-wider">Type</span>
            <span className="font-medium capitalize text-slate-700 dark:text-slate-200">{type}</span>
          </div>
        </div>

        {name && (
          <div className="flex items-center gap-3">
            <Hash className="w-4 h-4 text-slate-400" />
            <div className="flex-1">
              <span className="text-xs text-slate-500 block uppercase tracking-wider">Name</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{name}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Layers className="w-4 h-4 text-slate-400" />
          <div className="flex-1">
            <span className="text-xs text-slate-500 block uppercase tracking-wider">Level</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{levelName}</span>
          </div>
        </div>

        {roomUsage && (
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-400" />
            <div className="flex-1">
              <span className="text-xs text-slate-500 block uppercase tracking-wider">Usage</span>
              <span className="font-medium capitalize text-slate-700 dark:text-slate-200">{roomUsage}</span>
            </div>
          </div>
        )}

        {wallType && (
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-400" />
            <div className="flex-1">
              <span className="text-xs text-slate-500 block uppercase tracking-wider">Wall Type</span>
              <span className="font-medium capitalize text-slate-700 dark:text-slate-200">{wallType}</span>
            </div>
          </div>
        )}

        {dimensions && (
          <div className="flex items-center gap-3">
            <Ruler className="w-4 h-4 text-slate-400" />
            <div className="flex-1">
              <span className="text-xs text-slate-500 block uppercase tracking-wider">Dimensions</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {[
                  dimensions.width ? `${dimensions.width.toFixed(2)}w` : null,
                  dimensions.length ? `${dimensions.length.toFixed(2)}l` : null,
                  dimensions.depth ? `${dimensions.depth.toFixed(2)}d` : null,
                  dimensions.height ? `${dimensions.height.toFixed(2)}h` : null,
                  dimensions.thickness ? `${dimensions.thickness.toFixed(2)}t` : null,
                ].filter(Boolean).join(' × ')} m
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
