import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user: UUID as PK, email as unique identifier.
    Keeps username for Django admin compatibility but email is the
    primary login field.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField("correo electrónico", unique=True)

    class UserRole(models.TextChoices):
        ADMIN = "administrador", "Administrador"
        MANAGER = "gestor", "Gestor"
        DEVELOPER = "desarrollador", "Desarrollador"
        VIEWER = "observador", "Observador"

    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.DEVELOPER,
        verbose_name="rol",
    )

    google_id = models.CharField(
        max_length=255, unique=True, null=True, blank=True,
        verbose_name="Google ID",
    )
    avatar_url = models.URLField(
        max_length=500, null=True, blank=True,
        verbose_name="URL del avatar",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email


class AllowedEmail(models.Model):
    """
    Allowlist de acceso por email específico o dominio completo.
    El rol se pre-asigna y se aplica al crear la cuenta vía Google OAuth2.
    """

    email = models.EmailField(unique=True, null=True, blank=True, verbose_name="correo")
    domain = models.CharField(
        max_length=255, null=True, blank=True, verbose_name="dominio",
        help_text="ej: stwards.com — permite todos los emails de ese dominio",
    )
    role = models.CharField(
        max_length=20,
        choices=User.UserRole.choices,
        default=User.UserRole.DEVELOPER,
        verbose_name="rol asignado",
    )
    name = models.CharField(
        max_length=255, null=True, blank=True,
        verbose_name="nombre",
        help_text="Nombre del usuario (opcional). Se usa como nombre visible al hacer su primer login con Google.",
    )
    invited_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="invitations", verbose_name="invitado por",
    )
    used_at = models.DateTimeField(null=True, blank=True, verbose_name="usado el")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "allowed_emails"
        verbose_name = "email permitido"
        verbose_name_plural = "emails permitidos"
        constraints = [
            models.CheckConstraint(
                check=models.Q(email__isnull=False) | models.Q(domain__isnull=False),
                name="allowedemail_email_or_domain_required",
            )
        ]

    def __str__(self):
        return self.email or f"@{self.domain}"
