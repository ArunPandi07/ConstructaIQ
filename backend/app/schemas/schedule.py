from typing import Optional

from pydantic import BaseModel, ConfigDict


class ScheduleCreate(BaseModel):
    project_id: int
    total_duration_days: Optional[int] = None
    phase_breakdown: Optional[str] = None
    work_packages: Optional[str] = None


class ScheduleUpdate(BaseModel):
    total_duration_days: Optional[int] = None
    phase_breakdown: Optional[str] = None
    work_packages: Optional[str] = None


class ScheduleRead(ScheduleCreate):
    model_config = ConfigDict(from_attributes=True)

    schedule_id: int
