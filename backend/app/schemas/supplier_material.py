from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SupplierMaterialCreate(BaseModel):
    supplier_id: int
    material_name: Optional[str] = None
    material_category: Optional[str] = None
    unit_price: Optional[Decimal] = None
    currency_code: Optional[str] = None
    moq: Optional[int] = None
    lead_time_days: Optional[int] = None


class SupplierMaterialUpdate(BaseModel):
    material_name: Optional[str] = None
    material_category: Optional[str] = None
    unit_price: Optional[Decimal] = None
    currency_code: Optional[str] = None
    moq: Optional[int] = None
    lead_time_days: Optional[int] = None


class SupplierMaterialRead(SupplierMaterialCreate):
    model_config = ConfigDict(from_attributes=True)

    supplier_material_id: int
    created_at: datetime
