from django.contrib import admin
from django.urls import path, re_path
from django.views.generic import RedirectView
from django.views.static import serve
from django.conf import settings
from theftdetectorbackend.api import api

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", api.urls),
    re_path(r"^api/v1/(?P<path>.*)$", RedirectView.as_view(url="/%(path)s", permanent=False)),
    path("api", RedirectView.as_view(url="/docs", permanent=False)),
    path("alerts/<path:path>", serve, {"document_root": settings.REPO_ROOT / "alerts"}),
]
