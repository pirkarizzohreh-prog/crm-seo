from django.contrib import admin

from .models import Task, TaskCategory, TaskTemplate, TaskTemplateItem


@admin.register(TaskCategory)
class TaskCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "group", "default_estimated_hours")
    list_filter = ("group",)


class TaskTemplateItemInline(admin.TabularInline):
    model = TaskTemplateItem
    extra = 1


@admin.register(TaskTemplate)
class TaskTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "project_type", "owner")
    inlines = [TaskTemplateItemInline]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "project",
        "status",
        "priority",
        "deadline",
        "estimated_hours",
    )
    list_filter = ("status", "priority", "category")
    search_fields = ("title", "project__name")
