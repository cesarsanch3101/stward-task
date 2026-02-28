"""
Account schemas — auth request/response contracts.
"""

from datetime import datetime
from uuid import UUID

from ninja import Field, Schema


class LoginSchema(Schema):
    email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)


class RegisterSchema(Schema):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    first_name: str = Field("", max_length=150)
    last_name: str = Field("", max_length=150)


class RefreshSchema(Schema):
    refresh: str = Field(..., min_length=1)


class TokenResponseSchema(Schema):
    access: str
    refresh: str


class UserSchema(Schema):
    id: UUID
    email: str
    first_name: str
    last_name: str
    role: str
    avatar_url: str | None


class ErrorSchema(Schema):
    detail: str


# ─────────────────────────────────────────────────
# Google OAuth2
# ─────────────────────────────────────────────────

class GoogleAuthSchema(Schema):
    id_token: str = Field(..., min_length=1)


# ─────────────────────────────────────────────────
# AllowedEmail (allowlist)
# ─────────────────────────────────────────────────

class AllowedEmailSchema(Schema):
    id: int
    email: str | None
    domain: str | None
    role: str
    used_at: datetime | None
    created_at: datetime


class AllowedEmailCreateSchema(Schema):
    email: str | None = Field(None, max_length=255)
    domain: str | None = Field(None, max_length=255)
    role: str = Field("desarrollador", max_length=20)
