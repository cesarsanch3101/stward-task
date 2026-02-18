"""
Authentication API endpoints.
"""

import logging

import jwt
from django.contrib.auth import authenticate
from ninja import Router

from .auth import create_token_pair, decode_token, jwt_auth
from .models import User
from .schemas import (
    ErrorSchema,
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
    user = authenticate(request, username=payload.email, password=payload.password)

    if user is None:
        logger.info("Failed login attempt for email: %s", payload.email)
        return 401, {"detail": "Credenciales inválidas."}

    if not user.is_active:
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
    """Create a new user account and return JWT token pair."""
    if User.objects.filter(email=payload.email).exists():
        return 400, {"detail": "Ya existe una cuenta con ese correo electrónico."}

    user = User.objects.create_user(
        username=payload.email,
        email=payload.email,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
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
