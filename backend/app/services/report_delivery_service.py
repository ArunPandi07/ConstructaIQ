from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.db.models.report_delivery import ReportDelivery
from app.db.repositories.report_delivery_repository import ReportDeliveryRepository
from app.db.repositories.user_repository import UserRepository
from app.services.acs_email_service import acs_email_service
from app.services.email_template_service import (
    render_report_html,
    render_report_plain_text,
    render_report_subject,
)
from app.services.logging_service import get_logger
from app.services.project_service import get_project_summary
from app.services.report_builder_service import (
    build_project_intelligence_report,
    report_snapshot,
)

logger = get_logger("ReportDeliveryService")


class ReportDeliveryError(Exception):
    pass


async def send_project_report_email(
    session: AsyncSession,
    project_id: int,
    user_id: int,
    job_id: str | None = None,
    *,
    skip_rate_limit: bool = False,
) -> ReportDelivery:
    """Build and email consolidated intelligence report to the authenticated user."""
    repo = ReportDeliveryRepository(session)
    user_repo = UserRepository(session)

    user = await user_repo.get_by_id(user_id)
    if user is None or not user.is_active:
        raise ReportDeliveryError("Recipient user not found or inactive.")
    if not user.report_email_opt_in:
        delivery = await repo.create(
            {
                "project_id": project_id,
                "user_id": user_id,
                "job_id": job_id,
                "status": "skipped",
                "recipient_email": user.email,
                "error_message": "User opted out of report emails.",
            }
        )
        await session.commit()
        return delivery

    if not settings.REPORT_EMAIL_ENABLED:
        delivery = await repo.create(
            {
                "project_id": project_id,
                "user_id": user_id,
                "job_id": job_id,
                "status": "skipped",
                "recipient_email": user.email,
                "error_message": "Report email feature disabled (REPORT_EMAIL_ENABLED=false).",
            }
        )
        await session.commit()
        return delivery

    if not skip_rate_limit and settings.REPORT_EMAIL_RATE_LIMIT_MINUTES > 0:
        recent = await repo.recent_for_user_project(
            project_id,
            user_id,
            since_minutes=settings.REPORT_EMAIL_RATE_LIMIT_MINUTES,
        )
        if recent:
            delivery = await repo.create(
                {
                    "project_id": project_id,
                    "user_id": user_id,
                    "job_id": job_id,
                    "status": "skipped",
                    "recipient_email": user.email,
                    "error_message": "Rate limit: report already sent recently.",
                }
            )
            await session.commit()
            return delivery

    summary_data = await get_project_summary(session, project_id)
    project = summary_data["project"]
    intelligence = summary_data["intelligence"]

    from app.db.repositories.agent_execution_repository import AgentExecutionRepository

    executions = await AgentExecutionRepository(session).list_by_project_full(project_id)

    report = build_project_intelligence_report(
        project.project_name,
        intelligence,
        executions,
        frontend_base_url=settings.FRONTEND_BASE_URL,
        project_id=project_id,
    )
    subject = render_report_subject(report)
    html = render_report_html(report)
    plain = render_report_plain_text(report)

    delivery = await repo.create(
        {
            "project_id": project_id,
            "user_id": user_id,
            "job_id": job_id,
            "status": "queued",
            "recipient_email": user.email,
            "subject": subject,
            "report_snapshot_json": report_snapshot(report),
        }
    )
    await session.flush()

    try:
        if not acs_email_service.is_configured():
            raise ReportDeliveryError("ACS Email is not configured.")

        message_id = await asyncio.to_thread(
            acs_email_service.send_html_email,
            user.email,
            subject,
            html,
            plain,
        )
        delivery.status = "sent"
        delivery.provider_message_id = message_id
        delivery.sent_at = datetime.now(timezone.utc)
        delivery.error_message = None
    except Exception as exc:
        logger.exception("Failed to send report email for project %s", project_id)
        delivery.status = "failed"
        delivery.error_message = str(exc)

    await session.commit()
    await session.refresh(delivery)
    return delivery


async def list_report_deliveries(
    session: AsyncSession,
    project_id: int,
    limit: int = 20,
) -> list[ReportDelivery]:
    return await ReportDeliveryRepository(session).list_by_project(project_id, limit=limit)
