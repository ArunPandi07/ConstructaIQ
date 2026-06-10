from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProjectSupplierCreate(BaseModel):
    project_id: int
    material_name: Optional[str] = None
    supplier_name: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    delivery_date: Optional[date] = None
    total_cost: Optional[Decimal] = None


class ProjectSupplierUpdate(BaseModel):
    material_name: Optional[str] = None
    supplier_name: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    delivery_date: Optional[date] = None
    total_cost: Optional[Decimal] = None


class ProjectSupplierRead(ProjectSupplierCreate):
    model_config = ConfigDict(from_attributes=True)

    supplier_record_id: int
    created_at: datetime
