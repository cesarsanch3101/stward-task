// ─── API response types (mirror Django Ninja schemas) ───

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export type Priority = "none" | "low" | "medium" | "high" | "urgent";

export type ColumnStatus =
  | "pending"
  | "in_progress"
  | "delayed"
  | "completed"
  | "custom";

export interface Task {
  id: string;
  title: string;
  description: string;
  order: number;
  priority: Priority;
  column_id: string;
  assignee: User | null;
  assignee_name: string | null;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  name: string;
  order: number;
  status: ColumnStatus;
  tasks: Task[];
}

export interface Board {
  id: string;
  name: string;
  description: string;
  workspace_id: string;
  columns: Column[];
  created_at: string;
  updated_at: string;
}

export interface BoardSummary {
  id: string;
  name: string;
  description: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  boards: BoardSummary[];
  created_at: string;
  updated_at: string;
}

// ─── Paginated response ───

export interface PaginatedResponse<T> {
  items: T[];
  count: number;
}

// ─── Auth types ───

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface AuthError {
  detail: string;
}
