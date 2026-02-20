from django.contrib import admin

from .models import Board, Column, Task, Workspace


# ─────────────────────────────────────────────────
# Shared mixin for soft-delete + audit admin
# ─────────────────────────────────────────────────
class SoftDeleteAuditAdmin(admin.ModelAdmin):
    """Base admin that shows soft-delete and audit fields."""

    def get_queryset(self, request):
        """Use all_objects to include soft-deleted records in admin."""
        return self.model.all_objects.all()

    def get_readonly_fields(self, request, obj=None):
        base = list(super().get_readonly_fields(request, obj))
        return base + ["created_at", "updated_at", "is_deleted", "deleted_at", "created_by", "updated_by"]

    def get_list_filter(self, request):
        base = list(super().get_list_filter(request))
        return base + ["is_deleted"]


# ─────────────────────────────────────────────────
# Inlines
# ─────────────────────────────────────────────────
class ColumnInline(admin.TabularInline):
    model = Column
    extra = 0
    ordering = ("order",)


class TaskInline(admin.TabularInline):
    model = Task
    extra = 0
    ordering = ("order",)


# ─────────────────────────────────────────────────
# Model admins
# ─────────────────────────────────────────────────
@admin.register(Workspace)
class WorkspaceAdmin(SoftDeleteAuditAdmin):
    list_display = ("name", "owner", "is_deleted", "created_at")
    search_fields = ("name",)


@admin.register(Board)
class BoardAdmin(SoftDeleteAuditAdmin):
    list_display = ("name", "workspace", "is_deleted", "created_at")
    list_filter = ["workspace"]
    inlines = [ColumnInline]


@admin.register(Column)
class ColumnAdmin(SoftDeleteAuditAdmin):
    list_display = ("name", "board", "status", "order", "is_deleted")
    list_filter = ["board", "status"]
    inlines = [TaskInline]


@admin.register(Task)
class TaskAdmin(SoftDeleteAuditAdmin):
    list_display = ("title", "column", "priority", "assignee", "progress", "order", "is_deleted")
    list_filter = ["priority", "column__board"]
    search_fields = ("title",)
