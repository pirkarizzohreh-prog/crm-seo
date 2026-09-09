"""Google Search Console integration (notes doc: automate the weekly
monitoring a strategist would otherwise do by hand — rank drops, click
drops, new index errors).

Requires:
1. A Google Cloud service account with the Search Console API enabled;
   its JSON key file path goes in GOOGLE_SERVICE_ACCOUNT_FILE (backend/.env).
2. That service account's email address added as a user (Full or
   Restricted) on the property in Google Search Console.
3. Project.search_console_site_url set to the exact property identifier —
   "https://example.com/" for a URL-prefix property, or
   "sc-domain:example.com" for a domain property.

None of this can be supplied by the project itself — it's the user's own
Google account and site.
"""

from dataclasses import dataclass
from datetime import date, timedelta

from django.conf import settings

from .models import Project

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


class SearchConsoleNotConfigured(Exception):
    pass


@dataclass
class SearchConsoleSummary:
    site_url: str
    period_start: date
    period_end: date
    total_clicks: int
    total_impressions: int
    average_ctr: float
    average_position: float
    top_queries: list[dict]
    top_pages: list[dict]


def _get_service():
    key_file = getattr(settings, "GOOGLE_SERVICE_ACCOUNT_FILE", None)
    if not key_file:
        raise SearchConsoleNotConfigured(
            "GOOGLE_SERVICE_ACCOUNT_FILE تنظیم نشده است. راهنمای اتصال Search "
            "Console را در README ببینید."
        )

    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    credentials = service_account.Credentials.from_service_account_file(key_file, scopes=SCOPES)
    return build("searchconsole", "v1", credentials=credentials)


def get_search_console_summary(project: Project, days: int = 28) -> SearchConsoleSummary:
    if not project.search_console_site_url:
        raise SearchConsoleNotConfigured(
            "برای این پروژه هنوز Site URL سرچ کنسول تنظیم نشده است."
        )

    service = _get_service()
    end = date.today() - timedelta(days=2)  # GSC data typically lags ~2 days
    start = end - timedelta(days=days)
    site_url = project.search_console_site_url

    def query(**extra):
        body = {"startDate": start.isoformat(), "endDate": end.isoformat(), **extra}
        return service.searchanalytics().query(siteUrl=site_url, body=body).execute()

    totals_rows = query().get("rows", [])
    totals_row = totals_rows[0] if totals_rows else {}

    top_queries = query(dimensions=["query"], rowLimit=10).get("rows", [])
    top_pages = query(dimensions=["page"], rowLimit=10).get("rows", [])

    return SearchConsoleSummary(
        site_url=site_url,
        period_start=start,
        period_end=end,
        total_clicks=int(totals_row.get("clicks", 0)),
        total_impressions=int(totals_row.get("impressions", 0)),
        average_ctr=round(totals_row.get("ctr", 0) * 100, 2),
        average_position=round(totals_row.get("position", 0), 1),
        top_queries=[
            {
                "query": row["keys"][0],
                "clicks": int(row["clicks"]),
                "impressions": int(row["impressions"]),
                "ctr": round(row["ctr"] * 100, 2),
                "position": round(row["position"], 1),
            }
            for row in top_queries
        ],
        top_pages=[
            {
                "page": row["keys"][0],
                "clicks": int(row["clicks"]),
                "impressions": int(row["impressions"]),
                "ctr": round(row["ctr"] * 100, 2),
                "position": round(row["position"], 1),
            }
            for row in top_pages
        ],
    )
