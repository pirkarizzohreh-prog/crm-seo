from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Keyword
from .serializers import KeywordSerializer, RecordRankSerializer


class KeywordViewSet(viewsets.ModelViewSet):
    serializer_class = KeywordSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["project"]
    search_fields = ["keyword", "url"]

    def get_queryset(self):
        return (
            Keyword.objects.filter(project__owner=self.request.user)
            .select_related("project")
            .prefetch_related("history")
        )

    @action(detail=True, methods=["post"], url_path="record-rank")
    def record_rank(self, request, pk=None):
        """Log a fresh rank check (e.g. after a manual/weekly SERP check)."""
        keyword = self.get_object()
        serializer = RecordRankSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        keyword.record_rank(**serializer.validated_data)
        # get_object()'s queryset prefetches history; that cache predates the
        # row record_rank() just inserted, so re-fetch before serializing.
        keyword = self.get_queryset().get(pk=keyword.pk)
        return Response(KeywordSerializer(keyword).data)
