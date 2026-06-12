from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class BudgetCreate(BaseModel):
    project_id: int
    total_budget: Optional[Decimal] = None
    material_cost: Optional[Decimal] = None
    labor_cost: Optional[Decimal] = None
    equipment_cost: Optional[Decimal] = None
    contingency_cost: Optional[Decimal] = None


class BudgetUpdate(BaseModel):
    total_budget: Optional[Decimal] = None
    material_cost: Optional[Decimal] = None
    labor_cost: Optional[Decimal] = None
    equipment_cost: Optional[Decimal] = None
    contingency_cost: Optional[Decimal] = None


class BudgetRead(BudgetCreate):
    model_config = ConfigDict(from_attributes=True)

    budget_id: int
    created_at: datetime
