import pytest

from apps.accounts.tests.factories import UserFactory
from apps.projects.tests.factories import (
    BoardFactory,
    ColumnFactory,
    TaskFactory,
    WorkspaceFactory,
)


@pytest.fixture
def user_factory():
    return UserFactory


@pytest.fixture
def workspace_factory():
    return WorkspaceFactory


@pytest.fixture
def board_factory():
    return BoardFactory


@pytest.fixture
def column_factory():
    return ColumnFactory


@pytest.fixture
def task_factory():
    return TaskFactory
