"""
Service Layer — encapsulates all business logic.
API endpoints delegate here; no ORM queries in api.py.
"""

import logging
from datetime import date
from uuid import UUID

from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404

from apps.accounts.models import User

from .models import Board, Column, ColumnStatus, Task, Workspace

logger = logging.getLogger(__name__)

# Default columns created with every new board
DEFAULT_COLUMNS = [
    {"name": "Pendiente", "status": ColumnStatus.PENDING, "order": 0, "color": "#6B7280"},
    {"name": "En Progreso", "status": ColumnStatus.IN_PROGRESS, "order": 1, "color": "#3B82F6"},
    {"name": "Retrasado", "status": ColumnStatus.DELAYED, "order": 2, "color": "#F97316"},
    {"name": "Completado", "status": ColumnStatus.COMPLETED, "order": 3, "color": "#22C55E"},
]


# ─────────────────────────────────────────────────
# Workspace Service
# ─────────────────────────────────────────────────
class WorkspaceService:
    @staticmethod
    def list_for_user(user: User):
        """Return all workspaces the user owns or is a member of."""
        return (
            Workspace.objects.filter(owner=user)
            .prefetch_related("boards")
            .distinct()
        )

    @staticmethod
    def create(user: User, *, name: str, description: str = "") -> Workspace:
        ws = Workspace.objects.create(owner=user, name=name, description=description)
        ws.members.add(user)
        logger.info("Workspace created: %s by user %s", ws.id, user.id)
        return ws

    @staticmethod
    def get_or_404(workspace_id: UUID, user: User) -> Workspace:
        """Get workspace ensuring user has access."""
        return get_object_or_404(Workspace, id=workspace_id, owner=user)

    @staticmethod
    def update(workspace: Workspace, **fields) -> Workspace:
        for key, value in fields.items():
            setattr(workspace, key, value)
        update_fields = list(fields.keys()) + ["updated_at"]
        workspace.save(update_fields=update_fields)
        workspace.refresh_from_db()
        return workspace

    @staticmethod
    def delete(workspace: Workspace) -> None:
        logger.info("Workspace deleted: %s", workspace.id)
        workspace.delete()


# ─────────────────────────────────────────────────
# Board Service
# ─────────────────────────────────────────────────
class BoardService:
    @staticmethod
    def list_for_user(user: User):
        """Return all boards in workspaces owned by user."""
        return Board.objects.filter(workspace__owner=user).select_related("workspace")

    @staticmethod
    def get_detail(board_id: UUID, user: User) -> Board:
        """Get board with full column/task tree, ensuring user access."""
        return get_object_or_404(
            Board.objects.filter(workspace__owner=user).prefetch_related(
                "columns",
                "columns__tasks",
                "columns__tasks__assignee",
            ),
            id=board_id,
        )

    @staticmethod
    def create(user: User, *, name: str, description: str = "", workspace_id: UUID) -> Board:
        workspace = get_object_or_404(Workspace, id=workspace_id, owner=user)

        with transaction.atomic():
            board = Board.objects.create(
                name=name, description=description, workspace=workspace
            )
            Column.objects.bulk_create(
                [
                    Column(
                        board=board,
                        name=col["name"],
                        order=col["order"],
                        status=col["status"],
                        color=col["color"],
                    )
                    for col in DEFAULT_COLUMNS
                ]
            )

        logger.info("Board created: %s in workspace %s", board.id, workspace.id)
        return Board.objects.prefetch_related(
            "columns", "columns__tasks", "columns__tasks__assignee"
        ).get(id=board.id)

    @staticmethod
    def get_or_404(board_id: UUID, user: User) -> Board:
        return get_object_or_404(Board, id=board_id, workspace__owner=user)

    @staticmethod
    def update(board: Board, **fields) -> Board:
        for key, value in fields.items():
            setattr(board, key, value)
        update_fields = list(fields.keys()) + ["updated_at"]
        board.save(update_fields=update_fields)
        board.refresh_from_db()
        return board

    @staticmethod
    def delete(board: Board) -> None:
        logger.info("Board deleted: %s", board.id)
        board.delete()


