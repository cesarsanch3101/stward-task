import json as json_lib

import pytest
from django.test import Client


class APIClient:
    """Wrapper around Django's test Client for JSON API testing."""

    def __init__(self):
        self._client = Client()

    def get(self, path, headers=None):
        kwargs = self._build_kwargs(headers)
        return self._client.get(f"/api/v1{path}", **kwargs)

    def post(self, path, json=None, headers=None):
        kwargs = self._build_kwargs(headers)
        return self._client.post(
            f"/api/v1{path}",
            data=json_lib.dumps(json) if json else None,
            content_type="application/json",
            **kwargs,
        )

    def put(self, path, json=None, headers=None):
        kwargs = self._build_kwargs(headers)
        return self._client.put(
            f"/api/v1{path}",
            data=json_lib.dumps(json) if json else None,
            content_type="application/json",
            **kwargs,
        )

    def delete(self, path, headers=None):
        kwargs = self._build_kwargs(headers)
        return self._client.delete(f"/api/v1{path}", **kwargs)

    @staticmethod
    def _build_kwargs(headers):
        if not headers:
            return {}
        kwargs = {}
        for key, value in headers.items():
            django_key = f"HTTP_{key.upper().replace('-', '_')}"
            kwargs[django_key] = value
        return kwargs


@pytest.fixture
def api_client():
    """API test client that prefixes /api and handles JSON."""
    return APIClient()
