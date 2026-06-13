from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, Date, Identity, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.agent_execution import AgentExecution
    from app.db.models.budget import Budget
    from app.db.models.crew_plan import CrewPlan
    from app.db.models.document import Document
    from app.db.models.inspection import Inspection
    from app.db.models.permit import Permit
    from app.db.models.project_risk import ProjectRisk
    from app.db.models.project_supplier import ProjectSupplier
    from app.db.models.schedule import Schedule


class Project(Base):
    __tablename__ = "projects"

    project_id: Mapped[int] = mapped_column(
        BigInteger, Identity(always=False), primary_key=True
    )
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    project_type: Mapped[Optional[str]] = mapped_column(String(100))
    location: Mapped[Optional[str]] = mapped_column(String(255))
    client_name: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[Optional[str]] = mapped_column(String(50))
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    target_completion_date: Mapped[Optional[date]] = mapped_column(Date)
    contract_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    duration_months: Mapped[Optional[int]] = mapped_column(Integer)
    scope: Mapped[Optional[str]] = mapped_column(Text)
    milestones: Mapped[Optional[str]] = mapped_column(Text)
    square_footage: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 4))
    floor_count: Mapped[Optional[int]] = mapped_column(Integer)
    complexity_level: Mapped[Optional[str]] = mapped_column(String(50))
    priority_score: Mapped[Optional[int]] = mapped_column(Integer)

    documents: Mapped[list[Document]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    agent_executions: Mapped[list[AgentExecution]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    permits: Mapped[list[Permit]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    schedules: Mapped[list[Schedule]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    project_suppliers: Mapped[list[ProjectSupplier]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    crew_plans: Mapped[list[CrewPlan]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    inspections: Mapped[list[Inspection]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    budgets: Mapped[list[Budget]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    project_risks: Mapped[list[ProjectRisk]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
