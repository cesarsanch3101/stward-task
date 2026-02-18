"""
JWT Authentication for Django Ninja.
Stateless token-based auth using PyJWT.
"""

import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from django.conf import settings
from ninja.security import HttpBearer

from .models import User

logger = logging.getLogger(__name__)


def _get_jwt_config():
    """Read JWT settings from Django config."""
    jwt_conf = getattr(settings, "SIMPLE_JWT", {})
    return {
        "access_lifetime": jwt_conf.get("ACCESS_TOKEN_LIFETIME", timedelta(minutes=30)),
        "refresh_lifetime": jwt_conf.get("REFRESH_TOKEN_LIFETIME", timedelta(days=7)),
    }


def create_access_token(user: User) -> str:
    """Generate a signed JWT access token for the given user."""
    config = _get_jwt_config()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "type": "access",
        "iat": now,
        "exp": now + config["access_lifetime"],
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def create_refresh_token(user: User) -> str:
    """Generate a signed JWT refresh token for the given user."""
    config = _get_jwt_config()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "type": "refresh",
        "iat": now,
        "exp": now + config["refresh_lifetime"],
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token. Raises jwt.PyJWTError on failure."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])


def create_token_pair(user: User) -> dict:
    """Create both access and refresh tokens."""
    return {
        "access": create_access_token(user),
        "refresh": create_refresh_token(user),
    }


class JWTAuth(HttpBearer):
    """
    Django Ninja authentication class.
    Validates Bearer token and attaches user to request.
    """

    def authenticate(self, request, token: str) -> User | None:
        try:
            payload = decode_token(token)

            if payload.get("type") != "access":
                logger.warning("Non-access token used for authentication")
                return None

            user_id = UUID(payload["sub"])
            user = User.objects.get(id=user_id, is_active=True)
            return user

        except jwt.ExpiredSignatureError:
            logger.debug("Expired JWT token")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning("Invalid JWT token: %s", e)
            return None
        except User.DoesNotExist:
            logger.warning("JWT token references non-existent user")
            return None
        except (KeyError, ValueError) as e:
            logger.warning("Malformed JWT payload: %s", e)
            return None


# Singleton instance for use in API decorators
jwt_auth = JWTAuth()
