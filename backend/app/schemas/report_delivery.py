from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ReportDeliveryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    delivery_id: int
    project_id: int
    user_id: int
    job_id: Optional[str] = None
    status: str
    recipient_email: str
    subject: Optional[str] = None
    provider_message_id: Optional[str] = None
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime


class ReportEmailResponse(BaseModel):
    delivery_id: int
    status: str
    recipient_email: str
    error_message: Optional[str] = None
