"""
Django settings — Synology NAS / self-hosted deploy (HTTP, no managed DB).
Like production but without SSL requirements (no HTTPS cert, local PostgreSQL).
"""

import os

from .base import *  # noqa: F401, F403

DEBUG = False

# ──────────────────────────────────────────────
# CORS — strict
# ──────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

# ──────────────────────────────────────────────
# Security headers (sin SSL redirect — HTTP local)
# ──────────────────────────────────────────────
SECURE_SSL_REDIRECT = False      # No HTTPS en LAN
SECURE_HSTS_SECONDS = 0          # Desactivado sin HTTPS
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"
CSRF_COOKIE_SECURE = False       # HTTP only en LAN
SESSION_COOKIE_SECURE = False    # HTTP only en LAN
SECURE_CONTENT_TYPE_NOSNIFF = True

# ──────────────────────────────────────────────
# Database — sin SSL (PostgreSQL local en Docker)
# ──────────────────────────────────────────────
# No añadir sslmode: require — el contenedor postgres no usa TLS

# ──────────────────────────────────────────────
# Structured logging — JSON
# ──────────────────────────────────────────────
LOGGING["root"]["handlers"] = ["json_console"]        # noqa: F405
LOGGING["loggers"]["django"]["handlers"] = ["json_console"]  # noqa: F405
LOGGING["loggers"]["apps"]["handlers"] = ["json_console"]    # noqa: F405
