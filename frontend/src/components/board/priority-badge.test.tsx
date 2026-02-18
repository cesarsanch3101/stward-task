import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriorityBadge } from "./priority-badge";

describe("PriorityBadge", () => {
  it("renders nothing for 'none' priority", () => {
    const { container } = render(<PriorityBadge priority="none" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders 'Baja' for low priority", () => {
    render(<PriorityBadge priority="low" />);
    expect(screen.getByText("Baja")).toBeInTheDocument();
  });

  it("renders 'Media' for medium priority", () => {
    render(<PriorityBadge priority="medium" />);
    expect(screen.getByText("Media")).toBeInTheDocument();
  });

  it("renders 'Alta' for high priority", () => {
    render(<PriorityBadge priority="high" />);
    expect(screen.getByText("Alta")).toBeInTheDocument();
  });

  it("renders 'Urgente' for urgent priority", () => {
    render(<PriorityBadge priority="urgent" />);
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });
});
