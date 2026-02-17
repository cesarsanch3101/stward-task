from uuid import UUID
from datetime import date, datetime

from ninja import Schema


# ─────────────────────────────────────────────────
# User (lightweight, for nesting)
# ─────────────────────────────────────────────────
class UserMinimalSchema(Schema):
    id: UUID
    email: str
    first_name: str
    last_name: str


# ─────────────────────────────────────────────────
# Task
# ─────────────────────────────────────────────────
class TaskSchema(Schema):
    id: UUID
    title: str
    description: str
    order: int
    priority: str
    column_id: UUID
    assignee: UserMinimalSchema | None = None
    assignee_name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    progress: int
    created_at: datetime
    updated_at: datetime


class TaskCreateSchema(Schema):
    title: str
    description: str = ""
    column_id: UUID
    priority: str = "none"
    assignee_id: UUID | None = None
    assignee_name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    progress: int = 0


class TaskUpdateSchema(Schema):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    assignee_id: UUID | None = None
    assignee_name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    progress: int | None = None


class TaskMoveSchema(Schema):
    column_id: UUID
    new_order: int


# ─────────────────────────────────────────────────
# Column
# ─────────────────────────────────────────────────
class ColumnSchema(Schema):
    id: UUID
    name: str
    order: int
    tasks: list[TaskSchema]


class ColumnCreateSchema(Schema):
    name: str
    order: int = 0


# ─────────────────────────────────────────────────
# Board
# ─────────────────────────────────────────────────
class BoardSchema(Schema):
    id: UUID
    name: str
    description: str
    workspace_id: UUID
    created_at: datetime
    updated_at: datetime


class BoardDetailSchema(Schema):
    id: UUID
    name: str
    description: str
    workspace_id: UUID
    columns: list[ColumnSchema]
    created_at: datetime
    updated_at: datetime


class BoardCreateSchema(Schema):
    name: str
    description: str = ""
    workspace_id: UUID


class BoardUpdateSchema(Schema):
    name: str | None = None
    description: str | None = None


# ─────────────────────────────────────────────────
# Workspace
# ─────────────────────────────────────────────────
class WorkspaceSchema(Schema):
    id: UUID
    name: str
    description: str
    owner_id: UUID
    created_at: datetime
    updated_at: datetime


class WorkspaceWithBoardsSchema(Schema):
    id: UUID
    name: str
    description: str
    owner_id: UUID
    boards: list[BoardSchema]
    created_at: datetime
    updated_at: datetime


class WorkspaceCreateSchema(Schema):
    name: str
    description: str = ""


class WorkspaceUpdateSchema(Schema):
    name: str | None = None
    description: str | None = None
