from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.models.mixins import CreatedAtMixin

if TYPE_CHECKING:
    from app.db.models.project import Project


class ProjectRisk(Base, CreatedAtMixin):
    __tablename__ = "project_risks"

    risk_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("projects.project_id"), nullable=False, index=True
    )
    source_agent: Mapped[Optional[str]] = mapped_column(String(50))
    category: Mapped[Optional[str]] = mapped_column(String(50))
    title: Mapped[Optional[str]] = mapped_column(String(500))
    severity: Mapped[Optional[str]] = mapped_column(String(50))
    detail: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[Optional[str]] = mapped_column(String(50))

    project: Mapped[Project] = relationship(back_populates="project_risks")
