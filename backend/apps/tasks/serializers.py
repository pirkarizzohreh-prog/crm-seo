from rest_framework import serializers

from .models import Task, TaskCategory, TaskTemplate, TaskTemplateItem


class TaskCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskCategory
        fields = ("id", "name", "group", "default_estimated_hours")


class TaskTemplateItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskTemplateItem
        fields = ("id", "title", "category", "estimated_hours", "order")


class TaskTemplateSerializer(serializers.ModelSerializer):
    items = TaskTemplateItemSerializer(many=True)

    class Meta:
        model = TaskTemplate
        fields = ("id", "name", "description", "project_type", "items")
        read_only_fields = ("id",)

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        template = TaskTemplate.objects.create(
            owner=self.context["request"].user.effective_owner, **validated_data
        )
        TaskTemplateItem.objects.bulk_create(
            [TaskTemplateItem(template=template, **item) for item in items_data]
        )
        return template

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            TaskTemplateItem.objects.bulk_create(
                [TaskTemplateItem(template=instance, **item) for item in items_data]
            )
        return instance


class TaskSerializer(serializers.ModelSerializer):
    actual_hours = serializers.SerializerMethodField()
    project_name = serializers.CharField(source="project.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)

    class Meta:
        model = Task
        fields = (
            "id",
            "project",
            "project_name",
            "assignee",
            "category",
            "category_name",
            "title",
            "description",
            "priority",
            "status",
            "estimated_hours",
            "actual_hours",
            "deadline",
            "recurrence",
            "value_generated",
            "completed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "completed_at", "created_at", "updated_at")

    def get_actual_hours(self, obj):
        return getattr(obj, "actual_hours", None) or 0
