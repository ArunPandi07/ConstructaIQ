import { useState } from 'react';
import { Building3DViewer } from '../components/building3d';
import { getDemoVariant, type DemoVariant } from '../data/demoBuilding';

const VARIANTS: { id: DemoVariant; label: string }[] = [
  { id: 'twin_tower', label: 'Twin Tower (G+6)' },
  { id: 'villa', label: 'Modern Villa' },
  { id: 'a_frame', label: 'A-Frame House' },
  { id: 'high_rise', label: 'High-Rise Apartment' },
  { id: 'residential_tower', label: 'Residential Tower' },
  { id: 'office_tower', label: 'Office Tower' },
  { id: 'mixed_use', label: 'Mixed Use' },
];

export default function Demo3DPage() {
  const [variant, setVariant] = useState<DemoVariant>('twin_tower');
  const definition = getDemoVariant(variant);

  return (
    <div className="flex h-screen flex-col bg-stone-100">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">ConstructaIQ 3D Preview</h1>
          <p className="text-sm text-stone-500">Public demo — no authentication required</p>
        </div>
        <select
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          value={variant}
          onChange={(e) => setVariant(e.target.value as DemoVariant)}
        >
          {VARIANTS.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </header>
      <main className="relative min-h-0 flex-1">
        <Building3DViewer buildingDefinition={definition} />
      </main>
    </div>
  );
}
