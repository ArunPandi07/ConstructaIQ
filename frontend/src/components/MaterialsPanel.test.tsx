import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MaterialsPanel from "./MaterialsPanel";

describe("MaterialsPanel", () => {
  it("groups materials and links matching suppliers", () => {
    render(
      <MaterialsPanel
        materials={[
          {
            name: "Structural Steel",
            category: "Structure",
            quantity: 100,
            unit: "tons",
            totalCost: 500000,
          },
        ]}
        supplierRows={[
          {
            supplier_name: "SteelCo",
            material_name: "Structural Steel",
            unit_price: 5000,
            delivery_date: "2026-09-01",
            total_cost: 500000,
          },
        ]}
      />,
    );

    expect(screen.getByText("Structure")).toBeInTheDocument();
    expect(screen.getByText("Structural Steel")).toBeInTheDocument();
    expect(screen.getByText("SteelCo")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Structural Steel"));

    expect(screen.getByText(/Delivery:/)).toBeInTheDocument();
    expect(screen.getByText(/2026-09-01/)).toBeInTheDocument();
  });

  it("links suppliers with fuzzy material name matching", () => {
    render(
      <MaterialsPanel
        materials={[
          {
            name: "Ready-Mix Concrete (8000 psi core walls)",
            category: "Structure",
            quantity: 1000,
            unit: "cy",
          },
        ]}
        supplierRows={[
          {
            supplier_name: "ConcreteCo",
            material_name: "High-Strength Concrete 8000 psi (core walls)",
            unit_price: 120,
            delivery_date: "2026-08-01",
            total_cost: 120000,
          },
        ]}
      />,
    );

    expect(screen.getByText("ConcreteCo")).toBeInTheDocument();
    expect(screen.queryByText("No supplier assigned")).not.toBeInTheDocument();
  });
});
