from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.tasks.models import Task


class TimeEntry(models.Model):
    """A logged block of work (module 7 of the PRD).

    ``notes`` doubles as the activity log entry described in the notes doc
    ("چه کاری انجام شد، لینک صفحه، ...") so the monthly report can be built
    straight from time entries instead of a separate write-up.
    """

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="time_entries")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="time_entries"
    )

    date = models.DateField(default=timezone.localdate)
    duration_hours = models.DecimalField(max_digits=5, decimal_places=2)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    url = models.URLField(blank=True, help_text="Link to the page/document this entry relates to.")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name_plural = "time entries"

    def __str__(self) -> str:
        return f"{self.task} - {self.duration_hours}h on {self.date}"


class TimerSession(models.Model):
    """A live start/pause/stop timer for a task.

    Only one running (non-stopped) timer is expected per user at a time;
    the API layer enforces that. Stopping the timer materializes it into a
    ``TimeEntry``.
    """

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="timer_sessions")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="timer_sessions"
    )

    started_at = models.DateTimeField(default=timezone.now)
    is_running = models.BooleanField(default=True)
    # Time already banked from previous run/pause cycles, in seconds.
    accumulated_seconds = models.PositiveIntegerField(default=0)
    # When is_running=True, the timestamp the current run segment started.
    last_resumed_at = models.DateTimeField(default=timezone.now)

    def current_seconds(self) -> int:
        total = self.accumulated_seconds
        if self.is_running:
            total += int((timezone.now() - self.last_resumed_at).total_seconds())
        return total

    def pause(self) -> None:
        if self.is_running:
            self.accumulated_seconds = self.current_seconds()
            self.is_running = False
            self.save(update_fields=["accumulated_seconds", "is_running"])

    def resume(self) -> None:
        if not self.is_running:
            self.is_running = True
            self.last_resumed_at = timezone.now()
            self.save(update_fields=["is_running", "last_resumed_at"])

    def stop(self, notes: str = "") -> TimeEntry:
        total_seconds = self.current_seconds()
        duration_hours = Decimal(total_seconds) / Decimal(3600)
        entry = TimeEntry.objects.create(
            task=self.task,
            user=self.user,
            date=timezone.localdate(),
            duration_hours=round(duration_hours, 2),
            started_at=self.started_at,
            ended_at=timezone.now(),
            notes=notes,
        )
        self.delete()
        return entry

    def __str__(self) -> str:
        return f"Timer({self.task}, running={self.is_running})"
