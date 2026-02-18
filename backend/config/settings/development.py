"""
Django settings — development overrides.
"""

from .base import *  # noqa: F401, F403

DEBUG = True

# ──────────────────────────────────────────────
# CORS — permissive in dev
# ──────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# ──────────────────────────────────────────────
# Security — relaxed for local dev
# ──────────────────────────────────────────────
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
