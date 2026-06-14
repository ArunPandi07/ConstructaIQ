from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, ForeignKey, Identity, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.models.mixins import CreatedAtMixin

if TYPE_CHECKING:
    from app.db.models.supplier_master import SupplierMaster


class SupplierMaterial(Base, CreatedAtMixin):
    __tablename__ = "supplier_materials"

    supplier_material_id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=False), primary_key=True
    )
    supplier_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("supplier_master.supplier_id"),
        nullable=False,
        index=True,
    )
    material_name: Mapped[Optional[str]] = mapped_column(String(255))
    material_category: Mapped[Optional[str]] = mapped_column(String(100))
    unit_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    currency_code: Mapped[Optional[str]] = mapped_column(String(10))
    moq: Mapped[Optional[int]] = mapped_column(Integer)
    lead_time_days: Mapped[Optional[int]] = mapped_column(Integer)

    supplier: Mapped[SupplierMaster] = relationship(back_populates="materials")
