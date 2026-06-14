from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CrewMasterCreate(BaseModel):
    employee_code: str
    employee_name: Optional[str] = None
    skill_type: Optional[str] = None
    experience_years: Optional[int] = None
    daily_rate: Optional[Decimal] = None
    availability_status: Optional[str] = None
    certification: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class CrewMasterUpdate(BaseModel):
    employee_code: Optional[str] = None
    employee_name: Optional[str] = None
    skill_type: Optional[str] = None
    experience_years: Optional[int] = None
    daily_rate: Optional[Decimal] = None
    availability_status: Optional[str] = None
    certification: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class CrewMasterRead(CrewMasterCreate):
    model_config = ConfigDict(from_attributes=True)

    crew_id: int
    created_at: datetime
