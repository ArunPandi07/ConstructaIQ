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


class ProjectSupplier(Base, CreatedAtMixin):
    __tablename__ = "project_suppliers"

    supplier_record_id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=False), primary_key=True
    )
    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("projects.project_id"), nullable=False, index=True
    )
    material_name: Mapped[Optional[str]] = mapped_column(String(255))
    supplier_name: Mapped[Optional[str]] = mapped_column(String(255))
    quantity: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 4))
    unit_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    delivery_date: Mapped[Optional[date]] = mapped_column(Date)
    total_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))

    project: Mapped[Project] = relationship(back_populates="project_suppliers")
