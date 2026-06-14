from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, ForeignKey, Identity, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.models.mixins import CreatedAtMixin

if TYPE_CHECKING:
    from app.db.models.project import Project


class Budget(Base, CreatedAtMixin):
    __tablename__ = "budgets"

    budget_id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=False), primary_key=True
    )
    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("projects.project_id"), nullable=False, index=True
    )
    total_budget: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    material_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    labor_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    equipment_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    contingency_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))

    project: Mapped[Project] = relationship(back_populates="budgets")
