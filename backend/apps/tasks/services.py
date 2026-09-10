from datetime import date, timedelta
from decimal import Decimal
from math import ceil


def spread_deadlines(hours_list: list[Decimal | None], start_date: date, hours_per_day: Decimal) -> list[date]:
    """Given the estimated hours of a sequence of tasks (in the order
    they'll be worked), return a deadline for each one: the working day
    (Fridays skipped — the Iranian weekend) on which its cumulative hours
    are reached, at a fixed pace of ``hours_per_day``.

    e.g. items of [2, 1, 3] hours at 3h/day starting Saturday gives
    [Saturday, Saturday, Sunday] — the first two finish the same day,
    the third spills into the next working day.
    """
    total_hours = sum((h or Decimal("0")) for h in hours_list)
    days_needed = max(int(ceil(total_hours / hours_per_day)), 0) if hours_per_day else 0

    working_days: list[date] = []
    cursor = start_date
    while len(working_days) < days_needed:
        if cursor.weekday() != 4:  # Friday
            working_days.append(cursor)
        cursor += timedelta(days=1)

    deadlines = []
    cumulative = Decimal("0")
    for hours in hours_list:
        cumulative += hours or Decimal("0")
        day_index = max(int(ceil(cumulative / hours_per_day)), 1) - 1 if hours_per_day else 0
        day_index = min(day_index, len(working_days) - 1) if working_days else 0
        deadlines.append(working_days[day_index] if working_days else start_date)
    return deadlines
