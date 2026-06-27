from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class DocumentCreate(BaseModel):
    project_id: int
    document_type: Optional[str] = None
    file_name: Optional[str] = None
    file_content: Optional[bytes] = None
    content_type: Optional[str] = "application/pdf"
    file_size_bytes: Optional[int] = None
    extracted_text: Optional[str] = None
    uploaded_by: Optional[str] = None


class DocumentUpdate(BaseModel):
    document_type: Optional[str] = None
    file_name: Optional[str] = None
    file_content: Optional[bytes] = None
    content_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    extracted_text: Optional[str] = None
    uploaded_by: Optional[str] = None


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: int
    project_id: int
    document_type: Optional[str] = None
    file_name: Optional[str] = None
    content_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    extracted_text: Optional[str] = None
    uploaded_by: Optional[str] = None
    created_at: datetime
    has_file: bool = False

    @model_validator(mode="before")
    @classmethod
    def compute_has_file(cls, data):
        if isinstance(data, dict):
            if "has_file" not in data:
                data["has_file"] = bool(data.get("file_content"))
            return data
        file_content = getattr(data, "file_content", None)
        payload = {
            "document_id": data.document_id,
            "project_id": data.project_id,
            "document_type": data.document_type,
            "file_name": data.file_name,
            "content_type": data.content_type,
            "file_size_bytes": data.file_size_bytes,
            "extracted_text": data.extracted_text,
            "uploaded_by": data.uploaded_by,
            "created_at": data.created_at,
            "has_file": bool(file_content),
        }
        return payload


class ProjectDocumentsResponse(BaseModel):
    project_id: int
    documents: list[DocumentRead] = Field(default_factory=list)
