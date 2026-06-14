from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PermitCreate(BaseModel):
    project_id: int
    permit_name: Optional[str] = None
    permit_category: Optional[str] = None
    status: Optional[str] = None
    estimated_approval_days: Optional[int] = None
    application_reference: Optional[str] = None
    required_documents: Optional[str] = None
    critical_path_impact: Optional[bool] = None


class PermitUpdate(BaseModel):
    permit_name: Optional[str] = None
    permit_category: Optional[str] = None
    status: Optional[str] = None
    estimated_approval_days: Optional[int] = None
    application_reference: Optional[str] = None
    required_documents: Optional[str] = None
    critical_path_impact: Optional[bool] = None


class PermitRead(PermitCreate):
    model_config = ConfigDict(from_attributes=True)

    permit_id: int
    created_at: datetime
