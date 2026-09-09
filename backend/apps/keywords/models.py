from django.conf import settings
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


class ContentBrief(models.Model):
    """AI-generated content brief (notes doc: 'تولید Brief محتوا با هوش
    مصنوعی') — a strategist hands over a keyword instead of writing the
    intent/structure/FAQ/internal-links brief by hand for every article."""

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="content_briefs")
    keyword = models.ForeignKey(
        Keyword, on_delete=models.SET_NULL, null=True, blank=True, related_name="content_briefs"
    )

    target_keyword = models.CharField(max_length=255)
    competitor_notes = models.TextField(
        blank=True, help_text="Optional: competitor URLs/titles or notes to consider."
    )

    intent = models.CharField(max_length=255, blank=True)
    h1 = models.CharField(max_length=255, blank=True)
    headings = models.JSONField(default=list, blank=True, help_text="Ordered [{level, text}] outline.")
    faq = models.JSONField(default=list, blank=True)
    related_keywords = models.JSONField(default=list, blank=True)
    internal_link_suggestions = models.JSONField(default=list, blank=True)
    target_word_count = models.PositiveIntegerField(null=True, blank=True)
    cta_suggestion = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="content_briefs"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Brief: {self.target_keyword} ({self.project})"
