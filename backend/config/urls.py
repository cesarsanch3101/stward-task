from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI

from apps.accounts.api import router as auth_router
from apps.projects.api import router as projects_router

api = NinjaAPI(
    title="Stward Task API",
    version="1.0.0",
    description="API de gestión de proyectos Kanban — Stward Task",
)

api.add_router("/auth", auth_router)
api.add_router("", projects_router)


@api.get("/health", tags=["system"], auth=None)
def health_check(request):
    from django.db import connection

    try:
        connection.ensure_connection()
    except Exception:
        return api.create_response(request, {"status": "unhealthy"}, status=503)
    return {"status": "ok"}


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
