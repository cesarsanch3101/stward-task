"""
Django settings — production overrides.
"""

import os

from .base import *  # noqa: F401, F403

DEBUG = False

# ──────────────────────────────────────────────
# Rate limiting — disabled in prod (Cloud Run resets cache on each deploy anyway)
# ──────────────────────────────────────────────
RATE_LIMIT_ENABLED = False

# ──────────────────────────────────────────────
# CORS — strict in production
# ──────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

# ──────────────────────────────────────────────
# Security headers
# ──────────────────────────────────────────────
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")  # Cloud Run / reverse proxy
SECURE_HSTS_SECONDS = 31_536_000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# ──────────────────────────────────────────────
# Database — enforce SSL in production
# ──────────────────────────────────────────────
DATABASES["default"]["OPTIONS"] = {"sslmode": "require"}  # noqa: F405

# ──────────────────────────────────────────────
# Structured logging — JSON in production
# ──────────────────────────────────────────────
LOGGING["root"]["handlers"] = ["json_console"]  # noqa: F405
LOGGING["loggers"]["django"]["handlers"] = ["json_console"]  # noqa: F405
LOGGING["loggers"]["apps"]["handlers"] = ["json_console"]  # noqa: F405

# ──────────────────────────────────────────────
# Content Security Policy
# ──────────────────────────────────────────────
_frontend_url = os.environ.get("FRONTEND_URL", "https://stward-task-1cbf3.web.app")

CSP_POLICY = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline'; "
    f"img-src 'self' data: {_frontend_url}; "
    "font-src 'self'; "
    f"connect-src 'self' {_frontend_url}; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "form-action 'self'"
)
