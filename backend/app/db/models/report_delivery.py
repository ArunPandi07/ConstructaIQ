from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mysql_types import LongText
from app.db.models.mixins import CreatedAtMixin

if TYPE_CHECKING:
    from app.db.models.project import Project
    from app.db.models.user import User


class ReportDelivery(Base, CreatedAtMixin):
    __tablename__ = "report_deliveries"

    delivery_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("projects.project_id"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.user_id"), nullable=False, index=True
    )
    job_id: Mapped[Optional[str]] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="queued")
    recipient_email: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[Optional[str]] = mapped_column(String(500))
    provider_message_id: Mapped[Optional[str]] = mapped_column(String(255))
    error_message: Mapped[Optional[str]] = mapped_column(LongText)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    report_snapshot_json: Mapped[Optional[str]] = mapped_column(LongText)

    project: Mapped[Project] = relationship()
    user: Mapped[User] = relationship()
