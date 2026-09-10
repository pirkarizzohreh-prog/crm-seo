"""Aggregations for the daily dashboard (module 1) and the smart priority
system (module 9): "What should I work on today? Am I overloaded? Which
projects need attention?"
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

from django.db.models import Count, Q, Sum
from django.utils import timezone

from apps.projects.models import Project
from apps.projects.services import current_month_range, logged_hours_for_project
from apps.tasks.models import Task
from apps.timetracking.models import TimeEntry

# --- Smart priority scoring (module 9) ----------------------------------
# Weighted so that a task on a high-priority, high-revenue, overdue project
# always outranks a low-stakes one — tune the constants as your business
# priorities shift, they are intentionally not hard-coded elsewhere.

PROJECT_PRIORITY_POINTS = {"critical": 40, "high": 30, "medium": 15, "low": 5}
TASK_PRIORITY_POINTS = {"urgent": 40, "high": 25, "medium": 10, "low": 0}


def _deadline_points(task: Task, today) -> int:
    if not task.deadline:
        return 0
    days = (task.deadline - today).days
    if days < 0:
        return 50  # overdue
    if days == 0:
        return 35
    if days <= 2:
        return 20
    if days <= 7:
        return 8
    return 0


def _revenue_points(project: Project) -> int:
    amount = project.revenue_amount
    if not amount:
        return 0
    # Every ~5,000,000 toman of monthly revenue adds a point, capped so one
    # very large retainer can't drown out everything else.
    return min(int(amount / Decimal(5_000_000)), 20)


def task_priority_score(task: Task, today=None) -> int:
    today = today or timezone.localdate()
    return (
        PROJECT_PRIORITY_POINTS.get(task.project.priority, 0)
        + TASK_PRIORITY_POINTS.get(task.priority, 0)
        + _deadline_points(task, today)
        + _revenue_points(task.project)
    )


def recommended_tasks(user, limit: int = 10):
    today = timezone.localdate()
    qs = Task.objects.filter(project__owner=user.effective_owner).exclude(status=Task.Status.DONE)
    if not user.is_owner:
        # A staff member's "what should I work on today?" is about their
        # own queue, not the whole business's; the Owner still sees everyone's.
        qs = qs.filter(Q(assignee=user) | Q(assignee__isnull=True))
    tasks = list(qs.select_related("project", "category"))
    scored = [(task_priority_score(t, today), t) for t in tasks]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [task for _score, task in scored[:limit]], {t.id: s for s, t in scored}


def _scope_to_assignee(qs, user):
    if not user.is_owner:
        qs = qs.filter(Q(assignee=user) | Q(assignee__isnull=True))
    return qs


def today_tasks(user, limit: int = 20):
    """Strictly what's due *today* — not the broader smart-priority mix
    ``recommended_tasks`` builds (which also surfaces overdue/soon/no-deadline
    work). The dashboard's "پیشنهاد امروز" card wants exactly today's date."""
    today = timezone.localdate()
    qs = _scope_to_assignee(
        Task.objects.filter(project__owner=user.effective_owner, deadline=today).exclude(
            status=Task.Status.DONE
        ),
        user,
    )
    tasks = list(qs.select_related("project", "category"))
    scored = [(task_priority_score(t, today), t) for t in tasks]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [task for _score, task in scored[:limit]], {t.id: s for s, t in scored}


def overdue_tasks(user, limit: int = 20):
    """Not-done tasks whose deadline has already passed — the "این‌ها رو
    جا انداختی" list, separate from today's plan."""
    today = timezone.localdate()
    qs = _scope_to_assignee(
        Task.objects.filter(project__owner=user.effective_owner, deadline__lt=today).exclude(
            status=Task.Status.DONE
        ),
        user,
    )
    tasks = list(qs.select_related("project", "category").order_by("deadline"))
    return tasks[:limit]


def today_activity(user):
    """What the current user actually logged today: hours + task worked on,
    grouped by project — the "امروز روی چه پروژه‌هایی کار کردم" card — plus
    the total across all of them for a single "امروز چند ساعت کار کردم؟"
    number. Scoped to this user's own TimeEntry rows (not the whole team's),
    since it's a personal "what did I do" view."""
    today = timezone.localdate()
    entries = (
        TimeEntry.objects.filter(user=user, date=today)
        .select_related("task", "task__project")
        .order_by("task__project__name", "created_at")
    )

    by_project: dict[int, dict] = {}
    total_hours = Decimal("0")
    for entry in entries:
        project = entry.task.project
        bucket = by_project.setdefault(
            project.id,
            {"project_id": project.id, "project_name": project.name, "hours": Decimal("0"), "entries": []},
        )
        bucket["hours"] += entry.duration_hours
        bucket["entries"].append(
            {
                "task_title": entry.task.title,
                "hours": entry.duration_hours,
                "notes": entry.notes,
            }
        )
        total_hours += entry.duration_hours

    return list(by_project.values()), total_hours


