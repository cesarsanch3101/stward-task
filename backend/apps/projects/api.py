from datetime import date
from uuid import UUID

from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from ninja import Router

from .models import Board, Column, Task, Workspace
from .schemas import (
    BoardCreateSchema,
    BoardDetailSchema,
    BoardSchema,
    BoardUpdateSchema,
    ColumnCreateSchema,
    ColumnSchema,
    TaskCreateSchema,
    TaskMoveSchema,
    TaskSchema,
    TaskUpdateSchema,
    WorkspaceCreateSchema,
    WorkspaceSchema,
    WorkspaceUpdateSchema,
    WorkspaceWithBoardsSchema,
)

router = Router()

DEFAULT_COLUMNS = ["Pendiente", "En Progreso", "Retrasado", "Completado"]


# ─────────────────────────────────────────────────
# Workspaces
# ─────────────────────────────────────────────────
@router.get("/workspaces", response=list[WorkspaceWithBoardsSchema], tags=["workspaces"])
def list_workspaces(request):
    return Workspace.objects.prefetch_related("boards").all()


@router.post("/workspaces", response={201: WorkspaceSchema}, tags=["workspaces"])
def create_workspace(request, payload: WorkspaceCreateSchema):
    # TODO: replace with request.auth when auth is wired up
    from apps.accounts.models import User

    owner = User.objects.first()
    ws = Workspace.objects.create(owner=owner, **payload.dict())
    ws.members.add(owner)
    return 201, ws


@router.put("/workspaces/{workspace_id}", response=WorkspaceSchema, tags=["workspaces"])
def update_workspace(request, workspace_id: UUID, payload: WorkspaceUpdateSchema):
    ws = get_object_or_404(Workspace, id=workspace_id)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(ws, field, value)
    ws.save(update_fields=[*payload.dict(exclude_unset=True).keys(), "updated_at"])
    ws.refresh_from_db()
    return ws


@router.delete("/workspaces/{workspace_id}", response={204: None}, tags=["workspaces"])
def delete_workspace(request, workspace_id: UUID):
    ws = get_object_or_404(Workspace, id=workspace_id)
    ws.delete()
    return 204, None


# ─────────────────────────────────────────────────
# Boards
# ─────────────────────────────────────────────────
@router.get("/boards", response=list[BoardSchema], tags=["boards"])
def list_boards(request):
    return Board.objects.select_related("workspace").all()


@router.post("/boards", response={201: BoardDetailSchema}, tags=["boards"])
def create_board(request, payload: BoardCreateSchema):
    with transaction.atomic():
        board = Board.objects.create(**payload.dict())
        for i, name in enumerate(DEFAULT_COLUMNS):
            Column.objects.create(board=board, name=name, order=i)
    return 201, Board.objects.prefetch_related(
        "columns", "columns__tasks", "columns__tasks__assignee"
    ).get(id=board.id)


@router.get("/boards/{board_id}", response=BoardDetailSchema, tags=["boards"])
def get_board(request, board_id: UUID):
    board = get_object_or_404(
        Board.objects.prefetch_related(
            "columns",
            "columns__tasks",
            "columns__tasks__assignee",
        ),
        id=board_id,
    )
    return board


@router.put("/boards/{board_id}", response=BoardSchema, tags=["boards"])
def update_board(request, board_id: UUID, payload: BoardUpdateSchema):
    board = get_object_or_404(Board, id=board_id)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(board, field, value)
    board.save(update_fields=[*payload.dict(exclude_unset=True).keys(), "updated_at"])
    board.refresh_from_db()
    return board


@router.delete("/boards/{board_id}", response={204: None}, tags=["boards"])
def delete_board(request, board_id: UUID):
    board = get_object_or_404(Board, id=board_id)
    board.delete()
    return 204, None


# ─────────────────────────────────────────────────
# Columns
# ─────────────────────────────────────────────────
@router.post(
    "/boards/{board_id}/columns",
    response={201: ColumnSchema},
    tags=["columns"],
)
def create_column(request, board_id: UUID, payload: ColumnCreateSchema):
    board = get_object_or_404(Board, id=board_id)
    column = Column.objects.create(board=board, **payload.dict())
    column.prefetched_tasks = []
    return 201, column


# ─────────────────────────────────────────────────
# Tasks
# ─────────────────────────────────────────────────
@router.post("/tasks", response={201: TaskSchema}, tags=["tasks"])
def create_task(request, payload: TaskCreateSchema):
    data = payload.dict()
    column_id = data.pop("column_id")
    column = get_object_or_404(Column, id=column_id)
    task = Task.objects.create(column=column, **data)
    return 201, task


@router.put("/tasks/{task_id}", response=TaskSchema, tags=["tasks"])
def update_task(request, task_id: UUID, payload: TaskUpdateSchema):
    task = get_object_or_404(Task, id=task_id)
    update_fields = ["updated_at"]
    for field, value in payload.dict(exclude_unset=True).items():
        if field == "assignee_id":
            task.assignee_id = value
            update_fields.append("assignee_id")
        else:
            setattr(task, field, value)
            update_fields.append(field)
    task.save(update_fields=update_fields)
    task.refresh_from_db()
    return task


@router.delete("/tasks/{task_id}", response={204: None}, tags=["tasks"])
def delete_task(request, task_id: UUID):
    task = get_object_or_404(Task.objects.select_related("column"), id=task_id)
    column = task.column
    task.delete()
    for idx, tid in enumerate(
        column.tasks.order_by("order").values_list("id", flat=True)
    ):
        Task.objects.filter(id=tid).update(order=idx)
    return 204, None


@router.post("/tasks/{task_id}/move", response=TaskSchema, tags=["tasks"])
def move_task(request, task_id: UUID, payload: TaskMoveSchema):
    task = get_object_or_404(Task.objects.select_related("column"), id=task_id)
    target_column = get_object_or_404(Column, id=payload.column_id)

    old_column = task.column
    new_order = payload.new_order

    with transaction.atomic():
        Task.objects.filter(
            column=target_column,
            order__gte=new_order,
        ).exclude(id=task.id).update(order=F("order") + 1)

        task.column = target_column
        task.order = new_order
        update_fields = ["column", "order", "updated_at"]

        # Auto-fechas: "En Progreso" → start_date, "Completado" → end_date + 100%
        col_name = target_column.name.lower()
        if "progreso" in col_name and not task.start_date:
            task.start_date = date.today()
            update_fields.append("start_date")
        if col_name == "completado":
            if not task.end_date:
                task.end_date = date.today()
                update_fields.append("end_date")
            if task.progress < 100:
                task.progress = 100
                update_fields.append("progress")

        task.save(update_fields=update_fields)

        if old_column.id != target_column.id:
            for idx, t in enumerate(
                old_column.tasks.order_by("order").values_list("id", flat=True)
            ):
                Task.objects.filter(id=t).update(order=idx)

    task.refresh_from_db()
    return task
