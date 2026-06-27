import React from "react";

export function renderStructuredValue(value: unknown): React.ReactNode {
  if (value == null) return "—";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1 mt-1">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
            <span>{renderStructuredValue(item)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <dl className="space-y-1 mt-1">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {k.replace(/_/g, " ")}
            </dt>
            <dd className="text-xs text-stone-700">{renderStructuredValue(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return String(value);
}
