"""Tests for the Service Layer."""

import pytest

from apps.accounts.tests.factories import UserFactory
from apps.projects.models import Board, ColumnStatus, Task, Workspace
from apps.projects.services import BoardService, ColumnService, TaskService, WorkspaceService


@pytest.mark.django_db
class TestWorkspaceService:
    def test_create(self):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="Mi Espacio", description="Desc")
        assert ws.name == "Mi Espacio"
        assert ws.owner == user
        assert user in ws.members.all()

    def test_list_for_user(self):
        user = UserFactory()
        WorkspaceService.create(user, name="WS1")
        WorkspaceService.create(user, name="WS2")
        other = UserFactory()
        WorkspaceService.create(other, name="Other")
        result = list(WorkspaceService.list_for_user(user))
        assert len(result) == 2

    def test_get_or_404_success(self):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="Test")
        found = WorkspaceService.get_or_404(ws.id, user)
        assert found.id == ws.id

    def test_get_or_404_wrong_user(self):
        user = UserFactory()
        other = UserFactory()
        ws = WorkspaceService.create(user, name="Test")
        from django.http import Http404

        with pytest.raises(Http404):
            WorkspaceService.get_or_404(ws.id, other)

    def test_update(self):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="Old")
        updated = WorkspaceService.update(ws, name="New")
        assert updated.name == "New"

    def test_delete(self):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="ToDelete")
        ws_id = ws.id
        WorkspaceService.delete(ws)
        assert not Workspace.objects.filter(id=ws_id).exists()


@pytest.mark.django_db
class TestBoardService:
    def test_create_with_default_columns(self):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        board = BoardService.create(user, name="Board", workspace_id=ws.id)
        assert board.name == "Board"
        columns = list(board.columns.order_by("order"))
        assert len(columns) == 4
        assert columns[0].status == ColumnStatus.PENDING
        assert columns[1].status == ColumnStatus.IN_PROGRESS
        assert columns[2].status == ColumnStatus.DELAYED
        assert columns[3].status == ColumnStatus.COMPLETED

    def test_list_for_user(self):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        BoardService.create(user, name="B1", workspace_id=ws.id)
        BoardService.create(user, name="B2", workspace_id=ws.id)
        result = list(BoardService.list_for_user(user))
        assert len(result) == 2

    def test_get_detail(self):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        board = BoardService.create(user, name="B", workspace_id=ws.id)
        detail = BoardService.get_detail(board.id, user)
        assert detail.id == board.id
        # Columns should be prefetched
        assert hasattr(detail, "columns")

    def test_get_or_404_wrong_user(self):
        user = UserFactory()
        other = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        board = BoardService.create(user, name="B", workspace_id=ws.id)
        from django.http import Http404

        with pytest.raises(Http404):
            BoardService.get_or_404(board.id, other)

    def test_update(self):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        board = BoardService.create(user, name="Old", workspace_id=ws.id)
        updated = BoardService.update(board, name="New")
        assert updated.name == "New"

    def test_delete(self):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        board = BoardService.create(user, name="B", workspace_id=ws.id)
        board_id = board.id
        BoardService.delete(board)
        assert not Board.objects.filter(id=board_id).exists()


@pytest.mark.django_db
class TestColumnService:
    def test_create(self):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        board = BoardService.create(user, name="B", workspace_id=ws.id)
        col = ColumnService.create(user, board.id, name="Custom", order=5, status="custom")
        assert col.name == "Custom"
        assert col.order == 5
        assert col.status == "custom"


@pytest.mark.django_db
class TestTaskService:
    def _setup_board(self):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        board = BoardService.create(user, name="Board", workspace_id=ws.id)
        columns = list(board.columns.order_by("order"))
        return user, board, columns

    def test_create(self):
        user, board, columns = self._setup_board()
        task = TaskService.create(user, column_id=columns[0].id, title="Task 1")
        assert task.title == "Task 1"
        assert task.column_id == columns[0].id

    def test_create_wrong_user(self):
        user, board, columns = self._setup_board()
        other = UserFactory()
        from django.http import Http404

        with pytest.raises(Http404):
            TaskService.create(other, column_id=columns[0].id, title="Nope")

    def test_get_or_404(self):
        user, board, columns = self._setup_board()
        task = TaskService.create(user, column_id=columns[0].id, title="T")
        found = TaskService.get_or_404(task.id, user)
        assert found.id == task.id

    def test_update(self):
        user, board, columns = self._setup_board()
        task = TaskService.create(user, column_id=columns[0].id, title="Old")
        updated = TaskService.update(task, title="New", priority="high")
        assert updated.title == "New"
        assert updated.priority == "high"

    def test_delete_recompacts_order(self):
        user, board, columns = self._setup_board()
        col = columns[0]
        t0 = TaskService.create(user, column_id=col.id, title="T0", order=0)
        t1 = TaskService.create(user, column_id=col.id, title="T1", order=1)
        t2 = TaskService.create(user, column_id=col.id, title="T2", order=2)

        TaskService.delete(t1)

        t0.refresh_from_db()
        t2.refresh_from_db()
        assert t0.order == 0
        assert t2.order == 1
        assert not Task.objects.filter(id=t1.id).exists()

    def test_move_within_same_column(self):
        user, board, columns = self._setup_board()
        col = columns[0]
        t0 = TaskService.create(user, column_id=col.id, title="T0", order=0)
        t1 = TaskService.create(user, column_id=col.id, title="T1", order=1)

        moved = TaskService.move(t1, column_id=col.id, new_order=0, user=user)
        assert moved.order == 0
        t0.refresh_from_db()
        assert t0.order == 1

    def test_move_to_in_progress_sets_start_date(self):
        user, board, columns = self._setup_board()
        pending = columns[0]  # PENDING
        in_progress = columns[1]  # IN_PROGRESS

        task = TaskService.create(user, column_id=pending.id, title="T")
        assert task.start_date is None

        moved = TaskService.move(task, column_id=in_progress.id, new_order=0, user=user)
        assert moved.start_date is not None

    def test_move_to_completed_sets_end_date_and_progress(self):
        user, board, columns = self._setup_board()
        pending = columns[0]  # PENDING
        completed = columns[3]  # COMPLETED

        task = TaskService.create(user, column_id=pending.id, title="T", progress=50)

        moved = TaskService.move(task, column_id=completed.id, new_order=0, user=user)
        assert moved.end_date is not None
        assert moved.progress == 100

    def test_move_cross_column_recompacts_old(self):
        user, board, columns = self._setup_board()
        col_a = columns[0]
        col_b = columns[1]

        t0 = TaskService.create(user, column_id=col_a.id, title="T0", order=0)
        t1 = TaskService.create(user, column_id=col_a.id, title="T1", order=1)
        t2 = TaskService.create(user, column_id=col_a.id, title="T2", order=2)

        TaskService.move(t1, column_id=col_b.id, new_order=0, user=user)

        t0.refresh_from_db()
        t2.refresh_from_db()
        assert t0.order == 0
        assert t2.order == 1
