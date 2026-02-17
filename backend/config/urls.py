from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI

from apps.projects.api import router as projects_router

api = NinjaAPI(
    title="Stward Task API",
    version="0.1.0",
    description="API de gestión de proyectos Kanban",
)

api.add_router("", projects_router)


@api.get("/health", tags=["system"])
def health_check(request):
    return {"status": "ok"}


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
