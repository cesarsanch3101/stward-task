// ─── API response types (mirror Django Ninja schemas) ───

export type UserRole = "administrador" | "gestor" | "desarrollador" | "observador";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url: string | null;
}

export interface AllowedEmail {
  id: number;
  email: string | null;
  domain: string | null;
  role: UserRole;
  name: string | null;
  used_at: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  has_password: boolean;
  has_google: boolean;
  created_at: string;
}

export interface TaskAssignment {
  id: string;
  user: User;
  individual_progress: number;
  user_color: string;
}

export type Priority = "none" | "low" | "medium" | "high" | "urgent";

export type ColumnStatus =
  | "pending"
  | "in_progress"
  | "delayed"
  | "completed"
  | "custom";

export interface Subtask {
  id: string;
  title: string;
  progress: number;
  order: number;
  assignee: User | null;
}

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
  total_progress: number;
  assignments: TaskAssignment[];
  subtasks: Subtask[];
  parent_id: string | null;
  dependency_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  name: string;
  order: number;
  status: ColumnStatus;
  color: string;
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

// ─── Comments ───

export interface TaskComment {
  id: string;
  author: User | null;
  author_email: string;
  content: string;
  source: "app" | "email";
  attachment_filename: string | null;
  attachment_size: number | null;
  created_at: string;
}

// ─── Notifications ───

export type NotificationType = "assigned" | "group_assigned" | "moved" | "comment" | "completed";

export interface Notification {
  id: string;
  task_id: string;
  task_title: string;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}
