import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskCard } from "./task-card";
import type { Task } from "@/lib/types";

// Mock dnd-kit
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

// Mock EditTaskDialog to avoid rendering full dialog
vi.mock("./edit-task-dialog", () => ({
  EditTaskDialog: () => null,
}));

const baseTask: Task = {
  id: "task-1",
  title: "Test Task",
  description: "",
  order: 0,
  priority: "none",
  column_id: "col-1",
  assignee: null,
  assignee_name: null,
  start_date: null,
  end_date: null,
  progress: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("TaskCard", () => {
  it("renders the task title", () => {
    render(<TaskCard task={baseTask} boardId="board-1" />);
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("renders priority badge for non-none priority", () => {
    render(
      <TaskCard task={{ ...baseTask, priority: "high" }} boardId="board-1" />
    );
    expect(screen.getByText("Alta")).toBeInTheDocument();
  });

  it("does not render priority badge for none priority", () => {
    render(<TaskCard task={baseTask} boardId="board-1" />);
    expect(screen.queryByText("Baja")).not.toBeInTheDocument();
    expect(screen.queryByText("Alta")).not.toBeInTheDocument();
  });

  it("renders assignee avatar when assignee_name is set", () => {
    render(
      <TaskCard
        task={{ ...baseTask, assignee_name: "Juan Pérez" }}
        boardId="board-1"
      />
    );
    expect(screen.getByText("JP")).toBeInTheDocument();
  });

  it("renders progress bar when progress > 0", () => {
    render(
      <TaskCard task={{ ...baseTask, progress: 75 }} boardId="board-1" />
    );
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders dates when set", () => {
    render(
      <TaskCard
        task={{
          ...baseTask,
          start_date: "2026-01-15",
          end_date: "2026-01-30",
        }}
        boardId="board-1"
      />
    );
    // Dates should be rendered in short Spanish format
    expect(screen.getByText(/ene/i)).toBeInTheDocument();
  });

  it("shows 'Vencida' badge for overdue tasks", () => {
    render(
      <TaskCard
        task={{
          ...baseTask,
          end_date: "2020-01-01",
          progress: 50,
        }}
        boardId="board-1"
      />
    );
    expect(screen.getByText("Vencida")).toBeInTheDocument();
  });

  it("does not show 'Vencida' for completed tasks", () => {
    render(
      <TaskCard
        task={{
          ...baseTask,
          end_date: "2020-01-01",
          progress: 100,
        }}
        boardId="board-1"
      />
    );
    expect(screen.queryByText("Vencida")).not.toBeInTheDocument();
  });
});
