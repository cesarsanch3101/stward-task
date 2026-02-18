import factory

from apps.accounts.tests.factories import UserFactory
from apps.projects.models import Board, Column, ColumnStatus, Task, Workspace


class WorkspaceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Workspace

    name = factory.Sequence(lambda n: f"Workspace {n}")
    description = "Test workspace"
    owner = factory.SubFactory(UserFactory)

    @factory.post_generation
    def members(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for member in extracted:
                self.members.add(member)
        else:
            self.members.add(self.owner)


class BoardFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Board

    name = factory.Sequence(lambda n: f"Board {n}")
    description = ""
    workspace = factory.SubFactory(WorkspaceFactory)


class ColumnFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Column

    name = "Pendiente"
    order = 0
    status = ColumnStatus.PENDING
    board = factory.SubFactory(BoardFactory)


class TaskFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Task

    title = factory.Sequence(lambda n: f"Task {n}")
    description = ""
    order = factory.Sequence(lambda n: n)
    column = factory.SubFactory(ColumnFactory)
