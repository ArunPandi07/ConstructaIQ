from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ProjectAnalyzeJob(Base):
    __tablename__ = "analyze_jobs"

    job_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    overall_pct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    triggering_user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    send_report_email: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    report_delivery_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    report_delivery_error: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