# ─────────────────────────────────────────────────
# Column Service
# ─────────────────────────────────────────────────
class ColumnService:
    @staticmethod
    def create(
        user: User,
        board_id: UUID,
        *,
        name: str,
        order: int = 0,
        status: str = "custom",
        color: str = "#8B5CF6",
    ) -> Column:
        board = get_object_or_404(Board, id=board_id, workspace__owner=user)
        column = Column.objects.create(
            board=board, name=name, order=order, status=status, color=color
        )
        column.prefetched_tasks = []
        return column

    @staticmethod
    def get_or_404(column_id: UUID, user: User) -> Column:
        return get_object_or_404(
            Column, id=column_id, board__workspace__owner=user
        )

    @staticmethod
    def update(column: Column, **fields) -> Column:
        for key, value in fields.items():
            setattr(column, key, value)
        update_fields = list(fields.keys()) + ["updated_at"]
        column.save(update_fields=update_fields)
        column.refresh_from_db()
        return column


# ─────────────────────────────────────────────────
# Task Service
# ─────────────────────────────────────────────────
class TaskService:
    @staticmethod
    def create(user: User, *, column_id: UUID, **task_data) -> Task:
        """Create a task, ensuring user owns the parent board."""
        column = get_object_or_404(Column, id=column_id, board__workspace__owner=user)
        task = Task.objects.create(column=column, **task_data)
        logger.info("Task created: %s in column %s", task.id, column.id)
        return task

    @staticmethod
    def get_or_404(task_id: UUID, user: User) -> Task:
        return get_object_or_404(
            Task.objects.select_related("column", "column__board", "column__board__workspace"),
            id=task_id,
            column__board__workspace__owner=user,
        )

    @staticmethod
    def update(task: Task, **fields) -> Task:
        update_fields = ["updated_at"]
        for key, value in fields.items():
            if key == "assignee_id":
                task.assignee_id = value
                update_fields.append("assignee_id")
            else:
                setattr(task, key, value)
                update_fields.append(key)
        task.save(update_fields=update_fields)
        task.refresh_from_db()
        return task

    @staticmethod
    def delete(task: Task) -> None:
        column = task.column
        logger.info("Task deleted: %s", task.id)
        with transaction.atomic():
            task.delete()
            # Recompact order in the column
            for idx, tid in enumerate(
                column.tasks.order_by("order").values_list("id", flat=True)
            ):
                Task.objects.filter(id=tid).update(order=idx)

    @staticmethod
    def move(task: Task, *, column_id: UUID, new_order: int, user: User) -> Task:
        """
        Move task to a target column at a given position.
        Handles reordering and auto-date logic based on Column.status.
        """
        target_column = get_object_or_404(
            Column, id=column_id, board__workspace__owner=user
        )
        old_column = task.column

        with transaction.atomic():
            # Make room in target column
            Task.objects.filter(
                column=target_column,
                order__gte=new_order,
            ).exclude(id=task.id).update(order=F("order") + 1)

            task.column = target_column
            task.order = new_order
            update_fields = ["column", "order", "updated_at"]

            # Auto-date logic using Column.status instead of magic strings
            if target_column.status == ColumnStatus.IN_PROGRESS and not task.start_date:
                task.start_date = date.today()
                update_fields.append("start_date")

            if target_column.status == ColumnStatus.COMPLETED:
                if not task.end_date:
                    task.end_date = date.today()
                    update_fields.append("end_date")
                if task.progress < 100:
                    task.progress = 100
                    update_fields.append("progress")

            task.save(update_fields=update_fields)

            # Recompact old column if task moved between columns
            if old_column.id != target_column.id:
                for idx, tid in enumerate(
                    old_column.tasks.order_by("order").values_list("id", flat=True)
                ):
                    Task.objects.filter(id=tid).update(order=idx)

        task.refresh_from_db()
        logger.info("Task %s moved to column %s at position %d", task.id, target_column.id, new_order)
        return task
