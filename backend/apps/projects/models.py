import uuid

from django.conf import settings
from django.db import models


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
# Workspace
# ─────────────────────────────────────────────────
class Workspace(TimeStampedModel):
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


# ─────────────────────────────────────────────────
# Board
# ─────────────────────────────────────────────────
class Board(TimeStampedModel):
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


# ─────────────────────────────────────────────────
# Column
# ─────────────────────────────────────────────────
class Column(TimeStampedModel):
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

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

    def __str__(self):
        return f"{self.board.name} / {self.name}"


# ─────────────────────────────────────────────────
# Task
# ─────────────────────────────────────────────────
class Priority(models.TextChoices):
    NONE = "none", "Sin prioridad"
    LOW = "low", "Baja"
    MEDIUM = "medium", "Media"
    HIGH = "high", "Alta"
    URGENT = "urgent", "Urgente"


class Task(TimeStampedModel):
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
        "persona asignada",
        max_length=255,
        blank=True,
        default="",
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
        default=0,
        help_text="Porcentaje de avance (0-100)",
    )

    class Meta:
        db_table = "tasks"
        verbose_name = "tarea"
        verbose_name_plural = "tareas"
        ordering = ["order"]

    def __str__(self):
        return self.title