# --- Capacity planning (module 8) ---------------------------------------


@dataclass
class CapacitySummary:
    available_hours: Decimal
    allocated_hours: Decimal
    consumed_hours: Decimal
    remaining_hours: Decimal
    is_overloaded: bool
    overloaded_by: Decimal


def capacity_summary(user) -> CapacitySummary:
    active_projects = Project.objects.filter(
        owner=user.effective_owner, status=Project.Status.ACTIVE
    )

    allocated = Decimal("0")
    for project in active_projects:
        hours = project.estimated_monthly_hours
        if hours is None:
            hours = project.capacity_hours or Decimal("0")
        allocated += hours

    start, end = current_month_range()
    consumed = (
        TimeEntry.objects.filter(user=user, date__gte=start, date__lte=end).aggregate(
            total=Sum("duration_hours")
        )["total"]
        or Decimal("0")
    )

    available = user.monthly_capacity_hours or Decimal("0")
    remaining = available - consumed
    overloaded_by = max(allocated - available, Decimal("0"))

    return CapacitySummary(
        available_hours=available,
        allocated_hours=allocated,
        consumed_hours=consumed,
        remaining_hours=remaining,
        is_overloaded=overloaded_by > 0,
        overloaded_by=overloaded_by,
    )


# --- Revenue (module 1) --------------------------------------------------


@dataclass
class RevenueSummary:
    fixed_and_retainer: Decimal
    hourly: Decimal
    total: Decimal


def revenue_summary(user) -> RevenueSummary:
    active_projects = Project.objects.filter(
        owner=user.effective_owner, status=Project.Status.ACTIVE
    )

    non_hourly_total = (
        active_projects.exclude(billing_type=Project.BillingType.HOURLY).aggregate(
            total=Sum("budget")
        )["total"]
        or Decimal("0")
    )
    hourly_total = (
        active_projects.filter(billing_type=Project.BillingType.HOURLY).aggregate(
            total=Sum("monthly_revenue_target")
        )["total"]
        or Decimal("0")
    )

    return RevenueSummary(
        fixed_and_retainer=non_hourly_total,
        hourly=hourly_total,
        total=non_hourly_total + hourly_total,
    )


# --- Project health (module 1 + 9) ---------------------------------------


def project_health(user):
    """Per active project: task completion rate + logged-hours vs. estimate,
    as a rough 0-100 health score ("Client A: 80%")."""

    projects = Project.objects.filter(
        owner=user.effective_owner, status=Project.Status.ACTIVE
    ).select_related("client")
    results = []
    for project in projects:
        task_stats = project.tasks.aggregate(
            total=Count("id"),
            done=Count("id", filter=Q(status=Task.Status.DONE)),
            overdue=Count(
                "id",
                filter=Q(deadline__lt=timezone.localdate()) & ~Q(status=Task.Status.DONE),
            ),
        )
        total = task_stats["total"] or 0
        done = task_stats["done"] or 0
        completion_rate = round(100 * done / total) if total else 100

        # Overdue tasks drag the score down; this keeps a project with no
        # tasks yet from misleadingly showing 100%.
        penalty = min(task_stats["overdue"] * 10, 40)
        score = max(completion_rate - penalty, 0) if total else 100

        results.append(
            {
                "project_id": project.id,
                "project_name": project.name,
                "client_name": project.client.name,
                "completion_rate": completion_rate,
                "overdue_tasks": task_stats["overdue"],
                "health_score": score,
            }
        )
    return sorted(results, key=lambda r: r["health_score"])


# --- Daily digest (email/Telegram) ---------------------------------------


def build_daily_digest_text(user) -> str:
    """Plain-text version of 'امروز باید روی چه چیزی کار کنم؟' — meant to
    land in an inbox or a Telegram chat without opening the app."""
    tasks, _scores = recommended_tasks(user, limit=8)
    capacity = capacity_summary(user)
    revenue = revenue_summary(user)
    today = timezone.localdate()

    lines = [f"📋 خلاصه روزانه — {today.strftime('%Y-%m-%d')}", ""]

    if tasks:
        lines.append("🎯 پیشنهاد کارهای امروز:")
        for i, task in enumerate(tasks, start=1):
            deadline = f" (موعد: {task.deadline})" if task.deadline else ""
            lines.append(f"{i}. {task.title} — {task.project.name}{deadline}")
    else:
        lines.append("🎯 کار فوری‌ای برای امروز پیشنهاد نشد.")

    lines += [
        "",
        f"⏱ ظرفیت این ماه: {capacity.consumed_hours} از {capacity.available_hours} ساعت مصرف‌شده",
    ]
    if capacity.is_overloaded:
        lines.append(f"⚠️ {capacity.overloaded_by} ساعت اضافه‌بار نسبت به تخصیص‌های فعلی!")

    lines += [
        "",
        f"💰 درآمد ماهانه فعال: {revenue.total:,.0f} تومان",
    ]
    return "\n".join(lines)
