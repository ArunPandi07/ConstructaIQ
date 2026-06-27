import { useState, useRef } from 'react';
import * as THREE from 'three';

export type ViewerMode = 'exterior' | 'level-isolate' | 'floor-plan' | 'exploded';

export interface LayerVisibility {
  facade: boolean;
  rooms: boolean;
  interiorWalls: boolean;
  stairs: boolean;
  site: boolean;
}

export interface SelectedElement {
  type: 'wall' | 'room' | 'stair' | 'window' | 'door' | 'balcony' | 'slab' | 'roof' | 'site' | 'column' | 'railing';
  levelIndex: number;
  levelName: string;
  id: string;
  name?: string;
  dimensions?: { width?: number; height?: number; depth?: number; length?: number };
  material?: string;
  wallType?: string;
  roomUsage?: string;
}

export interface ViewerState {
  mode: ViewerMode;
  setMode: (m: ViewerMode) => void;
  activeLevel: number;
  setActiveLevel: (l: number) => void;
  layers: LayerVisibility;
  toggleLayer: (key: keyof LayerVisibility) => void;
  selectedElement: SelectedElement | null;
  setSelectedElement: (el: SelectedElement | null) => void;
  hoveredMeshRef: React.MutableRefObject<THREE.Mesh | null>;
  selectedMeshRef: React.MutableRefObject<THREE.Mesh | null>;
}

export function useViewerState(): ViewerState {
  const [mode, setMode] = useState<ViewerMode>('exterior');
  const [activeLevel, setActiveLevel] = useState<number>(-1);
  const [layers, setLayers] = useState<LayerVisibility>({
    facade: true,
    rooms: true,
    interiorWalls: true,
    stairs: true,
    site: true,
  });
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);
  const selectedMeshRef = useRef<THREE.Mesh | null>(null);

  const toggleLayer = (key: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return {
    mode,
    setMode,
    activeLevel,
    setActiveLevel,
    layers,
    toggleLayer,
    selectedElement,
    setSelectedElement,
    hoveredMeshRef,
    selectedMeshRef,
  };
}
