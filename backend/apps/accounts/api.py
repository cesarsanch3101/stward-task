"""
Authentication API endpoints.
"""

import logging

import jwt
from django.contrib.auth import authenticate
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError

from .auth import create_token_pair, decode_token, jwt_auth, verify_google_token
from .models import AllowedEmail, User
from .schemas import (
    AllowedEmailCreateSchema,
    AllowedEmailSchema,
    AllowedEmailUpdateSchema,
    ErrorSchema,
    GoogleAuthSchema,
    LoginSchema,
    RefreshSchema,
    RegisterSchema,
    TokenResponseSchema,
    UserSchema,
)

logger = logging.getLogger(__name__)

router = Router(tags=["auth"])


@router.post(
    "/login",
    response={200: TokenResponseSchema, 401: ErrorSchema},
    auth=None,
)
def login(request, payload: LoginSchema):
    """Authenticate user and return JWT token pair."""
    logger.debug("Login attempt for email: %s", payload.email)
    user = authenticate(request, username=payload.email, password=payload.password)

    if user is None:
        logger.warning("Failed login attempt for: %s", payload.email)
        return 401, {"detail": "Credenciales inválidas."}

    if not user.is_active:
        logger.warning("Failed login attempt - inactive user: %s", payload.email)
        return 401, {"detail": "Cuenta desactivada."}

    tokens = create_token_pair(user)
    logger.info("User logged in: %s", user.email)
    return 200, tokens


@router.post(
    "/register",
    response={201: TokenResponseSchema, 400: ErrorSchema},
    auth=None,
)
def register(request, payload: RegisterSchema):
    """Create a new user account, a default workspace, and return JWT token pair."""
    if User.objects.filter(email=payload.email).exists():
        return 400, {"detail": "Ya existe una cuenta con ese correo electrónico."}

    from django.db import transaction
    from apps.projects.services import WorkspaceService

    with transaction.atomic():
        user = User.objects.create_user(
            username=payload.email,
            email=payload.email,
            password=payload.password,
            first_name=payload.first_name,
            last_name=payload.last_name,
        )
        WorkspaceService.create(user, name="Mi Primer Espacio", description="Espacio creado automáticamente.")

    tokens = create_token_pair(user)
    logger.info("New user registered: %s", user.email)
    return 201, tokens


@router.post(
    "/refresh",
    response={200: TokenResponseSchema, 401: ErrorSchema},
    auth=None,
)
def refresh_token(request, payload: RefreshSchema):
    """Exchange a valid refresh token for a new token pair."""
    try:
        token_payload = decode_token(payload.refresh)

        if token_payload.get("type") != "refresh":
            return 401, {"detail": "Token inválido: no es un refresh token."}

        user = User.objects.get(id=token_payload["sub"], is_active=True)
        tokens = create_token_pair(user)
        return 200, tokens

    except jwt.ExpiredSignatureError:
        return 401, {"detail": "Refresh token expirado."}
    except (jwt.InvalidTokenError, User.DoesNotExist, KeyError):
        return 401, {"detail": "Refresh token inválido."}


@router.get(
    "/me",
    response=UserSchema,
    auth=jwt_auth,
)
def me(request):
    """Return the authenticated user's profile."""
    return request.auth


# ─────────────────────────────────────────────────
# Google OAuth2
# ─────────────────────────────────────────────────

@router.post(
    "/google",
    response={200: TokenResponseSchema, 403: ErrorSchema},
    auth=None,
)
def google_auth(request, payload: GoogleAuthSchema):
    """
    Validate a Google id_token, check the allowlist, and return a JWT pair.
    Creates the user on first login if they are in the allowlist.
    """
    id_info = verify_google_token(payload.id_token)
    if not id_info:
        raise HttpError(403, "Token de Google inválido.")

    email = id_info.get("email", "")
    if not email or not id_info.get("email_verified"):
        raise HttpError(403, "El correo de Google no está verificado.")

    domain = email.split("@")[1]

    # Check allowlist: specific email takes priority, then domain
    allowed = (
        AllowedEmail.objects.filter(email=email).first()
        or AllowedEmail.objects.filter(domain=domain).first()
    )
    if not allowed:
        logger.warning("Google login denied — not in allowlist: %s", email)
        raise HttpError(403, "Tu cuenta no tiene acceso. Contacta al administrador.")

    from django.db import transaction
    from apps.projects.services import WorkspaceService

    # Pre-registered name takes priority over Google profile name
    if allowed.name:
        parts = allowed.name.strip().split(" ", 1)
        pre_first = parts[0]
        pre_last = parts[1] if len(parts) > 1 else ""
    else:
        pre_first = id_info.get("given_name", "")
        pre_last = id_info.get("family_name", "")

    with transaction.atomic():
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "first_name": pre_first,
                "last_name": pre_last,
                "google_id": id_info["sub"],
                "avatar_url": id_info.get("picture"),
                "role": allowed.role,
            },
        )
        if not created:
            update_fields = []
            if not user.google_id:
                user.google_id = id_info["sub"]
                update_fields.append("google_id")
            if id_info.get("picture"):
                user.avatar_url = id_info["picture"]
                update_fields.append("avatar_url")
            # Apply pre-registered name if the user has no first_name yet
            if allowed.name and not user.first_name:
                parts = allowed.name.strip().split(" ", 1)
                user.first_name = parts[0]
                user.last_name = parts[1] if len(parts) > 1 else ""
                update_fields.extend(["first_name", "last_name"])
            if update_fields:
                user.save(update_fields=update_fields)
        else:
            WorkspaceService.create(user, name="Mi Primer Espacio", description="Espacio creado automáticamente.")

    # Mark allowlist entry as used on first login
    if not allowed.used_at:
        AllowedEmail.objects.filter(pk=allowed.pk).update(used_at=timezone.now())

    logger.info("Google login %s: %s", "registered" if created else "authenticated", email)
    return create_token_pair(user)


