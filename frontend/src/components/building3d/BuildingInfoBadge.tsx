import { useBuildingStore } from "../../stores/buildingStore";
import type { BuildingDefinition } from "../../types/building";

interface Props {
  definition: BuildingDefinition;
}

export default function BuildingInfoBadge({ definition }: Props) {
  const measurementsVisible = useBuildingStore((state) => state.measurementsVisible);
  if (!measurementsVisible) return null;

  const totalHeight = definition.building.totalHeight_m;

  return (
    <div className="absolute top-4 left-4 z-10 pointer-events-none">
      <div className="rounded-xl border border-stone-200 bg-white/95 px-3 py-2 text-center shadow-sm">
        <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">
          {definition.building.type.replace(/_/g, " ")}
        </p>
        <p className="text-[11px] font-black text-stone-900">
          {definition.building.stories} floors · {Math.round(totalHeight)}m
        </p>
      </div>
    </div>
  );
}
