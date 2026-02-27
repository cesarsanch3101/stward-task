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
from ninja.errors import HttpError

from apps.accounts.models import User

from .models import (
    Board,
    Column,
    ColumnStatus,
    CommentSource,
    Notification,
    NotificationType,
    Task,
    TaskAssignment,
    TaskComment,
    Workspace,
)

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
        from django.db.models import Q
        return (
            Workspace.objects.filter(Q(owner=user) | Q(members=user))
            .prefetch_related("boards")
            .distinct()
        )

    @staticmethod
    def create(user: User, *, name: str, description: str = "") -> Workspace:
        ws = Workspace.objects.create(
            owner=user, name=name, description=description, created_by=user
        )
        ws.members.add(user)
        logger.info("Workspace created: %s by user %s", ws.id, user.id)
        return ws

    @staticmethod
    def get_or_404(workspace_id: UUID, user: User) -> Workspace:
        """Get workspace ensuring user has access (owner or member)."""
        from django.db.models import Q
        return get_object_or_404(
            Workspace.objects.filter(
                Q(id=workspace_id) & (Q(owner=user) | Q(members=user))
            ).distinct()
        )

    @staticmethod
    def update(workspace: Workspace, user: User = None, **fields) -> Workspace:
        for key, value in fields.items():
            setattr(workspace, key, value)
        update_fields = list(fields.keys()) + ["updated_at"]
        if user:
            workspace.updated_by = user
            update_fields.append("updated_by_id")
        workspace.save(update_fields=update_fields)
        workspace.refresh_from_db()
        return workspace

    @staticmethod
    def delete(workspace: Workspace, user: User = None) -> None:
        logger.info("Workspace soft-deleted: %s", workspace.id)
        workspace.soft_delete(deleted_by=user)


# ─────────────────────────────────────────────────
# Board Service
# ─────────────────────────────────────────────────
class BoardService:
    @staticmethod
    def list_for_user(user: User):
        """Return all boards in workspaces where user is owner or member."""
        from django.db.models import Q
        return Board.objects.filter(
            Q(workspace__owner=user) | Q(workspace__members=user)
        ).select_related("workspace").distinct()

    @staticmethod
    def get_detail(board_id: UUID, user: User) -> Board:
        """
        Get board with full column/task tree.
        - Admins / Managers see all tasks.
        - Other roles see only tasks where they are assignee, collaborator, or creator.
        """
        from django.db.models import Prefetch, Q
        from apps.accounts.models import User as UserModel

        is_privileged = (
            user.is_staff
            or user.is_superuser
            or user.role in (UserModel.UserRole.ADMIN, UserModel.UserRole.MANAGER)
        )

        tasks_qs = Task.objects.filter(
            parent_id__isnull=True,         # subtareas no aparecen en el tablero
        ).select_related("assignee").prefetch_related(
            "assignments__user",
            "dependencies",
            "subtasks__assignee",
        )
        if not is_privileged:
            tasks_qs = tasks_qs.filter(
                Q(assignee=user) | Q(assignments__user=user) | Q(created_by=user)
            ).distinct()

        return get_object_or_404(
            Board.objects.filter(
                Q(workspace__owner=user) | Q(workspace__members=user)
            ).prefetch_related(
                "columns",
                Prefetch("columns__tasks", queryset=tasks_qs),
            ).distinct(),
            id=board_id,
        )

    @staticmethod
    def create(user: User, *, name: str, description: str = "", workspace_id: UUID) -> Board:
        workspace = get_object_or_404(Workspace, id=workspace_id, owner=user)

        with transaction.atomic():
            board = Board.objects.create(
                name=name, description=description, workspace=workspace, created_by=user
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
        from django.db.models import Q
        return get_object_or_404(
            Board.objects.filter(
                Q(id=board_id) & (Q(workspace__owner=user) | Q(workspace__members=user))
            ).distinct()
        )

    @staticmethod
    def update(board: Board, user: User = None, **fields) -> Board:
        for key, value in fields.items():
            setattr(board, key, value)
        update_fields = list(fields.keys()) + ["updated_at"]
        if user:
            board.updated_by = user
            update_fields.append("updated_by_id")
        board.save(update_fields=update_fields)
        board.refresh_from_db()
        return board

    @staticmethod
    def delete(board: Board, user: User = None) -> None:
        logger.info("Board soft-deleted: %s", board.id)
        board.soft_delete(deleted_by=user)


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
            board=board, name=name, order=order, status=status, color=color,
            created_by=user,
        )
        column.prefetched_tasks = []
        return column

    @staticmethod
    def get_or_404(column_id: UUID, user: User) -> Column:
        return get_object_or_404(
            Column, id=column_id, board__workspace__owner=user
        )

    @staticmethod
    def update(column: Column, user: User = None, **fields) -> Column:
        for key, value in fields.items():
            setattr(column, key, value)
        update_fields = list(fields.keys()) + ["updated_at"]
        if user:
            column.updated_by = user
            update_fields.append("updated_by_id")
        column.save(update_fields=update_fields)
        column.refresh_from_db()
        return column

    @staticmethod
    def delete(column: Column, user: User = None) -> None:
        board = column.board
        logger.info("Column soft-deleted: %s", column.id)
        with transaction.atomic():
            column.soft_delete(deleted_by=user)
            # Recompact order for remaining columns in the board
            for idx, cid in enumerate(
                board.columns.order_by("order").values_list("id", flat=True)
            ):
                Column.objects.filter(id=cid).update(order=idx)


