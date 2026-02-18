from django.contrib import admin

from .models import Board, Column, Task, Workspace


class ColumnInline(admin.TabularInline):
    model = Column
    extra = 0
    ordering = ("order",)


class TaskInline(admin.TabularInline):
    model = Task
    extra = 0
    ordering = ("order",)


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "created_at")
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ("name", "workspace", "created_at")
    list_filter = ("workspace",)
    inlines = [ColumnInline]
    readonly_fields = ("created_at", "updated_at")


@admin.register(Column)
class ColumnAdmin(admin.ModelAdmin):
    list_display = ("name", "board", "status", "order")
    list_filter = ("board", "status")
    inlines = [TaskInline]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "column", "priority", "assignee", "progress", "order")
    list_filter = ("priority", "column__board")
    search_fields = ("title",)
    readonly_fields = ("created_at", "updated_at")
