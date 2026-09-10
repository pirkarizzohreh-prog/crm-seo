from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsOwnerOrReadOnly

from .models import Project
from .pdf import render_monthly_report_pdf
from .search_console import SearchConsoleNotConfigured, get_search_console_summary
from .serializers import MonthlyReportSerializer, ProjectSerializer, SearchConsoleSummarySerializer
from .services import monthly_report
from .xlsx import render_monthly_report_xlsx


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    filterset_fields = ["client", "status", "priority", "billing_type", "project_type"]
    search_fields = ["name", "website", "description"]
    ordering_fields = ["name", "priority", "start_date", "created_at"]

    def get_permissions(self):
        # Applying a template or pulling a report are day-to-day actions the
        # whole team should be able to do; only editing the project record
        # itself (billing, status, ...) is restricted to the Owner.
        if self.action in (
            "apply_template",
            "monthly_report_view",
            "monthly_report_pdf",
            "monthly_report_xlsx",
            "search_console_view",
        ):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrReadOnly()]

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user.effective_owner).select_related("client")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user.effective_owner)

    @action(detail=True, methods=["post"], url_path="apply-template")
    def apply_template(self, request, pk=None):
        """Bulk-create tasks on this project from a TaskTemplate (module 5).

        Optionally schedules each task's deadline: pass ``start_date`` (the
        first working day) and ``hours_per_day`` (how much of this project
        you'll work on per day) and every task gets a real deadline spread
        across working days (Fridays skipped) at that pace, in template
        order — so the whole plan shows up on the calendar/dashboard
        immediately instead of everything being due "today".
        """
        from datetime import date as date_cls
        from decimal import Decimal, InvalidOperation

        from apps.tasks.models import Task, TaskTemplate
        from apps.tasks.services import spread_deadlines

        project = self.get_object()
        template_id = request.data.get("template_id")
        template = TaskTemplate.objects.filter(
            id=template_id, owner=request.user.effective_owner
        ).prefetch_related("items").first()
        if template is None:
            return Response({"detail": "Template not found."}, status=404)

        items = list(template.items.all())
        deadlines: list[date_cls | None] = [None] * len(items)
        start_date_raw = request.data.get("start_date")
        hours_per_day_raw = request.data.get("hours_per_day")
        if start_date_raw and hours_per_day_raw:
            try:
                start_date = date_cls.fromisoformat(start_date_raw)
                hours_per_day = Decimal(str(hours_per_day_raw))
            except (ValueError, InvalidOperation):
                return Response({"detail": "تاریخ شروع یا ساعت کاری در روز نامعتبر است."}, status=400)
            if hours_per_day > 0:
                deadlines = spread_deadlines(
                    [item.estimated_hours for item in items], start_date, hours_per_day
                )

        created = Task.objects.bulk_create(
            [
                Task(
                    project=project,
                    title=item.title,
                    category=item.category,
                    estimated_hours=item.estimated_hours,
                    deadline=deadlines[i],
                )
                for i, item in enumerate(items)
            ]
        )
        from apps.tasks.serializers import TaskSerializer

        return Response(TaskSerializer(created, many=True).data, status=201)

    def _report_for_request(self, request, project):
        today = timezone.localdate()
        year = int(request.query_params.get("year", today.year))
        month = int(request.query_params.get("month", today.month))
        return monthly_report(project, year, month)

    @action(detail=True, methods=["get"], url_path="monthly-report")
    def monthly_report_view(self, request, pk=None):
        """Auto-built monthly report (doc2): completed tasks + hours by
        category for the given month, vs. the contract amount."""
        project = self.get_object()
        data = self._report_for_request(request, project)
        return Response(MonthlyReportSerializer(data).data)

    @action(detail=True, methods=["get"], url_path="monthly-report/pdf")
    def monthly_report_pdf(self, request, pk=None):
        """Same report, rendered as a downloadable PDF for sending to clients."""
        project = self.get_object()
        data = self._report_for_request(request, project)
        pdf_bytes = render_monthly_report_pdf(data)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        filename = f"report-{project.id}-{data['period_start']:%Y-%m}.pdf"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=["get"], url_path="monthly-report/xlsx")
    def monthly_report_xlsx(self, request, pk=None):
        """A stripped-down Excel version of the report: task title + its
        estimated hours only, one row each — for handing to someone who
        just wants "what was done" without the internal numbers."""
        project = self.get_object()
        data = self._report_for_request(request, project)
        xlsx_bytes = render_monthly_report_xlsx(data)
        response = HttpResponse(
            xlsx_bytes,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        filename = f"report-{project.id}-{data['period_start']:%Y-%m}.xlsx"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=["get"], url_path="search-console")
    def search_console_view(self, request, pk=None):
        """Search Console summary for this project's site (module: GSC
        integration) — top queries/pages + totals for the last N days."""
        project = self.get_object()
        days = int(request.query_params.get("days", 28))
        try:
            summary = get_search_console_summary(project, days=days)
        except SearchConsoleNotConfigured as exc:
            return Response({"detail": str(exc)}, status=400)
        except Exception as exc:  # Google API errors: auth/permissions/quota/...
            return Response({"detail": f"خطا در دریافت اطلاعات سرچ کنسول: {exc}"}, status=502)
        return Response(SearchConsoleSummarySerializer(summary.__dict__).data)
