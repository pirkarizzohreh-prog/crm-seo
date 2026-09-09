from rest_framework import serializers

from .models import Keyword, KeywordRankHistory


class KeywordRankHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = KeywordRankHistory
        fields = ("id", "rank", "checked_on")


class KeywordSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    rank_gap = serializers.IntegerField(read_only=True)
    history = KeywordRankHistorySerializer(many=True, read_only=True)

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
