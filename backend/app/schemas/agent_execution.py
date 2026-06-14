from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AgentExecutionCreate(BaseModel):
    project_id: int
    agent_name: Optional[str] = None
    agent_version: Optional[str] = None
    run_id: Optional[str] = None
    thread_id: Optional[str] = None
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    tokens_used: Optional[int] = None
    output_json: Optional[str] = None
    error_message: Optional[str] = None


class AgentExecutionUpdate(BaseModel):
    agent_name: Optional[str] = None
    agent_version: Optional[str] = None
    run_id: Optional[str] = None
    thread_id: Optional[str] = None
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    tokens_used: Optional[int] = None
    output_json: Optional[str] = None
    error_message: Optional[str] = None


class AgentExecutionRead(AgentExecutionCreate):
    model_config = ConfigDict(from_attributes=True)

    execution_id: int
    created_at: datetime


class AgentExecutionListItem(BaseModel):
    """Lightweight schema for list endpoints — excludes output_json to avoid
    async lazy-load issues with deferred columns."""
    model_config = ConfigDict(from_attributes=True)

    execution_id: int
    project_id: int
    agent_name: Optional[str] = None
    agent_version: Optional[str] = None
    run_id: Optional[str] = None
    thread_id: Optional[str] = None
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    tokens_used: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
