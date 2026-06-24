from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.project import Project


class Schedule(Base):
    __tablename__ = "schedules"

    schedule_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("projects.project_id"), nullable=False, index=True
    )
    total_duration_days: Mapped[Optional[int]] = mapped_column(Integer)
    phase_breakdown: Mapped[Optional[str]] = mapped_column(Text)
    work_packages: Mapped[Optional[str]] = mapped_column(Text)

    project: Mapped[Project] = relationship(back_populates="schedules")
