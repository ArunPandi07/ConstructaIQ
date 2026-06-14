import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AgentMasterList from "./AgentMasterList";
import type { AgentExecutionRead } from "../../types";

function stubRun(agentName: string): AgentExecutionRead {
  return {
    execution_id: 1,
    project_id: 1,
    agent_name: agentName,
    agent_version: "1",
    status: "complete",
    duration_seconds: 10,
    completed_at: "2026-06-13T12:00:00Z",
  };
}

describe("AgentMasterList", () => {
  it("shows all six pipeline agents", () => {
    render(
      <AgentMasterList
        byAgent={{
          ContractAgent: stubRun("ContractAgent"),
        }}
        selectedAgent="ContractAgent"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("ContractAgent")).toBeInTheDocument();
    expect(screen.getByText("BlueprintAgent")).toBeInTheDocument();
    expect(screen.getByText("CrewAgent")).toBeInTheDocument();
  });

  it("calls onSelect when a row is clicked", () => {
    const onSelect = vi.fn();
    render(
      <AgentMasterList
        byAgent={{ ContractAgent: stubRun("ContractAgent") }}
        selectedAgent="ContractAgent"
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("option", { name: /BlueprintAgent/ }));
    expect(onSelect).toHaveBeenCalledWith("BlueprintAgent");
  });
});