# ─────────────────────────────────────────────────
# AllowedEmail CRUD (admin only)
# ─────────────────────────────────────────────────

def _require_admin(user: User):
    if user.role != User.UserRole.ADMIN:
        raise HttpError(403, "Solo los administradores pueden gestionar el acceso.")


@router.get(
    "/allowed-emails",
    response=list[AllowedEmailSchema],
    auth=jwt_auth,
)
def list_allowed_emails(request):
    """List all allowlist entries. Admin only."""
    _require_admin(request.auth)
    return list(AllowedEmail.objects.order_by("-created_at"))


@router.post(
    "/allowed-emails",
    response={201: AllowedEmailSchema, 400: ErrorSchema},
    auth=jwt_auth,
)
def create_allowed_email(request, payload: AllowedEmailCreateSchema):
    """Add an email or domain to the allowlist. Admin only."""
    _require_admin(request.auth)

    if not payload.email and not payload.domain:
        return 400, {"detail": "Debes especificar un correo o un dominio."}

    if payload.email and AllowedEmail.objects.filter(email=payload.email).exists():
        return 400, {"detail": "Ese correo ya está en la lista."}

    if payload.domain and AllowedEmail.objects.filter(domain=payload.domain).exists():
        return 400, {"detail": "Ese dominio ya está en la lista."}

    if payload.role not in [r[0] for r in User.UserRole.choices]:
        return 400, {"detail": f"Rol inválido: {payload.role}"}

    entry = AllowedEmail.objects.create(
        email=payload.email or None,
        domain=payload.domain or None,
        role=payload.role,
        name=payload.name or None,
        invited_by=request.auth,
    )
    logger.info("AllowedEmail created by %s: %s", request.auth.email, entry)
    return 201, entry


@router.post(
    "/allowed-emails/bulk",
    response={200: list[AllowedEmailSchema], 400: ErrorSchema},
    auth=jwt_auth,
)
def bulk_create_allowed_emails(request, payload: list[AllowedEmailCreateSchema]):
    """
    Create multiple allowlist entries at once. Skips duplicates. Admin only.
    Must be declared BEFORE /{entry_id} routes to avoid Django URL routing conflict.
    """
    _require_admin(request.auth)
    if len(payload) > 200:
        return 400, {"detail": "Máximo 200 entradas por importación."}

    created = []
    for item in payload:
        if not item.email and not item.domain:
            continue
        if item.email and AllowedEmail.objects.filter(email=item.email).exists():
            continue
        if item.domain and AllowedEmail.objects.filter(domain=item.domain).exists():
            continue
        entry = AllowedEmail.objects.create(
            email=item.email or None,
            domain=item.domain or None,
            role=item.role,
            name=item.name or None,
            invited_by=request.auth,
        )
        created.append(entry)

    logger.info("Bulk import by %s: %d entries created", request.auth.email, len(created))
    return 200, created


@router.patch(
    "/allowed-emails/{entry_id}",
    response={200: AllowedEmailSchema, 400: ErrorSchema, 404: ErrorSchema},
    auth=jwt_auth,
)
def update_allowed_email(request, entry_id: int, payload: AllowedEmailUpdateSchema):
    """Update name and/or role of an allowlist entry. Admin only."""
    _require_admin(request.auth)
    try:
        entry = AllowedEmail.objects.get(pk=entry_id)
    except AllowedEmail.DoesNotExist:
        return 404, {"detail": "Entrada no encontrada."}

    if payload.role is not None:
        if payload.role not in [r[0] for r in User.UserRole.choices]:
            return 400, {"detail": f"Rol inválido: {payload.role}"}
        entry.role = payload.role

    if payload.name is not None:
        entry.name = payload.name or None

    entry.save(update_fields=["role", "name"])
    logger.info("AllowedEmail updated by %s: id=%s", request.auth.email, entry_id)
    return 200, entry


@router.delete(
    "/allowed-emails/{entry_id}",
    response={204: None, 404: ErrorSchema},
    auth=jwt_auth,
)
def delete_allowed_email(request, entry_id: int):
    """Remove an entry from the allowlist. Admin only."""
    _require_admin(request.auth)
    try:
        entry = AllowedEmail.objects.get(pk=entry_id)
        entry.delete()
        logger.info("AllowedEmail deleted by %s: id=%s", request.auth.email, entry_id)
        return 204, None
    except AllowedEmail.DoesNotExist:
        return 404, {"detail": "Entrada no encontrada."}
