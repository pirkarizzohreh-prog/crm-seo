from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsOwnerOrReadOnly

from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filterset_fields = ["status", "industry"]
    search_fields = ["name", "company_name", "email", "website"]
    ordering_fields = ["name", "created_at"]

    def get_queryset(self):
        return (
            Client.objects.filter(owner=self.request.user.effective_owner)
            .annotate(
                active_projects_count=Count(
                    "projects", filter=Q(projects__status="active")
                )
            )
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user.effective_owner)
