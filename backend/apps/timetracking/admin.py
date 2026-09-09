from django.contrib import admin

from .models import TimeEntry, TimerSession


@admin.register(TimeEntry)
class TimeEntryAdmin(admin.ModelAdmin):
    list_display = ("task", "user", "date", "duration_hours")
    list_filter = ("date",)
    search_fields = ("task__title", "notes")


@admin.register(TimerSession)
class TimerSessionAdmin(admin.ModelAdmin):
    list_display = ("task", "user", "is_running", "started_at")
