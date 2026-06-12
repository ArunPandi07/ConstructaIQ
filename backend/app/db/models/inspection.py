from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, Date, ForeignKey, Identity, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.models.mixins import CreatedAtMixin

if TYPE_CHECKING:
    from app.db.models.project import Project


class Inspection(Base, CreatedAtMixin):
    __tablename__ = "inspections"

    inspection_id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=False), primary_key=True
    )
    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("projects.project_id"), nullable=False, index=True
    )
    inspection_name: Mapped[Optional[str]] = mapped_column(String(255))
    inspection_phase: Mapped[Optional[str]] = mapped_column(String(100))
    inspection_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[Optional[str]] = mapped_column(String(50))

    project: Mapped[Project] = relationship(back_populates="inspections")
