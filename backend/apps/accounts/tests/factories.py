import factory

from apps.accounts.models import User


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@test.com")
    username = factory.LazyAttribute(lambda o: o.email)
    first_name = factory.Faker("first_name", locale="es")
    last_name = factory.Faker("last_name", locale="es")
    password = factory.PostGenerationMethodCall("set_password", "testpass123")
    is_active = True
