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
    last_day = monthrange(today.year, today.month)[1]
    return date(today.year, today.month, 1), date(today.year, today.month, last_day)


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
