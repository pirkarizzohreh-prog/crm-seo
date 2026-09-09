from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import TimeEntryViewSet, TimerActionView, TimerView

router = DefaultRouter()
router.register("entries", TimeEntryViewSet, basename="time-entry")

urlpatterns = [
    path("timer/", TimerView.as_view(), name="timer"),
    path("timer/<str:action_name>/", TimerActionView.as_view(), name="timer-action"),
] + router.urls
