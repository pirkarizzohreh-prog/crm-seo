from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsOwnerOrReadOnly

from .models import Task, TaskCategory, TaskTemplate
from .serializers import TaskCategorySerializer, TaskSerializer, TaskTemplateSerializer


class TaskCategoryViewSet(viewsets.ModelViewSet):
    # A shared SEO taxonomy, not per-tenant data - every team member can use
    # it, but only the Owner curates it.
    queryset = TaskCategory.objects.all()
    serializer_class = TaskCategorySerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filterset_fields = ["group"]


class TaskTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = TaskTemplateSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return TaskTemplate.objects.filter(
            owner=self.request.user.effective_owner
        ).prefetch_related("items")


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["project", "status", "priority", "category", "assignee"]
    search_fields = ["title", "description"]
    ordering_fields = ["deadline", "priority", "created_at"]

    def get_queryset(self):
        return (
            Task.objects.filter(project__owner=self.request.user.effective_owner)
            .select_related("project", "category", "assignee")
            .annotate(actual_hours=Sum("time_entries__duration_hours"))
        )

    @action(detail=False, methods=["get"])
    def today(self, request):
        """Tasks due today or currently in progress, for the daily view (module 1)."""
        today = timezone.localdate()
        qs = self.filter_queryset(self.get_queryset()).exclude(status=Task.Status.DONE)
        qs = qs.filter(deadline__lte=today) | qs.filter(status=Task.Status.DOING)
        serializer = self.get_serializer(qs.distinct(), many=True)
        return Response(serializer.data)
