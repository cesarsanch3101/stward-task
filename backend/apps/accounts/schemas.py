"""
Account schemas — auth request/response contracts.
"""

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


class ErrorSchema(Schema):
    detail: str
