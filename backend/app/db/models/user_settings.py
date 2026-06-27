from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    setting_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.user_id"), unique=True, nullable=False
    )
    
    # Model configuration
    model_preference: Mapped[str] = mapped_column(String(255), default="google/gemma-4-26b-a4b-it", nullable=False)
    
    # Site Alert Handlers
    alert_weather_crane: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    alert_lumber_hedge: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # user = relationship("User", back_populates="settings")