# ─────────────────────────────────────────────────
# Task Service
# ─────────────────────────────────────────────────
class TaskService:
    @staticmethod
    def create(user: User, *, column_id: UUID, **task_data) -> Task:
        """Create a task, ensuring user owns the parent board."""
        assignee_ids = task_data.pop("assignee_ids", [])
        dependency_ids = task_data.pop("dependency_ids", [])
        from django.db.models import Q
        column = get_object_or_404(
            Column.objects.filter(
                Q(board__workspace__owner=user) | Q(board__workspace__members=user)
            ).distinct(),
            id=column_id,
        )
        
        with transaction.atomic():
            task = Task.objects.create(column=column, created_by=user, **task_data)
            if assignee_ids:
                TaskService.sync_assignments(task, assignee_ids)
            if dependency_ids:
                task.dependencies.set(dependency_ids)
        
        logger.info("Task created: %s in column %s", task.id, column.id)
        return task

    @staticmethod
    def get_or_404(task_id: UUID, user: User) -> Task:
        from django.db.models import Q
        return get_object_or_404(
            Task.objects.select_related(
                "column", "column__board", "column__board__workspace"
            ).filter(
                Q(column__board__workspace__owner=user)
                | Q(column__board__workspace__members=user)
            ).distinct(),
            id=task_id,
        )

    @staticmethod
    def update(task: Task, user: User = None, **fields) -> Task:
        update_fields = ["updated_at"]
        assignee_ids = fields.pop("assignee_ids", None)
        dependency_ids = fields.pop("dependency_ids", None)
        assignment_progress = fields.pop("assignment_progress", None)
        
        if user:
            task.updated_by = user
            update_fields.append("updated_by_id")
            
        for key, value in fields.items():
            if key == "assignee_id":
                task.assignee_id = value
                update_fields.append("assignee_id")
            elif key == "parent_id":
                task.parent_id = value
                update_fields.append("parent_id")
            else:
                setattr(task, key, value)
                update_fields.append(key)
        
        with transaction.atomic():
            task.save(update_fields=update_fields)
            if assignee_ids is not None:
                TaskService.sync_assignments(task, assignee_ids)
            if dependency_ids is not None:
                task.dependencies.set(dependency_ids)
            if assignment_progress is not None:
                for item in assignment_progress:
                    TaskAssignment.objects.filter(
                        task=task, user_id=item["user_id"]
                    ).update(individual_progress=item["progress"])

        task.refresh_from_db()

        # If this is a subtask, recalculate parent's per-user progress
        if task.parent_id:
            TaskService.recalculate_parent_progress(task)

        return task

    @staticmethod
    def sync_assignments(task: Task, assignee_ids: list[UUID]):
        """Syncs TaskAssignment records for a task."""
        import random
        # Signature Monday-like colors
        COLORS = ["#0073ea", "#33d391", "#e2445c", "#ffcb00", "#00a9ff", "#9d50bb", "#ff758c"]
        
        with transaction.atomic():
            # Remove assignments not in the new list
            task.assignments.exclude(user_id__in=assignee_ids).delete()
            
            # Add new assignments
            existing_uids = set(task.assignments.values_list("user_id", flat=True))
            for uid in assignee_ids:
                if uid not in existing_uids:
                    TaskAssignment.objects.create(
                        task=task,
                        user_id=uid,
                        user_color=random.choice(COLORS)
                    )

    @staticmethod
    def recalculate_parent_progress(subtask: Task) -> None:
        """
        When a subtask changes column, recalculate individual_progress for the
        assigned user on the parent task (binary: COMPLETED = 100%, else 0%).
        Only updates assignments where the user has at least one subtask assigned.
        """
        if not subtask.parent_id or not subtask.assignee_id:
            return

        parent_assignments = TaskAssignment.objects.filter(
            task_id=subtask.parent_id
        )
        if not parent_assignments.exists():
            return

        all_subtasks = list(
            Task.objects.filter(
                parent_id=subtask.parent_id,
                deleted_at__isnull=True,
            ).select_related("assignee")
        )

        for assignment in parent_assignments:
            user_subtasks = [st for st in all_subtasks if st.assignee_id == assignment.user_id]
            if not user_subtasks:
                continue  # no subtasks for this user → leave manual progress intact
            # Proportional: average the progress values of each user's subtasks
            new_progress = round(sum(st.progress for st in user_subtasks) / len(user_subtasks))
            if new_progress != assignment.individual_progress:
                assignment.individual_progress = new_progress
                assignment.save(update_fields=["individual_progress", "updated_at"])

    @staticmethod
    def delete(task: Task, user: User = None) -> None:
        column = task.column
        parent_id = task.parent_id
        logger.info("Task soft-deleted: %s", task.id)
        with transaction.atomic():
            task.soft_delete(deleted_by=user)
            # Recompact order for remaining tasks in the column
            for idx, tid in enumerate(
                column.tasks.order_by("order").values_list("id", flat=True)
            ):
                Task.objects.filter(id=tid).update(order=idx)
        # If this was a subtask, recalculate parent's per-user progress
        if parent_id:
            TaskService.recalculate_parent_progress(task)

    @staticmethod
    def move(task: Task, *, column_id: UUID, new_order: int, user: User) -> Task:
        """
        Move task to a target column at a given position.
        Handles reordering and auto-date logic based on Column.status.
        """
        from django.db.models import Q
        target_column = get_object_or_404(
            Column.objects.filter(
                Q(board__workspace__owner=user) | Q(board__workspace__members=user)
            ).distinct(),
            id=column_id,
        )
        old_column = task.column

        # ── Bloqueo de avance: solo aplica al mover hacia columnas posteriores ──
        if target_column.order > old_column.order:
            # 1. Verificar tarea padre
            if task.parent_id:
                parent = Task.objects.only("title", "progress").get(id=task.parent_id)
                if parent.progress < 100:
                    raise HttpError(
                        400,
                        f"La tarea padre «{parent.title}» debe completarse al 100% antes de avanzar esta tarea.",
                    )

            # 2. Verificar dependencias (todas deben estar al 100%)
            incomplete_titles = list(
                task.dependencies
                .filter(progress__lt=100)
                .values_list("title", flat=True)[:4]
            )
            if incomplete_titles:
                displayed = incomplete_titles[:3]
                extra = len(incomplete_titles) - len(displayed)
                msg = "Dependencias sin completar: " + ", ".join(f"«{t}»" for t in displayed)
                if extra > 0:
                    msg += f" y {extra} más"
                raise HttpError(400, msg)

        with transaction.atomic():
            # Make room in target column
            Task.objects.filter(
                column=target_column,
                order__gte=new_order,
            ).exclude(id=task.id).update(order=F("order") + 1)

            task.column = target_column
            task.order = new_order
            update_fields = ["column", "order", "updated_at"]

            # Auto-progress based on column position within the board
            total_columns = target_column.board.columns.count()
            if total_columns > 1:
                computed_progress = round(
                    (target_column.order / (total_columns - 1)) * 100
                )
            else:
                computed_progress = 0

            # COMPLETED status always forces 100%
            if target_column.status == ColumnStatus.COMPLETED:
                computed_progress = 100

            if computed_progress != task.progress:
                task.progress = computed_progress
                update_fields.append("progress")

            # Auto-date logic using Column.status
            if target_column.status == ColumnStatus.IN_PROGRESS and not task.start_date:
                task.start_date = date.today()
                update_fields.append("start_date")

            if target_column.status == ColumnStatus.COMPLETED and not task.end_date:
                task.end_date = date.today()
                update_fields.append("end_date")

            task.save(update_fields=update_fields)

            # Recompact old column if task moved between columns
            if old_column.id != target_column.id:
                for idx, tid in enumerate(
                    old_column.tasks.order_by("order").values_list("id", flat=True)
                ):
                    Task.objects.filter(id=tid).update(order=idx)

        task.refresh_from_db()
        logger.info("Task %s moved to column %s at position %d", task.id, target_column.id, new_order)

        # If this is a subtask, recalculate parent's per-user progress
        TaskService.recalculate_parent_progress(task)

        # Create in-app notifications and send email when task changes column
        if old_column.id != target_column.id:
            NotificationService.create_for_task_move(task, old_column, target_column, user)
            from apps.projects.tasks import send_task_moved_email

            send_task_moved_email.delay(
                str(task.id), old_column.name, target_column.name, user.email
            )

        return task


