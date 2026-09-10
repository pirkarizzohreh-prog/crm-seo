from rest_framework import serializers

from apps.core.validators import normalize_url

from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    active_projects_count = serializers.IntegerField(read_only=True)

    def validate_website(self, value):
        return normalize_url(value)

    class Meta:
        model = Client
        fields = (
            "id",
            "name",
            "company_name",
            "phone",
            "email",
            "website",
            "industry",
            "notes",
            "status",
            "active_projects_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
