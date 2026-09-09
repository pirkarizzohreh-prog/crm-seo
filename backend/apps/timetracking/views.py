from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.tasks.models import Task

from .models import TimeEntry, TimerSession
from .serializers import TimeEntrySerializer, TimerSessionSerializer


class TimeEntryViewSet(viewsets.ModelViewSet):
    serializer_class = TimeEntrySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["task", "task__project", "date"]
    ordering_fields = ["date", "created_at"]

    def get_queryset(self):
        return TimeEntry.objects.filter(user=self.request.user).select_related(
            "task", "task__project"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TimerView(APIView):
    """The single running timer for the current user (module 7: Start / Pause / Stop)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        timer = TimerSession.objects.filter(user=request.user).select_related("task").first()
        if timer is None:
            return Response(None)
        return Response(TimerSessionSerializer(timer).data)

    def post(self, request):
        """Start a timer for a task. Only one active timer per user."""
        task_id = request.data.get("task")
        task = Task.objects.filter(id=task_id, project__owner=request.user.effective_owner).first()
        if task is None:
            return Response({"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND)

        existing = TimerSession.objects.filter(user=request.user).first()
        if existing is not None:
            return Response(
                {"detail": "A timer is already running. Stop or pause it first."},
                status=status.HTTP_409_CONFLICT,
            )

        timer = TimerSession.objects.create(task=task, user=request.user)
        return Response(TimerSessionSerializer(timer).data, status=status.HTTP_201_CREATED)


class TimerActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, action_name):
        timer = TimerSession.objects.filter(user=request.user).select_related("task").first()
        if timer is None:
            return Response({"detail": "No active timer."}, status=status.HTTP_404_NOT_FOUND)

        if action_name == "pause":
            timer.pause()
            return Response(TimerSessionSerializer(timer).data)
        if action_name == "resume":
            timer.resume()
            return Response(TimerSessionSerializer(timer).data)
        if action_name == "stop":
            entry = timer.stop(notes=request.data.get("notes", ""))
            return Response(TimeEntrySerializer(entry).data, status=status.HTTP_201_CREATED)

        return Response({"detail": "Unknown action."}, status=status.HTTP_400_BAD_REQUEST)
