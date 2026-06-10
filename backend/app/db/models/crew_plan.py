from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, Date, ForeignKey, Identity, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.models.mixins import CreatedAtMixin

if TYPE_CHECKING:
    from app.db.models.project import Project


class CrewPlan(Base, CreatedAtMixin):
    __tablename__ = "crew_plans"

    crew_plan_id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=False), primary_key=True
    )
    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("projects.project_id"), nullable=False, index=True
    )
    phase_name: Mapped[Optional[str]] = mapped_column(String(255))
    crew_name: Mapped[Optional[str]] = mapped_column(String(255))
    labor_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)

    project: Mapped[Project] = relationship(back_populates="crew_plans")
