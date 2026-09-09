import time
from datetime import datetime, timedelta

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Long-running loop for the docker-compose 'scheduler' service: fires "
        "send_daily_digest once a day at settings.DIGEST_TIME (HH:MM, local "
        "server time). There's no cron daemon in the containers, so this "
        "replaces one for a single-process deployment."
    )

    def handle(self, *args, **options):
        digest_time = getattr(settings, "DIGEST_TIME", "08:00")
        hour, minute = (int(p) for p in digest_time.split(":"))
        self.stdout.write(f"Daily digest scheduler started — firing at {digest_time} every day.")

        last_run_date = None
        while True:
            now = datetime.now()
            if (
                now.hour == hour
                and now.minute == minute
                and last_run_date != now.date()
            ):
                self.stdout.write(f"[{now}] Running send_daily_digest...")
                try:
                    call_command("send_daily_digest")
                except Exception as exc:  # keep the loop alive across a bad run
                    self.stderr.write(f"send_daily_digest failed: {exc}")
                last_run_date = now.date()
            time.sleep(30)
