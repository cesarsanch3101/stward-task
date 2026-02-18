"""Tests for authentication API endpoints."""

import pytest

from apps.accounts.auth import create_access_token, create_refresh_token
from apps.accounts.tests.factories import UserFactory


@pytest.mark.django_db
class TestLogin:
    def test_login_success(self, api_client):
        user = UserFactory()
        response = api_client.post(
            "/auth/login",
            json={"email": user.email, "password": "testpass123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access" in data
        assert "refresh" in data

    def test_login_wrong_password(self, api_client):
        user = UserFactory()
        response = api_client.post(
            "/auth/login",
            json={"email": user.email, "password": "wrongpass"},
        )
        assert response.status_code == 401

    def test_login_nonexistent_user(self, api_client):
        response = api_client.post(
            "/auth/login",
            json={"email": "noone@test.com", "password": "whatever"},
        )
        assert response.status_code == 401


@pytest.mark.django_db
class TestRegister:
    def test_register_success(self, api_client):
        response = api_client.post(
            "/auth/register",
            json={
                "email": "new@test.com",
                "password": "securepass123",
                "first_name": "Test",
                "last_name": "User",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access" in data
        assert "refresh" in data

    def test_register_duplicate_email(self, api_client):
        UserFactory(email="dupe@test.com")
        response = api_client.post(
            "/auth/register",
            json={
                "email": "dupe@test.com",
                "password": "securepass123",
                "first_name": "Test",
                "last_name": "User",
            },
        )
        assert response.status_code == 400


@pytest.mark.django_db
class TestRefresh:
    def test_refresh_valid_token(self, api_client):
        user = UserFactory()
        refresh = create_refresh_token(user)
        response = api_client.post("/auth/refresh", json={"refresh": refresh})
        assert response.status_code == 200
        data = response.json()
        assert "access" in data
        assert "refresh" in data

    def test_refresh_with_access_token(self, api_client):
        user = UserFactory()
        access = create_access_token(user)
        response = api_client.post("/auth/refresh", json={"refresh": access})
        assert response.status_code == 401

    def test_refresh_invalid_token(self, api_client):
        response = api_client.post("/auth/refresh", json={"refresh": "garbage"})
        assert response.status_code == 401


@pytest.mark.django_db
class TestMe:
    def test_me_authenticated(self, api_client):
        user = UserFactory()
        token = create_access_token(user)
        response = api_client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user.email
        assert data["id"] == str(user.id)

    def test_me_unauthenticated(self, api_client):
        response = api_client.get("/auth/me")
        assert response.status_code == 401
