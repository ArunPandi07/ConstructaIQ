import { describe, expect, it } from "vitest";
import {
  formatBlueprintMetricValue,
  formatSquareFootage,
} from "./formatMetrics";

describe("formatMetrics", () => {
  it("formats square footage without decimals", () => {
    expect(formatSquareFootage("1250000.0000")).toBe("1,250,000");
    expect(formatSquareFootage(1250000)).toBe("1,250,000");
  });

  it("formats blueprint numeric fields", () => {
    expect(formatBlueprintMetricValue("curtain_wall_sf", 285000)).toBe(
      "285,000",
    );
    expect(formatBlueprintMetricValue("structural_steel_tons", 14200)).toBe(
      "14,200",
    );
  });
});
