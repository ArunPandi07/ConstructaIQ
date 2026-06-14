import { describe, expect, it } from "vitest";
import {
  buildOutputSummaryText,
  extractAgentHighlights,
  formatDisplayValue,
  parseAgentOutput,
} from "./agentOutputSummaries";

describe("agentOutputSummaries", () => {
  it("formatDisplayValue never returns [object Object]", () => {
    const nested = { building: { stories: 42, footprint: { width_m: 68 } } };
    const text = formatDisplayValue(nested);
    expect(text).not.toContain("[object Object]");
    expect(text).toContain("stories");
  });

  it("formatDisplayValue summarizes arrays with counts", () => {
    const text = formatDisplayValue([
      { name: "Phase 1" },
      { name: "Phase 2" },
      { name: "Phase 3" },
    ]);
    expect(text).toContain("3 items");
    expect(text).not.toContain("[object Object]");
  });

  it("buildOutputSummaryText formats nested blueprint output", () => {
    const raw = JSON.stringify({
      stories_above_grade: 42,
      building_definition: { building: { type: "office_tower", stories: 42 } },
      project_phases: [{ name: "Foundation" }, { name: "Steel" }],
    });
    const summary = buildOutputSummaryText(raw, 200);
    expect(summary).not.toContain("[object Object]");
    expect(summary).toContain("building_definition");
  });

  it("extractAgentHighlights for BlueprintAgent flattens building model", () => {
    const output = {
      stories_above_grade: 42,
      construction_type: "Type I-A",
      building_definition: {
        building: { type: "office_tower", stories: 42, totalHeight_m: 168 },
        levels: [{ level: 0 }, { level: 1 }],
      },
    };
    const sections = extractAgentHighlights("BlueprintAgent", output);
    expect(sections.length).toBeGreaterThan(0);
    const allText = sections
      .flatMap((s) => s.rows.map((r) => r.value))
      .join(" ");
    expect(allText).not.toContain("[object Object]");
    expect(allText).toContain("42");
  });

  it("extractAgentHighlights for ScheduleAgent counts phases and materials", () => {
    const output = {
      project_phases: [{ name: "Mobilization" }, { name: "Foundation" }],
      materials: [{ material_name: "Steel" }],
      crew_requirements: [{ role: "Ironworkers", count: 12 }],
      estimated_duration_days: 840,
    };
    const sections = extractAgentHighlights("ScheduleAgent", output);
    const rows = sections.flatMap((s) => s.rows);
    expect(rows.some((r) => r.label === "Project phases" && r.value === "2")).toBe(true);
    expect(rows.some((r) => r.label === "Materials" && r.value === "1")).toBe(true);
  });

  it("parseAgentOutput returns null for invalid JSON", () => {
    expect(parseAgentOutput("{bad json")).toBeNull();
    expect(parseAgentOutput(null)).toBeNull();
  });
});
