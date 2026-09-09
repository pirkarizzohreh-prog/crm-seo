"""AI content brief generation (notes doc: automate the part of a content
strategist's job that's pure legwork — Search Intent, an H1/H2/H3 outline,
FAQ, related keywords, internal-link suggestions, and a target word count —
so the strategist's time goes to reviewing and directing, not drafting from
a blank page.

Requires the user's own ANTHROPIC_API_KEY (see backend/.env.example) — this
is a paid third-party API call the user's own account is billed for, not
something this project can supply on their behalf.
"""

from typing import Optional

from django.conf import settings
from pydantic import BaseModel, Field


class ContentBriefNotConfigured(Exception):
    """Raised when ANTHROPIC_API_KEY isn't set — the view turns this into a
    clear 400 instead of a raw SDK connection error."""


class Heading(BaseModel):
    level: str = Field(description="'h2' or 'h3'")
    text: str


class ContentBriefResult(BaseModel):
    intent: str = Field(description="The searcher's intent in one sentence (informational/commercial/...).")
    h1: str
    headings: list[Heading] = Field(description="Ordered H2/H3 outline for the article.")
    faq: list[str] = Field(description="Questions to answer, phrased as the reader would search them.")
    related_keywords: list[str]
    internal_link_suggestions: list[str] = Field(
        description="Topics/pages on the same site worth linking to or from."
    )
    target_word_count: int
    cta_suggestion: str


BRIEF_SYSTEM_PROMPT = """شما یک استراتژیست سئوی حرفه‌ای فارسی‌زبان هستید. بر اساس کلمه کلیدی هدف
(و در صورت وجود، یادداشت‌های رقبا)، یک بریف تولید محتوای کامل و عملی برای
نویسنده تولید کن. خروجی باید فارسی، مشخص و قابل‌اجرا باشد — نه توصیه‌های کلی."""


def generate_content_brief(
    target_keyword: str, competitor_notes: Optional[str] = None
) -> ContentBriefResult:
    api_key = getattr(settings, "ANTHROPIC_API_KEY", None)
    if not api_key:
        raise ContentBriefNotConfigured(
            "ANTHROPIC_API_KEY تنظیم نشده است. کلید API خودتان را از "
            "console.anthropic.com بگیرید و در backend/.env قرار دهید."
        )

    import anthropic

    client = anthropic.Anthropic(api_key=api_key)

    user_prompt = f"کلمه کلیدی هدف: {target_keyword}\n"
    if competitor_notes:
        user_prompt += f"\nیادداشت‌ها/رقبا:\n{competitor_notes}\n"

    response = client.messages.parse(
        model="claude-opus-5",
        max_tokens=4000,
        system=BRIEF_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
        output_format=ContentBriefResult,
    )
    return response.parsed_output
