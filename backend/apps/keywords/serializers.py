from rest_framework import serializers

from apps.core.validators import normalize_url

from .models import ContentBrief, Keyword, KeywordRankHistory


class KeywordRankHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = KeywordRankHistory
        fields = ("id", "rank", "checked_on")


class KeywordSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    rank_gap = serializers.IntegerField(read_only=True)
    history = KeywordRankHistorySerializer(many=True, read_only=True)

    def validate_url(self, value):
        return normalize_url(value)

    class Meta:
        model = Keyword
        fields = (
            "id",
            "project",
            "project_name",
            "keyword",
            "url",
            "current_rank",
            "target_rank",
            "rank_gap",
            "search_volume",
            "difficulty",
            "last_checked",
            "notes",
            "history",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class RecordRankSerializer(serializers.Serializer):
    rank = serializers.IntegerField(min_value=1)
    checked_on = serializers.DateField(required=False)


class ContentBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentBrief
        fields = (
            "id",
            "project",
            "keyword",
            "target_keyword",
            "competitor_notes",
            "intent",
            "h1",
            "headings",
            "faq",
            "related_keywords",
            "internal_link_suggestions",
            "target_word_count",
            "cta_suggestion",
            "created_at",
        )
        read_only_fields = fields


class GenerateContentBriefSerializer(serializers.Serializer):
    project = serializers.IntegerField()
    keyword = serializers.IntegerField(required=False, allow_null=True)
    target_keyword = serializers.CharField(max_length=255)
    competitor_notes = serializers.CharField(required=False, allow_blank=True)
