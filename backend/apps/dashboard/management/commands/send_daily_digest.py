from django.conf import settings
from django.core.management.base import BaseCommand

from apps.accounts.models import User
from apps.dashboard.notifications import send_email_digest, send_telegram_digest
from apps.dashboard.services import build_daily_digest_text


class Command(BaseCommand):
    help = (
        "Send the daily 'what should I work on today?' digest by email "
        "and/or Telegram, per DIGEST_CHANNELS in settings/.env."
    )

    def handle(self, *args, **options):
        channels = set(getattr(settings, "DIGEST_CHANNELS", []) or [])
        if not channels:
            self.stdout.write(
                "DIGEST_CHANNELS is empty — set it to 'email', 'telegram', or "
                "both in backend/.env to enable the daily digest."
            )
            return

        owners = User.objects.filter(role=User.Role.OWNER, is_active=True)
        if not owners.exists():
            self.stdout.write("No Owner accounts found — nothing to send.")
            return

        for owner in owners:
            text = build_daily_digest_text(owner)
            sent_any = False

            if "email" in channels:
                sent_any |= send_email_digest(subject="📋 خلاصه روزانه سئو", body=text)
            if "telegram" in channels:
                sent_any |= send_telegram_digest(text)

            status = "sent" if sent_any else "skipped (no channel configured)"
            self.stdout.write(f"Digest for {owner.username}: {status}")
