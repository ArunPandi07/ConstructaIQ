export interface AgentHighlightRow {
  label: string;
  value: string;
}

export interface AgentHighlightSection {
  title: string;
  rows: AgentHighlightRow[];
}

function asArray(value: unknown): unknown[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function field(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value != null && String(value).trim()) return String(value);
  }
  return "";
}

export function parseAgentOutput(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function formatDisplayValue(value: unknown, maxLen = 80): string {
  if (value == null) return "—";
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}…` : trimmed;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "0 items";
    const sample = value.slice(0, 2).map((item) => formatDisplayValue(item, 40));
    const suffix = value.length > 2 ? ` (+${value.length - 2} more)` : "";
    return `${value.length} items: ${sample.join("; ")}${suffix}`;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length === 0) return "empty object";
    const preview = keys
      .slice(0, 3)
      .map((k) => `${k}: ${formatDisplayValue(record[k], 24)}`)
      .join(", ");
    const suffix = keys.length > 3 ? ` (+${keys.length - 3} keys)` : "";
    return `{ ${preview}${suffix} }`;
  }

  return String(value);
}

function row(label: string, value: unknown): AgentHighlightRow | null {
  const text = formatDisplayValue(value);
  if (!text || text === "—") return null;
  return { label, value: text };
}

function rowsFromFields(
  output: Record<string, unknown>,
  fields: Array<{ label: string; keys: string[] }>,
): AgentHighlightRow[] {
  return fields
    .map(({ label, keys }) => row(label, field(output, keys) || output[keys[0]]))
    .filter((r): r is AgentHighlightRow => r != null);
}


function sampleNames(items: unknown[], nameKeys: string[], limit = 3): string {
  const names = items
    .slice(0, limit)
    .map((item) => {
      if (!item || typeof item !== "object") return formatDisplayValue(item, 40);
      return field(item as Record<string, unknown>, nameKeys) || "item";
    })
    .filter(Boolean);
  if (names.length === 0) return "—";
  const extra = items.length > limit ? ` (+${items.length - limit} more)` : "";
  return names.join(", ") + extra;
}

function extractContractHighlights(output: Record<string, unknown>): AgentHighlightSection[] {
  const summary = (output.projectSummary ?? output.project_summary) as
    | Record<string, unknown>
    | undefined;
  const source = summary && typeof summary === "object" ? summary : output;
  const rows = rowsFromFields(source, [
    { label: "Project", keys: ["project_name", "projectName"] },
    { label: "Client", keys: ["client_name", "clientName"] },
    { label: "Budget", keys: ["budget", "contract_value", "contractValue"] },
    { label: "Location", keys: ["location"] },
    { label: "Duration", keys: ["duration_months", "durationMonths"] },
    { label: "Scope", keys: ["scope"] },
  ]);
  return rows.length ? [{ title: "Contract summary", rows }] : [];
}

function extractBlueprintHighlights(output: Record<string, unknown>): AgentHighlightSection[] {
  const sections: AgentHighlightSection[] = [];
  const summaryRows = rowsFromFields(output, [
    { label: "Construction type", keys: ["construction_type", "constructionType"] },
    { label: "Stories", keys: ["stories_above_grade", "storiesAboveGrade", "floor_count"] },
    { label: "Structural steel", keys: ["structural_steel_tons", "structuralSteelTons"] },
    { label: "Concrete", keys: ["concrete_cy", "concreteCy"] },
    { label: "Curtain wall", keys: ["curtain_wall_sf", "curtainWallSf"] },
    { label: "Lateral system", keys: ["lateral_system", "lateralSystem"] },
  ]);
  if (summaryRows.length) sections.push({ title: "Blueprint metrics", rows: summaryRows });

  const building =
    output.building_definition ?? output.buildingDefinition ?? output.building;
  if (building && typeof building === "object" && !Array.isArray(building)) {
    const b = building as Record<string, unknown>;
    const inner = (b.building ?? b) as Record<string, unknown>;
    const buildingRows = rowsFromFields(inner, [
      { label: "Building type", keys: ["type", "building_type"] },
      { label: "Stories", keys: ["stories", "floor_count"] },
      { label: "Total height", keys: ["totalHeight_m", "total_height_m"] },
    ]);
    const footprint = inner.footprint as Record<string, unknown> | undefined;
    if (footprint) {
      const w = footprint.width_m ?? footprint.width;
      const d = footprint.depth_m ?? footprint.depth;
      if (w != null && d != null) {
        buildingRows.push({ label: "Footprint", value: `${w}m × ${d}m` });
      }
    }
  const levels = b.levels ?? output.levels;
    if (Array.isArray(levels)) {
      buildingRows.push({ label: "Levels modeled", value: String(levels.length) });
    }
    if (buildingRows.length) {
      sections.push({ title: "Building model", rows: buildingRows });
    }
  }

  return sections;
}

function extractPermitHighlights(output: Record<string, unknown>): AgentHighlightSection[] {
  const permits = asArray(
    output.required_permits ?? output.requiredPermits ?? output.permits,
  );
  const risks = asArray(output.compliance_risks ?? output.complianceRisks);
  const rows: AgentHighlightRow[] = [];

  const approval = field(output, ["approval_days", "approvalDays", "estimated_approval_days"]);
  if (approval) rows.push({ label: "Approval timeline", value: `${approval} days` });
  rows.push({ label: "Required permits", value: String(permits.length) });
  if (permits.length) {
    rows.push({
      label: "Top permits",
      value: sampleNames(permits, ["name", "permit_name", "permitName", "title"]),
    });
  }
  rows.push({ label: "Compliance risks", value: String(risks.length) });
  if (risks.length) {
    rows.push({
      label: "Risk samples",
      value: sampleNames(risks, ["risk", "title", "name", "description"]),
    });
  }

  return [{ title: "Permit assessment", rows }];
}

function extractScheduleHighlights(output: Record<string, unknown>): AgentHighlightSection[] {
  const plan = (output.project_plan ?? output.projectPlan ?? output) as Record<string, unknown>;
  const phases = asArray(plan.project_phases ?? plan.projectPhases ?? plan.phases);
  const materials = asArray(plan.materials ?? output.materials);
  const crew = asArray(plan.crew_requirements ?? plan.crewRequirements ?? output.crew_requirements);

  const rows: AgentHighlightRow[] = [];
  const days = field(plan, ["estimated_duration_days", "estimatedDurationDays", "duration_days"]);
  if (days) rows.push({ label: "Estimated duration", value: `${days} days` });
  rows.push({ label: "Project phases", value: String(phases.length) });
  if (phases.length) {
    rows.push({
      label: "Phase names",
      value: sampleNames(phases, ["name", "phase_name", "title"]),
    });
  }
  rows.push({ label: "Materials", value: String(materials.length) });
  if (materials.length) {
    rows.push({
      label: "Material samples",
      value: sampleNames(materials, ["material_name", "name", "materialName"]),
    });
  }
  rows.push({ label: "Crew requirements", value: String(crew.length) });

  return [{ title: "Schedule plan", rows }];
}

function extractSupplierHighlights(output: Record<string, unknown>): AgentHighlightSection[] {
  const suppliers = asArray(
    output.recommended_suppliers ?? output.recommendedSuppliers ?? output.suppliers,
  );
  const procurement = output.procurement_plan ?? output.procurementPlan;
  const rows: AgentHighlightRow[] = [];

  rows.push({ label: "Recommended suppliers", value: String(suppliers.length) });
  if (suppliers.length) {
    rows.push({
      label: "Supplier names",
      value: sampleNames(suppliers, ["supplier_name", "name", "supplierName"]),
    });
  }

  if (procurement != null) {
    if (Array.isArray(procurement)) {
      rows.push({ label: "Procurement items", value: String(procurement.length) });
    } else if (typeof procurement === "object") {
      const p = procurement as Record<string, unknown>;
      const items = asArray(p.items ?? p.materials ?? p.line_items);
      rows.push({ label: "Procurement items", value: String(items.length || Object.keys(p).length) });
      if (items.length) {
        rows.push({
          label: "Procurement samples",
          value: sampleNames(items, ["material_name", "name", "item"]),
        });
      }
    }
  }

  return [{ title: "Supplier & procurement", rows }];
}

function extractCrewHighlights(output: Record<string, unknown>): AgentHighlightSection[] {
  const allocations = asArray(
    output.crew_allocations ??
      output.crewAllocations ??
      output.allocations ??
      output.crew_plans,
  );
  const rows: AgentHighlightRow[] = [];

  rows.push({ label: "Crew allocations", value: String(allocations.length) });
  if (allocations.length) {
    const samples = allocations.slice(0, 4).map((item) => {
      if (!item || typeof item !== "object") return formatDisplayValue(item, 40);
      const r = item as Record<string, unknown>;
      const role = field(r, ["role", "skill_type", "crew_role", "name"]);
      const count = field(r, ["headcount", "count", "crew_count"]);
      return count ? `${role} (${count})` : role || formatDisplayValue(item, 40);
    });
    const extra = allocations.length > 4 ? ` (+${allocations.length - 4} more)` : "";
    rows.push({ label: "Roles", value: samples.join(", ") + extra });
  }

  const recommendations = asArray(output.crew_recommendations ?? output.crewRecommendations);
  if (recommendations.length) {
    rows.push({
      label: "Recommendations",
      value: sampleNames(recommendations, ["recommendation", "title", "role"]),
    });
  }

  return [{ title: "Crew planning", rows }];
}

function extractGenericHighlights(output: Record<string, unknown>): AgentHighlightSection[] {
  const keys = Object.keys(output).slice(0, 6);
  const rows = keys
    .map((key) => row(key.replace(/_/g, " "), output[key]))
    .filter((r): r is AgentHighlightRow => r != null);
  return rows.length ? [{ title: "Output summary", rows }] : [];
}

export function extractAgentHighlights(
  agentName: string,
  output: Record<string, unknown>,
): AgentHighlightSection[] {
  switch (agentName) {
    case "ContractAgent":
      return extractContractHighlights(output);
    case "BlueprintAgent":
      return extractBlueprintHighlights(output);
    case "PermitAgent":
      return extractPermitHighlights(output);
    case "ScheduleAgent":
      return extractScheduleHighlights(output);
    case "SupplierAgent":
      return extractSupplierHighlights(output);
    case "CrewAgent":
      return extractCrewHighlights(output);
    default:
      return extractGenericHighlights(output);
  }
}

export function buildOutputSummaryText(raw: string | null | undefined, max = 120): string {
  if (!raw) return "Awaiting agent output…";
  const parsed = parseAgentOutput(raw);
  if (!parsed) return raw.slice(0, max);
  const keys = Object.keys(parsed).slice(0, 3);
  if (keys.length === 0) return raw.slice(0, max);
  return keys
    .map((k) => `${k}: ${formatDisplayValue(parsed[k], 40)}`)
    .join(" · ")
    .slice(0, max);
}
