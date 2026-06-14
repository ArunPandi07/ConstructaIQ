from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, Boolean, Identity, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.models.mixins import CreatedAtMixin

if TYPE_CHECKING:
    from app.db.models.supplier_material import SupplierMaterial


class SupplierMaster(Base, CreatedAtMixin):
    __tablename__ = "supplier_master"

    supplier_id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=False), primary_key=True
    )
    supplier_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    supplier_name: Mapped[Optional[str]] = mapped_column(String(255))
    supplier_category: Mapped[Optional[str]] = mapped_column(String(100))
    contact_person: Mapped[Optional[str]] = mapped_column(String(255))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    location: Mapped[Optional[str]] = mapped_column(String(255))
    lead_time_days: Mapped[Optional[int]] = mapped_column(Integer)
    reliability_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2))
    preferred_supplier: Mapped[Optional[bool]] = mapped_column(Boolean)
    status: Mapped[Optional[str]] = mapped_column(String(50))

    materials: Mapped[list[SupplierMaterial]] = relationship(
        back_populates="supplier", cascade="all, delete-orphan"
    )
