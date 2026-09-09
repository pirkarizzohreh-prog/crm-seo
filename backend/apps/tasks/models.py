from calendar import monthrange
from datetime import date, timedelta

from django.conf import settings
from django.db import models

from apps.projects.models import Project


class TaskCategory(models.Model):
    """SEO work categories (module 4 of the PRD): Technical SEO, Keyword
    Research, Content SEO, Product SEO, Link Building, Reporting, ..."""

    class Group(models.TextChoices):
        TECHNICAL_SEO = "technical_seo", "Technical SEO"
        KEYWORD_RESEARCH = "keyword_research", "Keyword Research"
        CONTENT_SEO = "content_seo", "Content SEO"
        PRODUCT_SEO = "product_seo", "Product SEO"
        LINK_BUILDING = "link_building", "Link Building"
        REPORTING = "reporting", "Reporting"
        DESIGN_DEV = "design_dev", "Design / Development"
        OTHER = "other", "Other"

    name = models.CharField(max_length=120)
    group = models.CharField(max_length=30, choices=Group.choices, default=Group.OTHER)
    default_estimated_hours = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Standard/expected duration for this kind of task, e.g. 'Keyword Research = 3h'.",
    )

    class Meta:
        verbose_name_plural = "task categories"
        ordering = ["group", "name"]

    def __str__(self) -> str:
        return self.name


class TaskTemplate(models.Model):
    """A reusable SEO workflow (module 5 of the PRD), e.g. "Ecommerce SEO
    Project" -> automatically generates a standard set of tasks."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="task_templates"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    project_type = models.CharField(
        max_length=30, choices=Project.ProjectType.choices, blank=True,
        help_text="Optional: suggest this template for a given project type.",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class TaskTemplateItem(models.Model):
    template = models.ForeignKey(
        TaskTemplate, on_delete=models.CASCADE, related_name="items"
    )
    title = models.CharField(max_length=255)
    category = models.ForeignKey(
        TaskCategory, on_delete=models.SET_NULL, null=True, blank=True
    )
    estimated_hours = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.template.name} / {self.title}"


class Task(models.Model):
    """The heart of the system (module 4 of the PRD)."""

    class Status(models.TextChoices):
        BACKLOG = "backlog", "Backlog"
        TODO = "todo", "Todo"
        DOING = "doing", "Doing"
        REVIEW = "review", "Review"
        DONE = "done", "Done"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    class Recurrence(models.TextChoices):
        NONE = "none", "None"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )
    category = models.ForeignKey(
        TaskCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks"
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.MEDIUM
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.TODO
    )
    estimated_hours = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    deadline = models.DateField(null=True, blank=True)

    # Recurring routine work (module: "روتین‌سازی کارها" in the notes doc) —
    # e.g. "بررسی سرچ کنسول" every week, "گزارش ماهانه" every month.
    recurrence = models.CharField(
        max_length=10, choices=Recurrence.choices, default=Recurrence.NONE
    )

    # The Rial/Toman value this task's output represents, so a monthly
    # report can show "60 hours worked -> 28M toman of delivered value"
    # against the contract amount (doc2, section 4).
    value_generated = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )

    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["deadline", "-priority"]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        from django.utils import timezone

        # Keep completed_at in sync with status so the activity log/report
        # (module 4 + doc2 section 2) can show "done on this date" without
        # a separate write from the client.
        becoming_done = self.status == self.Status.DONE and self.completed_at is None
        if becoming_done:
            self.completed_at = timezone.now()
        elif self.status != self.Status.DONE:
            self.completed_at = None
        super().save(*args, **kwargs)

        # Routine SEO work ("بررسی سرچ کنسول هر هفته", "گزارش ماهانه", ...)
        # shouldn't need the strategist to recreate the task by hand every
        # cycle — the moment a recurring task is finished, queue up its next
        # occurrence automatically.
        if becoming_done and self.recurrence != self.Recurrence.NONE:
            self._create_next_occurrence()

    def _create_next_occurrence(self) -> "Task":
        from django.utils import timezone

        base_date = self.deadline or timezone.localdate()
        if self.recurrence == self.Recurrence.WEEKLY:
            next_deadline = base_date + timedelta(days=7)
        else:  # MONTHLY
            next_deadline = _add_one_month(base_date)

        return Task.objects.create(
            project=self.project,
            assignee=self.assignee,
            category=self.category,
            title=self.title,
            description=self.description,
            priority=self.priority,
            status=self.Status.TODO,
            estimated_hours=self.estimated_hours,
            deadline=next_deadline,
            recurrence=self.recurrence,
        )


def _add_one_month(d):
    """Add one calendar month to a date, clamping the day if the target
    month is shorter (e.g. Jan 31 -> Feb 28/29)."""
    year = d.year + (d.month // 12)
    month = d.month % 12 + 1
    day = min(d.day, monthrange(year, month)[1])
    return date(year, month, day)
