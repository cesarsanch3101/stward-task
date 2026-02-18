"""Integration tests for project API endpoints."""

import pytest

from apps.accounts.auth import create_access_token
from apps.accounts.tests.factories import UserFactory
from apps.projects.services import BoardService, TaskService, WorkspaceService


def _auth(user):
    return {"Authorization": f"Bearer {create_access_token(user)}"}


@pytest.mark.django_db
class TestWorkspaceEndpoints:
    def test_list_workspaces_empty(self, api_client):
        user = UserFactory()
        response = api_client.get("/workspaces", headers=_auth(user))
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["count"] == 0

    def test_list_workspaces_paginated(self, api_client):
        user = UserFactory()
        WorkspaceService.create(user, name="WS1")
        WorkspaceService.create(user, name="WS2")
        response = api_client.get("/workspaces", headers=_auth(user))
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["count"] == 2

    def test_create_workspace(self, api_client):
        user = UserFactory()
        response = api_client.post(
            "/workspaces",
            json={"name": "Nuevo", "description": "Desc"},
            headers=_auth(user),
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Nuevo"

    def test_update_workspace(self, api_client):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="Old")
        response = api_client.put(
            f"/workspaces/{ws.id}",
            json={"name": "Updated"},
            headers=_auth(user),
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated"

    def test_delete_workspace(self, api_client):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="Del")
        response = api_client.delete(f"/workspaces/{ws.id}", headers=_auth(user))
        assert response.status_code == 204

    def test_unauthorized_returns_401(self, api_client):
        response = api_client.get("/workspaces")
        assert response.status_code == 401

    def test_user_cannot_access_other_workspace(self, api_client):
        user1 = UserFactory()
        user2 = UserFactory()
        ws = WorkspaceService.create(user1, name="Private")
        response = api_client.put(
            f"/workspaces/{ws.id}",
            json={"name": "Hack"},
            headers=_auth(user2),
        )
        assert response.status_code == 404


@pytest.mark.django_db
class TestBoardEndpoints:
    def test_list_boards_paginated(self, api_client):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        BoardService.create(user, name="B1", workspace_id=ws.id)
        response = api_client.get("/boards", headers=_auth(user))
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["count"] == 1

    def test_create_board(self, api_client):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        response = api_client.post(
            "/boards",
            json={"name": "Board", "workspace_id": str(ws.id)},
            headers=_auth(user),
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Board"
        assert len(data["columns"]) == 4

    def test_get_board_detail(self, api_client):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        board = BoardService.create(user, name="B", workspace_id=ws.id)
        response = api_client.get(f"/boards/{board.id}", headers=_auth(user))
        assert response.status_code == 200
        data = response.json()
        assert len(data["columns"]) == 4

    def test_update_board(self, api_client):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        board = BoardService.create(user, name="Old", workspace_id=ws.id)
        response = api_client.put(
            f"/boards/{board.id}",
            json={"name": "New"},
            headers=_auth(user),
        )
        assert response.status_code == 200
        assert response.json()["name"] == "New"

    def test_delete_board(self, api_client):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        board = BoardService.create(user, name="B", workspace_id=ws.id)
        response = api_client.delete(f"/boards/{board.id}", headers=_auth(user))
        assert response.status_code == 204

    def test_user_cannot_access_other_board(self, api_client):
        user1 = UserFactory()
        user2 = UserFactory()
        ws = WorkspaceService.create(user1, name="WS")
        board = BoardService.create(user1, name="B", workspace_id=ws.id)
        response = api_client.get(f"/boards/{board.id}", headers=_auth(user2))
        assert response.status_code == 404


@pytest.mark.django_db
class TestColumnEndpoints:
    def test_create_column(self, api_client):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        board = BoardService.create(user, name="B", workspace_id=ws.id)
        response = api_client.post(
            f"/boards/{board.id}/columns",
            json={"name": "Custom", "order": 5, "status": "custom"},
            headers=_auth(user),
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Custom"


@pytest.mark.django_db
class TestTaskEndpoints:
    def _setup(self):
        user = UserFactory()
        ws = WorkspaceService.create(user, name="WS")
        board = BoardService.create(user, name="B", workspace_id=ws.id)
        columns = list(board.columns.order_by("order"))
        return user, board, columns

    def test_create_task(self, api_client):
        user, board, columns = self._setup()
        response = api_client.post(
            "/tasks",
            json={"title": "New Task", "column_id": str(columns[0].id)},
            headers=_auth(user),
        )
        assert response.status_code == 201
        assert response.json()["title"] == "New Task"

    def test_update_task(self, api_client):
        user, board, columns = self._setup()
        task = TaskService.create(user, column_id=columns[0].id, title="Old")
        response = api_client.put(
            f"/tasks/{task.id}",
            json={"title": "Updated", "priority": "high"},
            headers=_auth(user),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated"
        assert data["priority"] == "high"

    def test_delete_task(self, api_client):
        user, board, columns = self._setup()
        task = TaskService.create(user, column_id=columns[0].id, title="Del")
        response = api_client.delete(f"/tasks/{task.id}", headers=_auth(user))
        assert response.status_code == 204

    def test_move_task(self, api_client):
        user, board, columns = self._setup()
        task = TaskService.create(user, column_id=columns[0].id, title="Move")
        response = api_client.post(
            f"/tasks/{task.id}/move",
            json={"column_id": str(columns[1].id), "new_order": 0},
            headers=_auth(user),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["column_id"] == str(columns[1].id)

    def test_user_cannot_access_other_task(self, api_client):
        user1, board, columns = self._setup()
        user2 = UserFactory()
        task = TaskService.create(user1, column_id=columns[0].id, title="Private")
        response = api_client.put(
            f"/tasks/{task.id}",
            json={"title": "Hack"},
            headers=_auth(user2),
        )
        assert response.status_code == 404
