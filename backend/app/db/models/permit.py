from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.models.mixins import CreatedAtMixin

if TYPE_CHECKING:
    from app.db.models.project import Project


class Permit(Base, CreatedAtMixin):
    __tablename__ = "permits"

    permit_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("projects.project_id"), nullable=False, index=True
    )
    permit_name: Mapped[Optional[str]] = mapped_column(String(255))
    permit_category: Mapped[Optional[str]] = mapped_column(String(100))
    status: Mapped[Optional[str]] = mapped_column(String(50))
    estimated_approval_days: Mapped[Optional[int]] = mapped_column(Integer)
    application_reference: Mapped[Optional[str]] = mapped_column(String(255))
    required_documents: Mapped[Optional[str]] = mapped_column(Text)
    critical_path_impact: Mapped[Optional[bool]] = mapped_column(Boolean)

    project: Mapped[Project] = relationship(back_populates="permits")
