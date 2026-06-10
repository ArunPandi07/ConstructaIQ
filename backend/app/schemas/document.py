from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DocumentCreate(BaseModel):
    project_id: int
    document_type: Optional[str] = None
    file_name: Optional[str] = None
    blob_url: Optional[str] = None
    extracted_text: Optional[str] = None
    uploaded_by: Optional[str] = None


class DocumentUpdate(BaseModel):
    document_type: Optional[str] = None
    file_name: Optional[str] = None
    blob_url: Optional[str] = None
    extracted_text: Optional[str] = None
    uploaded_by: Optional[str] = None


class DocumentRead(DocumentCreate):
    model_config = ConfigDict(from_attributes=True)

    document_id: int
    created_at: datetime
