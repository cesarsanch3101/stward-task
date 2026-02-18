"""
Rate limiting middleware using Django's cache framework.
Limits per-IP with stricter limits on auth endpoints.
"""

import time

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse


class RateLimitMiddleware:
    """
    Sliding window rate limiter.

    Settings (in Django settings):
        RATE_LIMIT_ENABLED: bool (default True)
        RATE_LIMIT_REQUESTS: int — max requests per window (default 100)
        RATE_LIMIT_WINDOW: int — window in seconds (default 60)
        RATE_LIMIT_AUTH_REQUESTS: int — max for auth endpoints (default 10)
        RATE_LIMIT_AUTH_WINDOW: int — window for auth endpoints (default 60)
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not getattr(settings, "RATE_LIMIT_ENABLED", True):
            return self.get_response(request)

        ip = self._get_client_ip(request)

        is_auth = request.path.startswith("/api/auth/")
        if is_auth:
            max_requests = getattr(settings, "RATE_LIMIT_AUTH_REQUESTS", 10)
            window = getattr(settings, "RATE_LIMIT_AUTH_WINDOW", 60)
            cache_key = f"rl:auth:{ip}"
        else:
            max_requests = getattr(settings, "RATE_LIMIT_REQUESTS", 100)
            window = getattr(settings, "RATE_LIMIT_WINDOW", 60)
            cache_key = f"rl:api:{ip}"

        now = time.time()
        requests_log = cache.get(cache_key, [])
        requests_log = [t for t in requests_log if t > now - window]

        if len(requests_log) >= max_requests:
            retry_after = int(window - (now - requests_log[0]))
            response = JsonResponse(
                {"detail": "Demasiadas solicitudes. Intente nuevamente más tarde."},
                status=429,
            )
            response["Retry-After"] = str(max(retry_after, 1))
            return response

        requests_log.append(now)
        cache.set(cache_key, requests_log, timeout=window)

        return self.get_response(request)

    @staticmethod
    def _get_client_ip(request):
        x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded:
            return x_forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "unknown")
