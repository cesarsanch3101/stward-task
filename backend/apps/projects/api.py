"""
API Endpoints — thin controllers that delegate to Service Layer.
All endpoints require JWT authentication.
"""

from uuid import UUID

from ninja import Router
from ninja.pagination import PageNumberPagination, paginate

from apps.accounts.auth import jwt_auth

from .schemas import (
    BoardCreateSchema,
    BoardDetailSchema,
    BoardSchema,
    BoardUpdateSchema,
    ColumnCreateSchema,
    ColumnSchema,
    ColumnUpdateSchema,
    NotificationCountSchema,
    NotificationSchema,
    TaskCommentCreateSchema,
    TaskCommentSchema,
    TaskCreateSchema,
    TaskMoveSchema,
    TaskSchema,
    TaskUpdateSchema,
    WorkspaceCreateSchema,
    WorkspaceSchema,
    WorkspaceUpdateSchema,
    WorkspaceWithBoardsSchema,
    UserMinimalSchema,
)
from .services import (
    BoardService,
    ColumnService,
    CommentService,
    NotificationService,
    TaskService,
    WorkspaceService,
)

router = Router(auth=jwt_auth)


# ─────────────────────────────────────────────────
# Workspaces
# ─────────────────────────────────────────────────
@router.get("/workspaces", response=list[WorkspaceWithBoardsSchema], tags=["workspaces"])
@paginate(PageNumberPagination, page_size=20)
def list_workspaces(request):
    return WorkspaceService.list_for_user(request.auth)


@router.post("/workspaces", response={201: WorkspaceSchema}, tags=["workspaces"])
def create_workspace(request, payload: WorkspaceCreateSchema):
    ws = WorkspaceService.create(
        request.auth,
        name=payload.name,
        description=payload.description,
    )
    return 201, ws


@router.put("/workspaces/{workspace_id}", response=WorkspaceSchema, tags=["workspaces"])
def update_workspace(request, workspace_id: UUID, payload: WorkspaceUpdateSchema):
    ws = WorkspaceService.get_or_404(workspace_id, request.auth)
    fields = payload.dict(exclude_unset=True)
    return WorkspaceService.update(ws, user=request.auth, **fields)


@router.delete("/workspaces/{workspace_id}", response={204: None}, tags=["workspaces"])
def delete_workspace(request, workspace_id: UUID):
    ws = WorkspaceService.get_or_404(workspace_id, request.auth)
    WorkspaceService.delete(ws, user=request.auth)
    return 204, None


@router.get("/workspaces/{workspace_id}/members", response=list[UserMinimalSchema], tags=["workspaces"])
def list_workspace_members(request, workspace_id: UUID):
    ws = WorkspaceService.get_or_404(workspace_id, request.auth)
    return ws.members.all()


# ─────────────────────────────────────────────────
# Boards
# ─────────────────────────────────────────────────
@router.get("/boards", response=list[BoardSchema], tags=["boards"])
@paginate(PageNumberPagination, page_size=20)
def list_boards(request):
    return BoardService.list_for_user(request.auth)


@router.post("/boards", response={201: BoardDetailSchema}, tags=["boards"])
def create_board(request, payload: BoardCreateSchema):
    board = BoardService.create(
        request.auth,
        name=payload.name,
        description=payload.description,
        workspace_id=payload.workspace_id,
    )
    return 201, board


@router.get("/boards/{board_id}", response=BoardDetailSchema, tags=["boards"])
def get_board(request, board_id: UUID):
    return BoardService.get_detail(board_id, request.auth)


@router.put("/boards/{board_id}", response=BoardSchema, tags=["boards"])
def update_board(request, board_id: UUID, payload: BoardUpdateSchema):
    board = BoardService.get_or_404(board_id, request.auth)
    fields = payload.dict(exclude_unset=True)
    return BoardService.update(board, user=request.auth, **fields)


