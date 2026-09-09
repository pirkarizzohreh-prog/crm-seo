from django.conf import settings
from django.db import models


class Client(models.Model):
    """A customer of the SEO agency (module 2 of the PRD)."""

    class Status(models.TextChoices):
        LEAD = "lead", "Lead"
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        LOST = "lost", "Lost"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="clients",
    )

    name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.company_name or self.name
