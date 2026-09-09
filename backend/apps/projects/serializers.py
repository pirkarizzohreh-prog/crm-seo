from rest_framework import serializers

from .models import Project
from .services import project_financials


class ProjectFinancialsSerializer(serializers.Serializer):
    revenue_amount = serializers.DecimalField(max_digits=14, decimal_places=2, allow_null=True)
    capacity_hours = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True)
    estimated_monthly_hours = serializers.DecimalField(
        max_digits=6, decimal_places=2, allow_null=True
    )
    logged_hours = serializers.DecimalField(max_digits=6, decimal_places=2)
    variance_hours = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True)
    effective_hourly_rate = serializers.DecimalField(
        max_digits=12, decimal_places=2, allow_null=True
    )
    profitability_status = serializers.CharField()


class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    financials = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            "id",
            "client",
            "client_name",
            "name",
            "website",
            "project_type",
            "billing_type",
            "start_date",
            "end_date",
            "priority",
            "status",
            "description",
            "budget",
            "hourly_rate",
            "monthly_revenue_target",
            "estimated_monthly_hours",
            "financials",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_financials(self, obj):
        return ProjectFinancialsSerializer(project_financials(obj)).data


class CompletedTaskReportSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    category_name = serializers.CharField(allow_null=True)
    category_group = serializers.CharField(allow_null=True)
    completed_at = serializers.DateTimeField()
    value_generated = serializers.DecimalField(max_digits=14, decimal_places=2, allow_null=True)


class HoursByCategorySerializer(serializers.Serializer):
    category_name = serializers.CharField()
    hours = serializers.DecimalField(max_digits=8, decimal_places=2)


class MonthlyReportSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    project_name = serializers.CharField()
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    completed_tasks = CompletedTaskReportSerializer(many=True)
    hours_by_category = HoursByCategorySerializer(many=True)
    total_hours = serializers.DecimalField(max_digits=8, decimal_places=2)
    total_value_generated = serializers.DecimalField(max_digits=14, decimal_places=2)
    contract_amount = serializers.DecimalField(max_digits=14, decimal_places=2, allow_null=True)
    task_count = serializers.IntegerField()
