from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Project
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["client", "status", "priority", "billing_type", "project_type"]
    search_fields = ["name", "website", "description"]
    ordering_fields = ["name", "priority", "start_date", "created_at"]

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user).select_related("client")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post"], url_path="apply-template")
    def apply_template(self, request, pk=None):
        """Bulk-create tasks on this project from a TaskTemplate (module 5)."""
        from apps.tasks.models import Task, TaskTemplate

        project = self.get_object()
        template_id = request.data.get("template_id")
        template = TaskTemplate.objects.filter(
            id=template_id, owner=request.user
        ).prefetch_related("items").first()
        if template is None:
            return Response({"detail": "Template not found."}, status=404)

        created = Task.objects.bulk_create(
            [
                Task(
                    project=project,
                    title=item.title,
                    category=item.category,
                    estimated_hours=item.estimated_hours,
                )
                for item in template.items.all()
            ]
        )
        from apps.tasks.serializers import TaskSerializer

        return Response(TaskSerializer(created, many=True).data, status=201)
