from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tasks.serializers import TaskSerializer

from .services import capacity_summary, project_health, recommended_tasks, revenue_summary


class DashboardView(APIView):
    """Everything module 1 of the PRD asks the dashboard to answer."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        tasks, scores = recommended_tasks(user, limit=10)
        today_tasks = TaskSerializer(tasks, many=True).data
        for task_data in today_tasks:
            task_data["priority_score"] = scores.get(task_data["id"])

        capacity = capacity_summary(user)
        revenue = revenue_summary(user)

        return Response(
            {
                "today_tasks": today_tasks,
                "capacity": {
                    "available_hours": capacity.available_hours,
                    "allocated_hours": capacity.allocated_hours,
                    "consumed_hours": capacity.consumed_hours,
                    "remaining_hours": capacity.remaining_hours,
                    "is_overloaded": capacity.is_overloaded,
                    "overloaded_by": capacity.overloaded_by,
                },
                "revenue": {
                    "fixed_and_retainer": revenue.fixed_and_retainer,
                    "hourly": revenue.hourly,
                    "total": revenue.total,
                },
                "project_health": project_health(user),
            }
        )
