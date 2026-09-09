from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import MeView, TeamMemberViewSet

router = DefaultRouter()
router.register("team", TeamMemberViewSet, basename="team-member")

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
] + router.urls
