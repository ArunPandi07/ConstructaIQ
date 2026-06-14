from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class InspectionCreate(BaseModel):
    project_id: int
    inspection_name: Optional[str] = None
    inspection_phase: Optional[str] = None
    inspection_date: Optional[date] = None
    status: Optional[str] = None


class InspectionUpdate(BaseModel):
    inspection_name: Optional[str] = None
    inspection_phase: Optional[str] = None
    inspection_date: Optional[date] = None
    status: Optional[str] = None


class InspectionRead(InspectionCreate):
    model_config = ConfigDict(from_attributes=True)

    inspection_id: int
    created_at: datetime
