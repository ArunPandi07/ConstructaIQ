from __future__ import annotations

from typing import Any

from app.config.settings import settings
from app.services.logging_service import get_logger

logger = get_logger("AcsEmailService")

try:
    from azure.communication.email import EmailClient
except ImportError:  # pragma: no cover - optional dependency at runtime
    EmailClient = None  # type: ignore[misc, assignment]


class AcsEmailService:
    def is_configured(self) -> bool:
        return bool(
            settings.AZURE_COMMUNICATION_CONNECTION_STRING
            and settings.AZURE_COMMUNICATION_EMAIL_FROM
            and EmailClient is not None
        )

    def send_html_email(
        self,
        to: str,
        subject: str,
        html: str,
        plain_text: str | None = None,
    ) -> str:
        if not self.is_configured():
            raise RuntimeError(
                "Azure Communication Services Email is not configured. "
                "Set AZURE_COMMUNICATION_CONNECTION_STRING and AZURE_COMMUNICATION_EMAIL_FROM."
            )

        client = EmailClient.from_connection_string(
            settings.AZURE_COMMUNICATION_CONNECTION_STRING
        )

        message: dict[str, Any] = {
            "senderAddress": settings.AZURE_COMMUNICATION_EMAIL_FROM,
            "content": {
                "subject": subject,
                "html": html,
            },
            "recipients": {"to": [{"address": to}]},
        }
        if plain_text:
            message["content"]["plainText"] = plain_text
        if settings.AZURE_COMMUNICATION_EMAIL_REPLY_TO:
            message["replyTo"] = [{"address": settings.AZURE_COMMUNICATION_EMAIL_REPLY_TO}]

        poller = client.begin_send(message)
        result = poller.result()
        message_id = ""
        if isinstance(result, dict):
            message_id = str(result.get("id") or result.get("messageId") or "")
        else:
            message_id = str(result)
        logger.info("ACS email sent to %s (id=%s)", to, message_id)
        return message_id


acs_email_service = AcsEmailService()
