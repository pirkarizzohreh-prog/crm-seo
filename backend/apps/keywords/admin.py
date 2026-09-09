from django.contrib import admin

from .models import Keyword, KeywordRankHistory


class KeywordRankHistoryInline(admin.TabularInline):
    model = KeywordRankHistory
    extra = 0


@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    list_display = ("keyword", "project", "current_rank", "target_rank", "last_checked")
    list_filter = ("project",)
    search_fields = ("keyword", "url")
    inlines = [KeywordRankHistoryInline]
