from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProjectRiskCreate(BaseModel):
    project_id: int
    source_agent: Optional[str] = None
    category: Optional[str] = None
    title: Optional[str] = None
    severity: Optional[str] = None
    detail: Optional[str] = None
    status: Optional[str] = "open"


class ProjectRiskRead(ProjectRiskCreate):
    model_config = ConfigDict(from_attributes=True)

    risk_id: int
    created_at: datetime
