import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link2, Package, Truck } from "lucide-react";
import type { ProjectSupplierRow, ScheduleMaterial } from "../types";

interface MaterialWithSupplier {
  material: ScheduleMaterial;
  supplier?: ProjectSupplierRow;
}

interface Props {
  materials: ScheduleMaterial[];
  supplierRows: ProjectSupplierRow[];
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "with",
  "for",
  "of",
  "in",
  "on",
  "to",
  "by",
  "per",
]);

const MATERIAL_KEYWORDS = new Set([
  "concrete",
  "steel",
  "rebar",
  "reinforced",
  "structural",
  "ready",
  "mix",
  "high",
  "strength",
  "curtain",
  "wall",
  "glazing",
  "glass",
  "elevator",
  "aluminum",
  "timber",
  "wood",
  "masonry",
  "brick",
  "gypsum",
  "insulation",
  "roofing",
  "membrane",
  "copper",
  "stainless",
  "precast",
  "aggregate",
  "cement",
  "mortar",
  "pipe",
  "pvc",
  "duct",
  "hvac",
  "plumbing",
  "cable",
  "wiring",
  "drywall",
  "shingle",
  "asphalt",
  "stone",
  "granite",
  "marble",
  "tile",
  "ceramic",
  "framing",
  "beam",
  "column",
  "truss",
  "deck",
  "slab",
  "foundation",
  "footing",
  "psi",
  "core",
  "walls",
]);

const MIN_MATCH_SCORE = 0.45;

function materialName(material: ScheduleMaterial): string {
  return material.materialName ?? material.name ?? "Material";
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
}

function materialTokens(text: string): Set<string> {
  const tokens = normalize(text).split(/\s+/).filter(Boolean);
  return new Set(
    tokens.filter((token) => !STOP_WORDS.has(token) && !/^\d+$/.test(token)),
  );
}

function scoreMaterialMatch(a: string, b: string): number {
  if (!a || !b) return 0;
  if (normalize(a) === normalize(b)) return 1;

  const tokensA = materialTokens(a);
  const tokensB = materialTokens(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = [...tokensA].filter((token) => tokensB.has(token));
  if (intersection.length === 0) return 0;

  const overlap =
    intersection.length / Math.max(tokensA.size, tokensB.size);
  const keywordBonus = intersection.reduce(
    (sum, token) => sum + (MATERIAL_KEYWORDS.has(token) ? 0.05 : 0),
    0,
  );
  return Math.min(1, overlap + keywordBonus);
}

function findSupplier(
  material: ScheduleMaterial,
  supplierRows: ProjectSupplierRow[],
): ProjectSupplierRow | undefined {
  if (material.supplierRecordId != null) {
    const byId = supplierRows.find(
      (row) => row.supplier_record_id === material.supplierRecordId,
    );
    if (byId) return byId;
  }

  const target = materialName(material);
  if (!target) return undefined;

  let best: ProjectSupplierRow | undefined;
  let bestScore = 0;

  for (const supplier of supplierRows) {
    const supplierMaterial = supplier.material_name ?? "";
    const score = scoreMaterialMatch(target, supplierMaterial);
    if (score >= MIN_MATCH_SCORE && score > bestScore) {
      bestScore = score;
      best = supplier;
    }
  }

  return best;
}

function formatMoney(value: unknown): string {
  if (value == null || value === "") return "-";
  const num = Number(value);
  return Number.isFinite(num) ? `$${num.toLocaleString()}` : String(value);
}

function formatQuantity(material: ScheduleMaterial): string {
  if (material.quantity == null || material.quantity === "") return "-";
  return `${material.quantity} ${material.unit ?? ""}`.trim();
}

export default function MaterialsPanel({ materials, supplierRows }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const rows = materials.map<MaterialWithSupplier>((material) => ({
      material,
      supplier: findSupplier(material, supplierRows),
    }));
    return rows.reduce<Record<string, MaterialWithSupplier[]>>((acc, row) => {
      const category = row.material.category || "General";
      acc[category] = acc[category] ?? [];
      acc[category].push(row);
      return acc;
    }, {});
  }, [materials, supplierRows]);

  const totalMaterials = materials.length;
  const linkedCount = Object.values(grouped)
    .flat()
    .filter((row) => row.supplier).length;

  if (materials.length === 0) {
    return (
      <div className="glass-card p-5 text-center">
        <Package className="w-8 h-8 mx-auto text-stone-300 mb-3" />
        <p className="text-xs text-stone-500">
          No schedule materials available yet. Run analyze to populate material
          requirements.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Materials
          </p>
          <p className="text-2xl font-black text-stone-900 mt-1">
            {totalMaterials}
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Supplier Linked
          </p>
          <p className="text-2xl font-black text-stone-900 mt-1">
            {linkedCount}
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Categories
          </p>
          <p className="text-2xl font-black text-stone-900 mt-1">
            {Object.keys(grouped).length}
          </p>
        </div>
      </div>

      {Object.entries(grouped).map(([category, rows]) => (
        <div key={category} className="glass-card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#F5C518]" />
              {category}
            </h3>
            <span className="text-[9px] uppercase font-mono text-stone-400">
              {rows.length} item{rows.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-stone-400 border-b border-stone-100">
                  <th className="pb-2">Material</th>
                  <th className="pb-2">Quantity</th>
                  <th className="pb-2">Supplier Match</th>
                  <th className="pb-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const key = `${category}-${materialName(row.material)}-${index}`;
                  const selected = selectedKey === key;
                  return (
                    <tr
                      key={key}
                      className="border-b border-stone-50 align-top cursor-pointer hover:bg-stone-50/70"
                      onClick={() => setSelectedKey(selected ? null : key)}
                    >
                      <td className="py-2.5 font-semibold text-stone-900">
                        {materialName(row.material)}
                        {selected && row.supplier && (
                          <div className="mt-2 text-[10px] text-stone-500 font-normal leading-relaxed">
                            <span className="font-bold text-stone-700">
                              Delivery:
                            </span>{" "}
                            {row.supplier.delivery_date ?? "-"} ·{" "}
                            <span className="font-bold text-stone-700">
                              Unit:
                            </span>{" "}
                            {formatMoney(row.supplier.unit_price)}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 text-stone-600 font-mono">
                        {formatQuantity(row.material)}
                      </td>
                      <td className="py-2.5">
                        {row.supplier ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 font-bold">
                            <Link2 className="w-3 h-3" />
                            {row.supplier.supplier_name ?? "Linked"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 font-bold">
                            <Truck className="w-3 h-3" />
                            No supplier assigned
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono text-stone-700">
                        {formatMoney(row.material.totalCost ?? row.supplier?.total_cost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