# ─────────────────────────────────────────────────
# Comment Service
# ─────────────────────────────────────────────────
class CommentService:
    @staticmethod
    def list_for_task(task: Task):
        return task.comments.select_related("author").all()

    @staticmethod
    def create(user: User, task: Task, content: str) -> TaskComment:
        comment = TaskComment.objects.create(
            task=task,
            author=user,
            author_email=user.email,
            content=content,
            source=CommentSource.APP,
        )
        # Notify assignee and creator about the new comment
        NotificationService.create_for_comment(comment, user)
        return comment

    @staticmethod
    def create_from_email(task: Task, sender_email: str, content: str, author=None) -> TaskComment:
        return TaskComment.objects.create(
            task=task,
            author=author,
            author_email=sender_email,
            content=content,
            source=CommentSource.EMAIL,
        )


# ─────────────────────────────────────────────────
# Notification Service
# ─────────────────────────────────────────────────
class NotificationService:
    @staticmethod
    def list_for_user(user: User):
        return Notification.objects.filter(user=user).select_related("task")[:50]

    @staticmethod
    def unread_count(user: User) -> int:
        return Notification.objects.filter(user=user, read=False).count()

    @staticmethod
    def mark_read(notification_id, user: User) -> Notification:
        notif = get_object_or_404(Notification, id=notification_id, user=user)
        notif.read = True
        notif.save(update_fields=["read", "updated_at"])
        return notif

    @staticmethod
    def mark_all_read(user: User) -> int:
        return Notification.objects.filter(user=user, read=False).update(read=True)

    @staticmethod
    def create_for_task_move(task: Task, old_column: Column, new_column: Column, user: User):
        """Create notifications for all assignees and creator when task moves."""
        recipients = set()
        # Add all assigned users
        assigned_uids = task.assignments.values_list("user_id", flat=True)
        for uid in assigned_uids:
            if uid != user.id:
                recipients.add(uid)
        
        # Backward compatibility for legacy assignee field
        if task.assignee_id and task.assignee_id != user.id:
            recipients.add(task.assignee_id)
            
        if task.created_by_id and task.created_by_id != user.id:
            recipients.add(task.created_by_id)
            
        if not recipients:
            return []

        ntype = (
            NotificationType.COMPLETED
            if new_column.status == ColumnStatus.COMPLETED
            else NotificationType.MOVED
        )
        message = f'"{task.title}" movida de {old_column.name} a {new_column.name} ({task.progress}%)'

        notifications = Notification.objects.bulk_create([
            Notification(user_id=uid, task=task, type=ntype, message=message)
            for uid in recipients
        ])
        return notifications

    @staticmethod
    def create_for_comment(comment: TaskComment, user: User):
        """Create notifications when a comment is added to a task."""
        task = comment.task
        recipients = set()
        
        # Add all assigned users
        assigned_uids = task.assignments.values_list("user_id", flat=True)
        for uid in assigned_uids:
            if uid != user.id:
                recipients.add(uid)

        if task.assignee_id and task.assignee_id != user.id:
            recipients.add(task.assignee_id)
            
        if task.created_by_id and task.created_by_id != user.id:
            recipients.add(task.created_by_id)
 
        if not recipients:
            return []

        message = f'Nuevo comentario en "{task.title}": {comment.content[:100]}'

        return Notification.objects.bulk_create([
            Notification(
                user_id=uid, task=task,
                type=NotificationType.COMMENT, message=message,
            )
            for uid in recipients
        ])
