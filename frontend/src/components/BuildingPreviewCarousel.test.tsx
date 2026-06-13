import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BuildingPreviewCarousel from "./BuildingPreviewCarousel";
import type { BuildingSnapshotShot } from "../types/buildingSnapshot";

const THUMB =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==";

function stubShots(): BuildingSnapshotShot[] {
  return [
    {
      id: "exterior-hero",
      label: "Exterior hero",
      description: "3/4 hero · studio lighting",
      presentation: "studio_exterior",
      dataUrl: THUMB,
      thumbDataUrl: THUMB,
    },
    {
      id: "street-elevation",
      label: "Street elevation",
      description: "Ground-level podium read",
      presentation: "street",
      dataUrl: THUMB,
      thumbDataUrl: THUMB,
    },
    {
      id: "aerial",
      label: "Aerial",
      description: "Roof overview",
      presentation: "aerial",
      dataUrl: THUMB,
      thumbDataUrl: THUMB,
    },
  ];
}

describe("BuildingPreviewCarousel", () => {
  it("shows label and description for active slide", () => {
    render(
      <BuildingPreviewCarousel shots={stubShots()} status="ready" progress={{ current: 3, total: 7 }} />,
    );

    expect(screen.getByText("Exterior hero")).toBeInTheDocument();
    expect(screen.getByText("3/4 hero · studio lighting")).toBeInTheDocument();
  });

  it("filmstrip click changes active slide", () => {
    render(
      <BuildingPreviewCarousel shots={stubShots()} status="ready" progress={{ current: 3, total: 7 }} />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Show Aerial" }));
    expect(screen.getByText("Aerial")).toBeInTheDocument();
    expect(screen.getByText("Roof overview")).toBeInTheDocument();
  });

  it("keyboard ArrowRight advances slide when carousel is focused", () => {
    const { container } = render(
      <BuildingPreviewCarousel shots={stubShots()} status="ready" progress={{ current: 1, total: 7 }} />,
    );

    const root = container.querySelector("[tabindex='0']");
    expect(root).toBeTruthy();
    fireEvent.keyDown(root!, { key: "ArrowRight" });
    expect(screen.getByText("Street elevation")).toBeInTheDocument();
  });

  it("renders open 3D CTA when handler provided", () => {
    const onOpen3DTab = vi.fn();
    render(
      <BuildingPreviewCarousel
        shots={stubShots()}
        status="ready"
        progress={{ current: 3, total: 7 }}
        onOpen3DTab={onOpen3DTab}
      />,
    );

    fireEvent.click(screen.getByText("Open interactive 3D"));
    expect(onOpen3DTab).toHaveBeenCalledOnce();
  });
});
