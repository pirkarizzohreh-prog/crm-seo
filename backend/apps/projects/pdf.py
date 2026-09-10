"""Renders the monthly report (see ``services.monthly_report``) as a PDF.

Persian/Arabic-script text needs two passes before reportlab can draw it
correctly: ``arabic_reshaper`` joins letters into their correct
presentation forms, then ``python-bidi`` reorders the string into the
visual (left-to-right glyph stream) order reportlab expects — reportlab
itself has no bidi algorithm, it just draws characters in the order given.
Latin text/numbers inside a mixed string are left in place by both steps.
"""

from decimal import Decimal
from io import BytesIO
from pathlib import Path

import arabic_reshaper
from bidi.algorithm import get_display
from xhtml2pdf import pisa

FONTS_DIR = Path(__file__).resolve().parent / "fonts"
# xhtml2pdf's font loader wants a plain filesystem path here, not a file://
# URI (which it fails to resolve and silently falls back to a font with no
# Persian/Arabic glyphs, rendering ".notdef" boxes).
REGULAR_FONT_URI = str(FONTS_DIR / "Vazirmatn-Regular.ttf")
BOLD_FONT_URI = str(FONTS_DIR / "Vazirmatn-Bold.ttf")


def rtl(text) -> str:
    """Shape + bidi-reorder a string for correct rendering in the PDF."""
    if text is None:
        return ""
    text = str(text)
    return get_display(arabic_reshaper.reshape(text))


def _toman(amount) -> str:
    if amount is None:
        return "—"
    return rtl(f"{int(Decimal(amount)):,} تومان")


def _hours(value) -> str:
    if value is None:
        return "—"
    return rtl(f"{Decimal(value):.1f} ساعت")


PAGE_CSS = f"""
@font-face {{
    font-family: "Vazirmatn";
    src: url("{REGULAR_FONT_URI}");
}}
@font-face {{
    font-family: "Vazirmatn";
    font-weight: bold;
    src: url("{BOLD_FONT_URI}");
}}
@page {{
    size: A4;
    margin: 2cm 1.8cm;
}}
body {{
    font-family: "Vazirmatn";
    font-size: 11pt;
    color: #1e293b;
}}
h1 {{
    font-size: 18pt;
    margin-bottom: 2px;
}}
.subtitle {{
    color: #64748b;
    font-size: 10pt;
    margin-bottom: 16px;
}}
table {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
}}
.summary td {{
    width: 25%;
    border: 1px solid #e2e8f0;
    padding: 8px 10px;
    vertical-align: top;
}}
.summary .label {{
    font-size: 9pt;
    color: #64748b;
    display: block;
    margin-bottom: 4px;
}}
.summary .value {{
    font-size: 13pt;
    font-weight: bold;
}}
h2 {{
    font-size: 13pt;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
    margin-top: 20px;
    margin-bottom: 8px;
}}
.task-row td {{
    padding: 5px 4px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 10pt;
}}
.hours-row td {{
    padding: 6px 4px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 10.5pt;
}}
.hours-row .hours {{
    font-weight: bold;
}}
.footer {{
    margin-top: 24px;
    font-size: 8.5pt;
    color: #94a3b8;
}}
"""


def render_monthly_report_pdf(report: dict) -> bytes:
    month_label = rtl(f"{report['period_start']:%Y-%m} تا {report['period_end']:%Y-%m-%d}")

    rows_tasks = "".join(
        f"<tr class='task-row'>"
        f"<td>{rtl(t['title'])}</td>"
        f"<td>{rtl(t['category_name'] or '—')}</td>"
        f"<td>{_toman(t['value_generated']) if t['value_generated'] else '—'}</td>"
        f"</tr>"
        for t in report["completed_tasks"]
    ) or f"<tr class='task-row'><td colspan='3'>{rtl('در این ماه تسکی تکمیل نشده است.')}</td></tr>"

    rows_hours = "".join(
        f"<tr class='hours-row'><td>{rtl(row['category_name'])}</td>"
        f"<td class='hours'>{_hours(row['hours'])}</td></tr>"
        for row in report["hours_by_category"]
    ) or f"<tr class='hours-row'><td>{rtl('زمانی برای این ماه ثبت نشده است.')}</td></tr>"

    def _activity_row(e: dict) -> str:
        entry_date = e["date"].strftime("%Y-%m-%d")
        return (
            "<tr class='task-row'>"
            f"<td>{rtl(entry_date)}</td>"
            f"<td>{rtl(e['task_title'])}</td>"
            f"<td>{_hours(e['hours'])}</td>"
            f"<td>{rtl(e['notes'] or '—')}</td>"
            "</tr>"
        )

    rows_activity = "".join(_activity_row(e) for e in report["activity_log"]) or (
        f"<tr class='task-row'><td colspan='4'>{rtl('زمانی برای این ماه ثبت نشده است.')}</td></tr>"
    )

    html = f"""
    <html dir="rtl">
    <head><style>{PAGE_CSS}</style></head>
    <body>
        <h1>{rtl('گزارش عملکرد سئو')}</h1>
        <div class="subtitle">{rtl(report['project_name'])} — {month_label}</div>

        <table class="summary">
            <tr>
                <td>
                    <span class="label">{rtl('تسک‌های انجام‌شده')}</span>
                    <span class="value">{rtl(str(report['task_count']))}</span>
                </td>
                <td>
                    <span class="label">{rtl('ساعت کار ثبت‌شده')}</span>
                    <span class="value">{_hours(report['total_hours'])}</span>
                </td>
                <td>
                    <span class="label">{rtl('ارزش خروجی تولیدشده')}</span>
                    <span class="value">{_toman(report['total_value_generated'])}</span>
                </td>
                <td>
                    <span class="label">{rtl('مبلغ قرارداد')}</span>
                    <span class="value">{_toman(report['contract_amount'])}</span>
                </td>
            </tr>
        </table>

        <h2>{rtl('فعالیت‌های انجام‌شده')}</h2>
        <table>{rows_tasks}</table>

        <h2>{rtl('ساعت کار به تفکیک دسته')}</h2>
        <table>{rows_hours}</table>

        <h2>{rtl('یادداشت‌های فعالیت روزانه')}</h2>
        <table>{rows_activity}</table>

        <div class="footer">{rtl('تولید‌شده توسط سیستم عملیات آژانس سئو')}</div>
    </body>
    </html>
    """

    buffer = BytesIO()
    pisa.CreatePDF(html, dest=buffer, encoding="utf-8")
    return buffer.getvalue()
