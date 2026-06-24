from __future__ import annotations

from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.models.mixins import CreatedAtMixin


class CrewMaster(Base, CreatedAtMixin):
    __tablename__ = "crew_master"

    crew_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    employee_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    employee_name: Mapped[Optional[str]] = mapped_column(String(255))
    skill_type: Mapped[Optional[str]] = mapped_column(String(100))
    experience_years: Mapped[Optional[int]] = mapped_column(Integer)
    daily_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    availability_status: Mapped[Optional[str]] = mapped_column(String(50))
    certification: Mapped[Optional[str]] = mapped_column(String(255))
    location: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    email: Mapped[Optional[str]] = mapped_column(String(255))
