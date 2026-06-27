import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link2, Package, Truck } from "lucide-react";
import type { ProjectSupplierRow, ScheduleMaterial } from "../types";
import {
  findSupplier,
  formatMoney,
  formatQuantity,
  materialName,
  resolveMaterialCost,
} from "../utils/materialMatching";

interface MaterialWithSupplier {
  material: ScheduleMaterial;
  supplier?: ProjectSupplierRow;
}

interface Props {
  materials: ScheduleMaterial[];
  supplierRows: ProjectSupplierRow[];
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
          <h3 className="text-sm font-bold text-stone-900 mb-3">{category}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-stone-400 border-b border-stone-100">
                  <th className="pb-2 font-bold">Material</th>
                  <th className="pb-2 font-bold">Quantity</th>
                  <th className="pb-2 font-bold">Supplier Match</th>
                  <th className="pb-2 font-bold text-right">Cost</th>
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
                        {formatQuantity(row.material, row.supplier)}
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
                        {formatMoney(resolveMaterialCost(row.material, row.supplier))}
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
