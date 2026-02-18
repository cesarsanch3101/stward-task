"""
API Schemas — strict validation contracts.
All input is validated with Field constraints.
"""

from datetime import date, datetime
from enum import Enum
from uuid import UUID

from ninja import Field, Schema


# ─────────────────────────────────────────────────
# Enums for strict validation
# ─────────────────────────────────────────────────
class PriorityEnum(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ColumnStatusEnum(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DELAYED = "delayed"
    COMPLETED = "completed"
    CUSTOM = "custom"


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
    priority: PriorityEnum
    column_id: UUID
    assignee: UserMinimalSchema | None = None
    assignee_name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    progress: int
    created_at: datetime
    updated_at: datetime


class TaskCreateSchema(Schema):
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field("", max_length=5000)
    column_id: UUID
    priority: PriorityEnum = PriorityEnum.NONE
    assignee_id: UUID | None = None
    assignee_name: str | None = Field(None, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    progress: int = Field(0, ge=0, le=100)


class TaskUpdateSchema(Schema):
    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = Field(None, max_length=5000)
    priority: PriorityEnum | None = None
    assignee_id: UUID | None = None
    assignee_name: str | None = Field(None, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    progress: int | None = Field(None, ge=0, le=100)


class TaskMoveSchema(Schema):
    column_id: UUID
    new_order: int = Field(..., ge=0, le=10000)


# ─────────────────────────────────────────────────
# Column
# ─────────────────────────────────────────────────
class ColumnSchema(Schema):
    id: UUID
    name: str
    order: int
    status: ColumnStatusEnum
    tasks: list[TaskSchema]


class ColumnCreateSchema(Schema):
    name: str = Field(..., min_length=1, max_length=255)
    order: int = Field(0, ge=0)
    status: ColumnStatusEnum = ColumnStatusEnum.CUSTOM


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
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field("", max_length=2000)
    workspace_id: UUID


class BoardUpdateSchema(Schema):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)


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
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field("", max_length=2000)


class WorkspaceUpdateSchema(Schema):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
