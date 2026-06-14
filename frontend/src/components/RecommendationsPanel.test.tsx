import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RecommendationsPanel from "./RecommendationsPanel";

describe("RecommendationsPanel", () => {
  it("extracts recommendations from raw agent execution JSON and filters by source", () => {
    render(
      <RecommendationsPanel
        agentExecutions={[
          {
            execution_id: 1,
            project_id: 10,
            agent_name: "SupplierAgent",
            agent_version: "3",
            status: "complete",
            output_json: JSON.stringify({
              recommended_suppliers: [
                {
                  supplier_name: "SteelCo",
                  rationale: "Preferred for critical steel procurement.",
                  severity: "medium",
                },
              ],
            }),
          },
          {
            execution_id: 2,
            project_id: 10,
            agent_name: "CrewAgent",
            agent_version: "2",
            status: "complete",
            output_json: JSON.stringify({
              workforce_gaps: [
                {
                  role: "Certified Welder",
                  shortage: "2 welders required for peak steel month.",
                  severity: "high",
                },
              ],
            }),
          },
        ]}
      />,
    );

    expect(screen.getByText("SteelCo")).toBeInTheDocument();
    expect(screen.getByText("Certified Welder")).toBeInTheDocument();

    fireEvent.click(screen.getByText("CrewAgent"));

    expect(screen.queryByText("SteelCo")).not.toBeInTheDocument();
    expect(screen.getByText("Certified Welder")).toBeInTheDocument();
  });

  it("does not show raw JSON under PermitAgent compliance risks", () => {
    render(
      <RecommendationsPanel
        agentExecutions={[
          {
            execution_id: 3,
            project_id: 10,
            agent_name: "PermitAgent",
            agent_version: "3",
            status: "complete",
            output_json: JSON.stringify({
              compliance_risks: [
                {
                  risk: "Delay in obtaining multiple NOCs may delay plan approval",
                },
              ],
              required_documents: [
                { name: "Land ownership documents (Patta, encumbrance certificate)" },
              ],
            }),
          },
        ]}
      />,
    );

    expect(
      screen.getByText("Delay in obtaining multiple NOCs may delay plan approval"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Land ownership documents (Patta, encumbrance certificate)"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^\{"risk":/)).not.toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });
});
