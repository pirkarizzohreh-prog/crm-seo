from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        (
            "SEO CRM settings",
            {
                "fields": (
                    "role",
                    "monthly_capacity_hours",
                    "working_days_per_month",
                )
            },
        ),
    )
    list_display = (
        "username",
        "email",
        "role",
        "monthly_capacity_hours",
        "is_staff",
    )
