from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/clients/", include("apps.clients.urls")),
    path("api/projects/", include("apps.projects.urls")),
    path("api/tasks/", include("apps.tasks.urls")),
    path("api/time/", include("apps.timetracking.urls")),
    path("api/dashboard/", include("apps.dashboard.urls")),
]
