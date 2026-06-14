from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SupplierMasterCreate(BaseModel):
    supplier_code: str
    supplier_name: Optional[str] = None
    supplier_category: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    lead_time_days: Optional[int] = None
    reliability_score: Optional[Decimal] = None
    preferred_supplier: Optional[bool] = None
    status: Optional[str] = None


class SupplierMasterUpdate(BaseModel):
    supplier_code: Optional[str] = None
    supplier_name: Optional[str] = None
    supplier_category: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    lead_time_days: Optional[int] = None
    reliability_score: Optional[Decimal] = None
    preferred_supplier: Optional[bool] = None
    status: Optional[str] = None


class SupplierMasterRead(SupplierMasterCreate):
    model_config = ConfigDict(from_attributes=True)

    supplier_id: int
    created_at: datetime
