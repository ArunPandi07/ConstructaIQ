from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mysql_types import LongText
from app.db.models.mixins import CreatedAtMixin

if TYPE_CHECKING:
    from app.db.models.project import Project


class AgentExecution(Base, CreatedAtMixin):
    __tablename__ = "agent_executions"

    execution_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("projects.project_id"), nullable=False, index=True
    )
    agent_name: Mapped[Optional[str]] = mapped_column(String(100))
    agent_version: Mapped[Optional[str]] = mapped_column(String(50))
    run_id: Mapped[Optional[str]] = mapped_column(String(255))
    thread_id: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[Optional[str]] = mapped_column(String(50))
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer)
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer)
    output_json: Mapped[Optional[str]] = mapped_column(LongText)
    error_message: Mapped[Optional[str]] = mapped_column(LongText)

    project: Mapped[Project] = relationship(back_populates="agent_executions")
