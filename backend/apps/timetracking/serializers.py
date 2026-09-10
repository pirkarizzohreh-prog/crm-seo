from rest_framework import serializers

from apps.core.validators import normalize_url

from .models import TimeEntry, TimerSession


class TimeEntrySerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source="task.title", read_only=True)
    project_name = serializers.CharField(source="task.project.name", read_only=True)

    def validate_url(self, value):
        return normalize_url(value)

    class Meta:
        model = TimeEntry
        fields = (
            "id",
            "task",
            "task_title",
            "project_name",
            "date",
            "duration_hours",
            "started_at",
            "ended_at",
            "notes",
            "url",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class TimerSessionSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source="task.title", read_only=True)
    current_seconds = serializers.SerializerMethodField()

    class Meta:
        model = TimerSession
        fields = (
            "id",
            "task",
            "task_title",
            "started_at",
            "is_running",
            "accumulated_seconds",
            "last_resumed_at",
            "current_seconds",
        )
        read_only_fields = fields

    def get_current_seconds(self, obj):
        return obj.current_seconds()
