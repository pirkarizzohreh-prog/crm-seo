from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "client",
        "status",
        "priority",
        "billing_type",
        "budget",
        "owner",
    )
    list_filter = ("status", "priority", "billing_type", "project_type")
    search_fields = ("name", "client__name", "client__company_name")
