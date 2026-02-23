import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


# ─────────────────────────────────────────────────
# Base mixin
# ─────────────────────────────────────────────────
class TimeStampedModel(models.Model):
    """Base abstracta: UUID pk + timestamps de creación/actualización."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ─────────────────────────────────────────────────
# Soft-delete mixin
# ─────────────────────────────────────────────────
class SoftDeleteManager(models.Manager):
    """Default manager: excludes soft-deleted records."""

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    """Manager that includes soft-deleted records (for admin)."""

    pass


class SoftDeleteModel(models.Model):
    """Mixin for soft-delete support."""

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True

    def soft_delete(self, deleted_by=None):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        update_fields = ["is_deleted", "deleted_at", "updated_at"]
        if deleted_by and hasattr(self, "updated_by_id"):
            self.updated_by = deleted_by
            update_fields.append("updated_by_id")
        self.save(update_fields=update_fields)


# ─────────────────────────────────────────────────
# Audit mixin
# ─────────────────────────────────────────────────
class AuditMixin(models.Model):
    """Mixin for tracking who created/updated a record."""

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_updated",
    )

    class Meta:
        abstract = True


# ─────────────────────────────────────────────────
# Workspace
# ─────────────────────────────────────────────────
class Workspace(TimeStampedModel, SoftDeleteModel, AuditMixin):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_workspaces",
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="workspaces",
        blank=True,
    )

    class Meta:
        db_table = "workspaces"
        verbose_name = "espacio de trabajo"
        verbose_name_plural = "espacios de trabajo"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def soft_delete(self, deleted_by=None):
        # Cascade: soft-delete all boards (which cascades to columns/tasks)
        for board in Board.all_objects.filter(workspace_id=self.id, is_deleted=False):
            board.soft_delete(deleted_by=deleted_by)
        super().soft_delete(deleted_by=deleted_by)


# ─────────────────────────────────────────────────
# Board
# ─────────────────────────────────────────────────
class Board(TimeStampedModel, SoftDeleteModel, AuditMixin):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="boards",
    )

    class Meta:
        db_table = "boards"
        verbose_name = "tablero"
        verbose_name_plural = "tableros"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def soft_delete(self, deleted_by=None):
        # Cascade: soft-delete all columns (which cascades to tasks)
        for column in Column.all_objects.filter(board_id=self.id, is_deleted=False):
            column.soft_delete(deleted_by=deleted_by)
        super().soft_delete(deleted_by=deleted_by)


# ─────────────────────────────────────────────────
# Column — with semantic status for business logic
# ─────────────────────────────────────────────────
class ColumnStatus(models.TextChoices):
    PENDING = "pending", "Pendiente"
    IN_PROGRESS = "in_progress", "En Progreso"
    DELAYED = "delayed", "Retrasado"
    COMPLETED = "completed", "Completado"
    CUSTOM = "custom", "Personalizado"


class Column(TimeStampedModel, SoftDeleteModel, AuditMixin):
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=ColumnStatus.choices,
        default=ColumnStatus.CUSTOM,
        help_text="Estado semántico para lógica de negocio (auto-fechas, progreso).",
    )
    color = models.CharField(
        max_length=7,
        default="#6B7280",
        help_text="Color hexadecimal para el encabezado del grupo (ej: #3B82F6).",
    )

    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name="columns",
    )

    class Meta:
        db_table = "columns"
        verbose_name = "columna"
        verbose_name_plural = "columnas"
        ordering = ["order"]
        indexes = [
            models.Index(fields=["board", "order"]),
        ]

    def __str__(self):
        return f"{self.board.name} / {self.name}"

    def soft_delete(self, deleted_by=None):
        # Cascade: soft-delete all tasks in this column
        Task.all_objects.filter(column_id=self.id, is_deleted=False).update(
            is_deleted=True,
            deleted_at=timezone.now(),
        )
        super().soft_delete(deleted_by=deleted_by)


# ─────────────────────────────────────────────────
# Task
# ─────────────────────────────────────────────────
class Priority(models.TextChoices):
    NONE = "none", "Sin prioridad"
    LOW = "low", "Baja"
    MEDIUM = "medium", "Media"
    HIGH = "high", "Alta"
    URGENT = "urgent", "Urgente"


class Task(TimeStampedModel, SoftDeleteModel, AuditMixin):
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField(default=0)

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.NONE,
    )

    column = models.ForeignKey(
        Column,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="assigned_tasks",
        null=True,
        blank=True,
    )
    assignee_name = models.CharField(
        "persona asignada (externa)",
        max_length=255,
        blank=True,
        default="",
        help_text="Nombre libre para asignar a personas sin cuenta en el sistema.",
    )
    start_date = models.DateField(
        "fecha de inicio",
        null=True,
        blank=True,
    )
    end_date = models.DateField(
        "fecha de finalización",
        null=True,
        blank=True,
    )
    progress = models.PositiveIntegerField(
        "progreso",
        default = 0,
        validators = [MinValueValidator(0), MaxValueValidator(100)],
        help_text = "Porcentaje de avance (0-100)",
    )

    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="subtasks",
        null=True,
        blank=True,
        verbose_name="tarea padre",
        help_text="Permite crear jerarquías (Grupos/Hitos)",
    )
    dependencies = models.ManyToManyField(
        "self",
        symmetrical=False,
        related_name="dependent_tasks",
        blank=True,
        verbose_name="dependencias",
        help_text="Tareas que deben completarse antes que esta",
    )

    class Meta:
        db_table = "tasks"
        verbose_name = "tarea"
        verbose_name_plural = "tareas"
        ordering = ["order"]
        indexes = [
            models.Index(fields=["column", "order"]),
            models.Index(fields=["priority"]),
            models.Index(fields=["assignee"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(progress__lte=100),
                name="progress_max_100",
            ),
        ]

    def clean(self):
        from django.core.exceptions import ValidationError

        super().clean()
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError(
                {"end_date": "La fecha de finalización debe ser posterior a la de inicio."}
            )

    @property
    def total_progress(self):
        """Calculates average progress of all assignments."""
        assignments = self.assignments.all()
        if not assignments.exists():
            return self.progress
        
        progresses = [a.individual_progress for a in assignments]
        return sum(progresses) // len(progresses)

    def __str__(self):
        return self.title


# ─────────────────────────────────────────────────
# Task Assignment (Multi-user)
# ─────────────────────────────────────────────────
class TaskAssignment(TimeStampedModel):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="task_assignments",
    )
    individual_progress = models.PositiveIntegerField(
        "progreso individual",
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    user_color = models.CharField(
        max_length=7,
        default="#0073ea",
        help_text="Color asignado al usuario para esta tarea (hex).",
    )

    class Meta:
        db_table = "task_assignments"
        verbose_name = "asignación de tarea"
        verbose_name_plural = "asignaciones de tareas"
        unique_together = ("task", "user")

    def __str__(self):
        return f"{self.user.email} en {self.task.title}"


# ─────────────────────────────────────────────────
# Task Comment
# ─────────────────────────────────────────────────
class CommentSource(models.TextChoices):
    APP = "app", "Aplicación"
    EMAIL = "email", "Correo electrónico"


class TaskComment(TimeStampedModel):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="task_comments",
    )
    author_email = models.EmailField(blank=True, default="")
    content = models.TextField(max_length=10000)
    source = models.CharField(
        max_length=10,
        choices=CommentSource.choices,
        default=CommentSource.APP,
    )

    class Meta:
        db_table = "task_comments"
        verbose_name = "comentario"
        verbose_name_plural = "comentarios"
        ordering = ["created_at"]

    def __str__(self):
        return f"Comentario en {self.task.title}"


# ─────────────────────────────────────────────────
# Notification
# ─────────────────────────────────────────────────
class NotificationType(models.TextChoices):
    ASSIGNED = "assigned", "Asignada"
    GROUP_ASSIGNED = "group_assigned", "Asignada a grupo"
    MOVED = "moved", "Movida"
    COMMENT = "comment", "Comentario"
    COMPLETED = "completed", "Completada"


class Notification(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
    )
    message = models.TextField(max_length=500)
    read = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = "notifications"
        verbose_name = "notificación"
        verbose_name_plural = "notificaciones"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "read"]),
        ]

    def __str__(self):
        return f"Notificación para {self.user.email}: {self.message[:50]}"
