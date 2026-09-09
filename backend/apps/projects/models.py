from decimal import Decimal

from django.conf import settings
from django.db import models

from apps.clients.models import Client


class Project(models.Model):
    """A client engagement (module 3 + module 6 of the PRD).

    The financial fields below exist to answer the question raised in the
    "دغدغه‌های یک مدیر سئو" notes: a contract amount alone doesn't tell you
    whether a project is profitable — you need to compare the hours the
    money actually buys against the hours the work really needs. See
    ``apps.projects.services.project_financials`` for that calculation.
    """

    class ProjectType(models.TextChoices):
        SEO_MONTHLY = "seo_monthly", "SEO Monthly"
        WEBSITE_DESIGN = "website_design", "Website Design"
        ECOMMERCE_SETUP = "ecommerce_setup", "Ecommerce Setup"
        SEO_AUDIT = "seo_audit", "SEO Audit"
        CONSULTING = "consulting", "Consulting"
        CONTENT_MARKETING = "content_marketing", "Content Marketing"

    class BillingType(models.TextChoices):
        FIXED = "fixed", "Fixed Price"
        HOURLY = "hourly", "Hourly"
        RETAINER = "retainer", "Monthly Retainer"
        HYBRID = "hybrid", "Hybrid"

    class Status(models.TextChoices):
        BACKLOG = "backlog", "Backlog"
        PLANNING = "planning", "Planning"
        ACTIVE = "active", "Active"
        REVIEW = "review", "Review"
        COMPLETED = "completed", "Completed"
        PAUSED = "paused", "Paused"
        CANCELLED = "cancelled", "Cancelled"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects",
    )
    client = models.ForeignKey(
        Client, on_delete=models.CASCADE, related_name="projects"
    )

    name = models.CharField(max_length=255)
    website = models.URLField(blank=True)
    project_type = models.CharField(
        max_length=30, choices=ProjectType.choices, default=ProjectType.SEO_MONTHLY
    )
    billing_type = models.CharField(
        max_length=20, choices=BillingType.choices, default=BillingType.RETAINER
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.MEDIUM
    )
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.PLANNING
    )
    description = models.TextField(blank=True)

    # --- Financials -------------------------------------------------
    # For FIXED / RETAINER / HYBRID: the monthly (or one-off, for FIXED)
    # amount the client pays.
    budget = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )
    # Target/charged hourly rate. Used both to work out how many hours the
    # budget "buys" and, for HOURLY projects, together with
    # monthly_revenue_target to size the workload.
    hourly_rate = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    # HOURLY projects only: the revenue you're aiming for this month.
    monthly_revenue_target = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True
    )
    # The strategist's own estimate of how many hours/month the project
    # really needs — compared against capacity_hours to flag under-pricing.
    estimated_monthly_hours = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-priority", "name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.client})"

    @property
    def revenue_amount(self) -> Decimal | None:
        """The monthly revenue this project represents, whatever its billing type."""
        if self.billing_type == self.BillingType.HOURLY:
            return self.monthly_revenue_target
        return self.budget

    @property
    def capacity_hours(self) -> Decimal | None:
        """How many hours the client's money currently buys per month."""
        amount = self.revenue_amount
        if amount is None or not self.hourly_rate:
            return None
        return round(amount / self.hourly_rate, 2)
