from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProjectCreate(BaseModel):
    project_name: str
    project_type: Optional[str] = None
    location: Optional[str] = None
    client_name: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    target_completion_date: Optional[date] = None
    contract_value: Optional[Decimal] = None
    duration_months: Optional[int] = None
    scope: Optional[str] = None
    milestones: Optional[str] = None
    square_footage: Optional[Decimal] = None
    floor_count: Optional[int] = None
    complexity_level: Optional[str] = None
    priority_score: Optional[int] = None
    building_definition_json: Optional[str] = None
    zoning_data_json: Optional[str] = None
    budget_data_json: Optional[str] = None
    safety_data_json: Optional[str] = None


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    project_type: Optional[str] = None
    location: Optional[str] = None
    client_name: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    target_completion_date: Optional[date] = None
    contract_value: Optional[Decimal] = None
    duration_months: Optional[int] = None
    scope: Optional[str] = None
    milestones: Optional[str] = None
    square_footage: Optional[Decimal] = None
    floor_count: Optional[int] = None
    complexity_level: Optional[str] = None
    priority_score: Optional[int] = None
    building_definition_json: Optional[str] = None
    zoning_data_json: Optional[str] = None
    budget_data_json: Optional[str] = None
    safety_data_json: Optional[str] = None


class ProjectRead(ProjectCreate):
    model_config = ConfigDict(from_attributes=True)

    project_id: int
