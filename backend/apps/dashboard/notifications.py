"""Delivery channels for the daily digest. Each function is a no-op (with a
clear log line) when its own settings aren't configured, so a partial setup
(only email, only Telegram, or neither yet) never breaks the command."""

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_email_digest(subject: str, body: str) -> bool:
    recipients = getattr(settings, "DIGEST_EMAIL_TO", None)
    if not recipients:
        logger.info("DIGEST_EMAIL_TO not set — skipping email digest.")
        return False
    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=list(recipients),
    )
    return True


def send_telegram_digest(text: str) -> bool:
    token = getattr(settings, "TELEGRAM_BOT_TOKEN", None)
    chat_id = getattr(settings, "TELEGRAM_CHAT_ID", None)
    if not token or not chat_id:
        logger.info("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not set — skipping Telegram digest.")
        return False

    import requests

    response = requests.post(
        f"https://api.telegram.org/bot{token}/sendMessage",
        json={"chat_id": chat_id, "text": text},
        timeout=10,
    )
    if not response.ok:
        logger.error("Telegram digest failed: %s %s", response.status_code, response.text)
        return False
    return True
