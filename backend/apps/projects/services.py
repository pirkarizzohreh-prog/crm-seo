"""Project financial calculations.

Implements the "contract amount vs. real hours needed" analysis from the
SEO manager notes: a budget alone doesn't say whether a project is
profitable — you need to compare how many hours that money buys against
how many hours the strategist estimates the work actually needs, and how
many hours were actually logged.
"""

from calendar import monthrange
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Optional

from django.db.models import Sum
from django.utils import timezone

from apps.timetracking.models import TimeEntry

from .models import Project


def current_month_range(today: Optional[date] = None) -> tuple[date, date]:
    today = today or timezone.localdate()
    return month_range(today.year, today.month)


def month_range(year: int, month: int) -> tuple[date, date]:
    last_day = monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last_day)


def logged_hours_for_project(
    project: Project, start: Optional[date] = None, end: Optional[date] = None
) -> Decimal:
    start, end = (start, end) if start and end else current_month_range()
    total = TimeEntry.objects.filter(
        task__project=project, date__gte=start, date__lte=end
    ).aggregate(total=Sum("duration_hours"))["total"]
    return total or Decimal("0")


class ProfitabilityStatus:
    PROFITABLE = "profitable"
    BALANCED = "balanced"
    LOW_MARGIN = "low_margin"
    LOSING = "losing"
    UNKNOWN = "unknown"


@dataclass
class ProjectFinancials:
    revenue_amount: Optional[Decimal]
    capacity_hours: Optional[Decimal]
    estimated_monthly_hours: Optional[Decimal]
    logged_hours: Decimal
    variance_hours: Optional[Decimal]
    effective_hourly_rate: Optional[Decimal]
    profitability_status: str


def project_financials(
    project: Project, start: Optional[date] = None, end: Optional[date] = None
) -> ProjectFinancials:
    revenue_amount = project.revenue_amount
    capacity_hours = project.capacity_hours
    estimated_hours = project.estimated_monthly_hours
    logged_hours = logged_hours_for_project(project, start, end)

    variance_hours = None
    if capacity_hours is not None and estimated_hours is not None:
        variance_hours = round(capacity_hours - estimated_hours, 2)

    effective_hourly_rate = None
    if revenue_amount is not None and logged_hours:
        effective_hourly_rate = round(revenue_amount / logged_hours, 2)

    status = ProfitabilityStatus.UNKNOWN
    if capacity_hours and estimated_hours is not None:
        ratio = estimated_hours / capacity_hours if capacity_hours else None
        if ratio is not None:
            if ratio <= Decimal("0.9"):
                status = ProfitabilityStatus.PROFITABLE
            elif ratio <= Decimal("1.05"):
                status = ProfitabilityStatus.BALANCED
            elif ratio <= Decimal("1.3"):
                status = ProfitabilityStatus.LOW_MARGIN
            else:
                status = ProfitabilityStatus.LOSING

    return ProjectFinancials(
        revenue_amount=revenue_amount,
        capacity_hours=capacity_hours,
        estimated_monthly_hours=estimated_hours,
        logged_hours=logged_hours,
        variance_hours=variance_hours,
        effective_hourly_rate=effective_hourly_rate,
        profitability_status=status,
    )


# --- Monthly report (doc2: "گزارش عملکرد سئو") --------------------------
# Builds the client-facing monthly report straight from tasks completed and
# time logged in the period, instead of the strategist writing it by hand.


def monthly_report(project: Project, year: int, month: int) -> dict:
    from apps.tasks.models import Task

    start, end = month_range(year, month)

    completed_tasks = (
        Task.objects.filter(
            project=project,
            status=Task.Status.DONE,
            completed_at__date__gte=start,
            completed_at__date__lte=end,
        )
        .select_related("category")
        .order_by("category__group", "completed_at")
    )

    entries = TimeEntry.objects.filter(
        task__project=project, date__gte=start, date__lte=end
    ).select_related("task__category").order_by("date", "created_at")

    hours_by_category: dict[str, Decimal] = {}
    total_hours = Decimal("0")
    for entry in entries:
        label = entry.task.category.name if entry.task.category else "بدون دسته"
        hours_by_category[label] = hours_by_category.get(label, Decimal("0")) + entry.duration_hours
        total_hours += entry.duration_hours

    total_value_generated = completed_tasks.aggregate(total=Sum("value_generated"))["total"] or Decimal("0")

    return {
        "project_id": project.id,
        "project_name": project.name,
        "period_start": start,
        "period_end": end,
        "completed_tasks": [
            {
                "id": t.id,
                "title": t.title,
                "category_name": t.category.name if t.category else None,
                "category_group": t.category.group if t.category else None,
                "completed_at": t.completed_at,
                "estimated_hours": t.estimated_hours,
                "value_generated": t.value_generated,
            }
            for t in completed_tasks
        ],
        "hours_by_category": [
            {"category_name": name, "hours": hours} for name, hours in sorted(hours_by_category.items())
        ],
        # The day-by-day activity log (module 7: "چه کاری انجام شد") — pulled
        # straight from each logged time entry's notes, so the report shows
        # actual work done, not just categories and totals.
        "activity_log": [
            {
                "date": entry.date,
                "task_title": entry.task.title,
                "hours": entry.duration_hours,
                "notes": entry.notes,
            }
            for entry in entries
        ],
        "total_hours": total_hours,
        "total_value_generated": total_value_generated,
        "contract_amount": project.revenue_amount,
        "task_count": completed_tasks.count(),
    }


# --- Delivery status (traffic-light overview) ----------------------------
# An automatic 🟢/🟡/🔴 read on whether a project is on track, based only
# on the tasks whose deadline has actually arrived: of those, what
# percentage got done? Not a manual "I feel like this is going okay" call.

DELIVERY_ON_TRACK = "on_track"
DELIVERY_AT_RISK = "at_risk"
DELIVERY_BEHIND = "behind"


def project_delivery_status(project: Project) -> dict:
    from apps.tasks.models import Task

    today = timezone.localdate()
    tasks = project.tasks.all()
    total = tasks.count()
    completed = tasks.filter(status=Task.Status.DONE).count()
    progress_percent = round(100 * completed / total) if total else 0

    due_tasks = tasks.filter(deadline__isnull=False, deadline__lte=today)
    due_count = due_tasks.count()
    completed_due_count = due_tasks.filter(status=Task.Status.DONE).count()

    if due_count == 0:
        # Nothing has come due yet — no evidence of falling behind.
        status = DELIVERY_ON_TRACK
    else:
        on_time_rate = completed_due_count / due_count
        if on_time_rate >= 0.8:
            status = DELIVERY_ON_TRACK
        elif on_time_rate >= 0.5:
            status = DELIVERY_AT_RISK
        else:
            status = DELIVERY_BEHIND

    return {
        "status": status,
        "progress_percent": progress_percent,
        "total_tasks": total,
        "completed_tasks": completed,
        "due_tasks": due_count,
        "completed_due_tasks": completed_due_count,
    }
