from django.contrib import admin

from .models import Payment, Project


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


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("project", "amount", "received_on", "notes")
    list_filter = ("received_on",)
    search_fields = ("project__name", "notes")
