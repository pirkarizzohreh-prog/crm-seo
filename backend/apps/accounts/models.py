from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model.

    Phase 1 ships with a single "Owner / SEO Manager" account, but the
    ``role`` field and the per-user capacity settings below exist so the
    same schema can support a small team later on (SEO Specialist, Content
    Writer, Developer, Designer, Client Portal User, ...) without a
    migration that touches every other app.
    """

    class Role(models.TextChoices):
        OWNER = "owner", "Owner / SEO Manager"
        SEO_SPECIALIST = "seo_specialist", "SEO Specialist"
        CONTENT_WRITER = "content_writer", "Content Writer"
        DEVELOPER = "developer", "Developer"
        DESIGNER = "designer", "Designer"
        CLIENT = "client", "Client Portal User"

    role = models.CharField(
        max_length=32, choices=Role.choices, default=Role.OWNER
    )

    # Capacity planning (module 8 of the PRD): how many hours per month this
    # person can realistically bill/work, and over how many working days.
    monthly_capacity_hours = models.DecimalField(
        max_digits=6, decimal_places=2, default=160
    )
    working_days_per_month = models.PositiveSmallIntegerField(default=20)

    def __str__(self) -> str:
        return self.get_full_name() or self.username
