from django.contrib import admin

from .models import ContentBrief, Keyword, KeywordRankHistory


class KeywordRankHistoryInline(admin.TabularInline):
    model = KeywordRankHistory
    extra = 0


@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    list_display = ("keyword", "project", "current_rank", "target_rank", "last_checked")
    list_filter = ("project",)
    search_fields = ("keyword", "url")
    inlines = [KeywordRankHistoryInline]


@admin.register(ContentBrief)
class ContentBriefAdmin(admin.ModelAdmin):
    list_display = ("target_keyword", "project", "created_by", "created_at")
    list_filter = ("project",)
    search_fields = ("target_keyword",)
