from django.contrib import admin

from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "company_name", "status", "owner", "created_at")
    list_filter = ("status", "industry")
    search_fields = ("name", "company_name", "email")
