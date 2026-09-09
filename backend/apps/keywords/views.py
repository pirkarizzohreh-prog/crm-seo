from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .ai import ContentBriefNotConfigured, generate_content_brief
from .models import ContentBrief, Keyword
from .serializers import (
    ContentBriefSerializer,
    GenerateContentBriefSerializer,
    KeywordSerializer,
    RecordRankSerializer,
)


class KeywordViewSet(viewsets.ModelViewSet):
    serializer_class = KeywordSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["project"]
    search_fields = ["keyword", "url"]

    def get_queryset(self):
        return (
            Keyword.objects.filter(project__owner=self.request.user.effective_owner)
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


class ContentBriefViewSet(viewsets.ModelViewSet):
    """List/view past AI-generated briefs, and generate new ones (notes doc:
    'تولید Brief محتوا با هوش مصنوعی'). Read-only apart from `generate` —
    a brief is a record of what the AI produced, not something to hand-edit."""

    http_method_names = ["get", "post", "head", "options"]
    serializer_class = ContentBriefSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["project", "keyword"]

    def get_queryset(self):
        return ContentBrief.objects.filter(project__owner=self.request.user.effective_owner)

    def create(self, request, *args, **kwargs):
        # POST here always means "generate a new brief" — there's no
        # plain create/update; the AI call is the only way one is written.
        return self.generate(request)

    @action(detail=False, methods=["post"])
    def generate(self, request):
        serializer = GenerateContentBriefSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from apps.projects.models import Project

        project_obj = Project.objects.filter(
            id=data["project"], owner=request.user.effective_owner
        ).first()
        if project_obj is None:
            return Response({"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        keyword_obj = None
        if data.get("keyword"):
            keyword_obj = Keyword.objects.filter(
                id=data["keyword"], project=project_obj
            ).first()

        try:
            result = generate_content_brief(
                target_keyword=data["target_keyword"],
                competitor_notes=data.get("competitor_notes"),
            )
        except ContentBriefNotConfigured as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:  # SDK errors: auth/rate-limit/connection/etc.
            return Response(
                {"detail": f"خطا در تولید بریف: {exc}"}, status=status.HTTP_502_BAD_GATEWAY
            )

        brief = ContentBrief.objects.create(
            project=project_obj,
            keyword=keyword_obj,
            target_keyword=data["target_keyword"],
            competitor_notes=data.get("competitor_notes", ""),
            intent=result.intent,
            h1=result.h1,
            headings=[h.model_dump() for h in result.headings],
            faq=result.faq,
            related_keywords=result.related_keywords,
            internal_link_suggestions=result.internal_link_suggestions,
            target_word_count=result.target_word_count,
            cta_suggestion=result.cta_suggestion,
            created_by=request.user,
        )
        return Response(ContentBriefSerializer(brief).data, status=status.HTTP_201_CREATED)
