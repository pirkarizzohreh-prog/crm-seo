from django.db import models
from django.utils import timezone

from apps.projects.models import Project


class Keyword(models.Model):
    """Keyword rank tracking (module 11 of the PRD)."""

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="keywords")

    keyword = models.CharField(max_length=255)
    url = models.URLField(blank=True, help_text="The page this keyword targets.")
    current_rank = models.PositiveIntegerField(null=True, blank=True)
    target_rank = models.PositiveIntegerField(null=True, blank=True)
    search_volume = models.PositiveIntegerField(null=True, blank=True)
    difficulty = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="0-100, e.g. an SEO tool's keyword difficulty score."
    )
    last_checked = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["current_rank", "keyword"]

    def __str__(self) -> str:
        return f"{self.keyword} ({self.project})"

    @property
    def rank_gap(self) -> int | None:
        """Positive = still above target rank (needs improvement)."""
        if self.current_rank is None or self.target_rank is None:
            return None
        return self.current_rank - self.target_rank

    def record_rank(self, rank: int, checked_on=None) -> "KeywordRankHistory":
        """Log a fresh rank check and update the keyword's current snapshot."""
        checked_on = checked_on or timezone.localdate()
        self.current_rank = rank
        self.last_checked = checked_on
        self.save(update_fields=["current_rank", "last_checked", "updated_at"])
        return KeywordRankHistory.objects.create(keyword=self, rank=rank, checked_on=checked_on)


class KeywordRankHistory(models.Model):
    keyword = models.ForeignKey(Keyword, on_delete=models.CASCADE, related_name="history")
    rank = models.PositiveIntegerField()
    checked_on = models.DateField(default=timezone.localdate)

    class Meta:
        ordering = ["-checked_on"]
        verbose_name_plural = "keyword rank history"

    def __str__(self) -> str:
        return f"{self.keyword.keyword}: #{self.rank} on {self.checked_on}"