@router.delete("/boards/{board_id}", response={204: None}, tags=["boards"])
def delete_board(request, board_id: UUID):
    board = BoardService.get_or_404(board_id, request.auth)
    BoardService.delete(board, user=request.auth)
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
    column = ColumnService.create(
        request.auth,
        board_id,
        name=payload.name,
        order=payload.order,
        status=payload.status,
        color=payload.color,
    )
    return 201, column


@router.put("/columns/{column_id}", response=ColumnSchema, tags=["columns"])
def update_column(request, column_id: UUID, payload: ColumnUpdateSchema):
    column = ColumnService.get_or_404(column_id, request.auth)
    fields = payload.dict(exclude_unset=True)
    return ColumnService.update(column, user=request.auth, **fields)


@router.delete("/columns/{column_id}", response={204: None}, tags=["columns"])
def delete_column(request, column_id: UUID):
    column = ColumnService.get_or_404(column_id, request.auth)
    ColumnService.delete(column, user=request.auth)
    return 204, None


# ─────────────────────────────────────────────────
# Tasks
# ─────────────────────────────────────────────────
@router.post("/tasks", response={201: TaskSchema}, tags=["tasks"])
def create_task(request, payload: TaskCreateSchema):
    data = payload.dict(exclude={"column_id"}, exclude_none=True)
    task = TaskService.create(request.auth, column_id=payload.column_id, **data)
    return 201, task


@router.put("/tasks/{task_id}", response=TaskSchema, tags=["tasks"])
def update_task(request, task_id: UUID, payload: TaskUpdateSchema):
    task = TaskService.get_or_404(task_id, request.auth)
    fields = payload.dict(exclude_unset=True)
    return TaskService.update(task, user=request.auth, **fields)


@router.delete("/tasks/{task_id}", response={204: None}, tags=["tasks"])
def delete_task(request, task_id: UUID):
    task = TaskService.get_or_404(task_id, request.auth)
    TaskService.delete(task, user=request.auth)
    return 204, None


@router.post("/tasks/{task_id}/move", response=TaskSchema, tags=["tasks"])
def move_task(request, task_id: UUID, payload: TaskMoveSchema):
    task = TaskService.get_or_404(task_id, request.auth)
    return TaskService.move(
        task,
        column_id=payload.column_id,
        new_order=payload.new_order,
        user=request.auth,
    )


# ─────────────────────────────────────────────────
# Comments
# ─────────────────────────────────────────────────
@router.get(
    "/tasks/{task_id}/comments",
    response=list[TaskCommentSchema],
    tags=["comments"],
)
def list_comments(request, task_id: UUID):
    task = TaskService.get_or_404(task_id, request.auth)
    return CommentService.list_for_task(task)


@router.post(
    "/tasks/{task_id}/comments",
    response={201: TaskCommentSchema},
    tags=["comments"],
)
def create_comment(request, task_id: UUID, payload: TaskCommentCreateSchema):
    task = TaskService.get_or_404(task_id, request.auth)
    return 201, CommentService.create(request.auth, task, payload.content)


# ─────────────────────────────────────────────────
# Notifications
# ─────────────────────────────────────────────────
@router.get("/notifications", response=list[NotificationSchema], tags=["notifications"])
def list_notifications(request):
    return NotificationService.list_for_user(request.auth)


@router.get("/notifications/count", response=NotificationCountSchema, tags=["notifications"])
def notification_count(request):
    return {"unread": NotificationService.unread_count(request.auth)}


@router.post(
    "/notifications/{notification_id}/read",
    response=NotificationSchema,
    tags=["notifications"],
)
def mark_notification_read(request, notification_id: UUID):
    return NotificationService.mark_read(notification_id, request.auth)


@router.post("/notifications/read-all", response={204: None}, tags=["notifications"])
def mark_all_read(request):
    NotificationService.mark_all_read(request.auth)
    return 204, None
