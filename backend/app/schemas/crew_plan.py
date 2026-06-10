from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CrewPlanCreate(BaseModel):
    project_id: int
    phase_name: Optional[str] = None
    crew_name: Optional[str] = None
    labor_cost: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CrewPlanUpdate(BaseModel):
    phase_name: Optional[str] = None
    crew_name: Optional[str] = None
    labor_cost: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CrewPlanRead(CrewPlanCreate):
    model_config = ConfigDict(from_attributes=True)

    crew_plan_id: int
    created_at: datetime
