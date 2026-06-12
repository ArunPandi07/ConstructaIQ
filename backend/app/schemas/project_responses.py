from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.agent_execution import AgentExecutionRead
from app.schemas.crew_plan import CrewPlanRead
from app.schemas.document import DocumentRead
from app.schemas.project import ProjectRead
from app.schemas.project_supplier import ProjectSupplierRead


class ProjectUploadResponse(BaseModel):
    project_id: int
    documents: list[DocumentRead]


class AnalyzeJobResponse(BaseModel):
    job_id: str
    project_id: int
    status: str


class AnalyzeJobStatusResponse(BaseModel):
    job_id: str
    project_id: int
    status: str
    progress_step: Optional[str] = None
    overall_pct: Optional[int] = None
    result: Optional[dict[str, Any]] = None
    error: Optional[str] = None


class ProjectSummaryResponse(BaseModel):
    project: ProjectRead
    intelligence: dict[str, Any]


class ProjectAgentsResponse(BaseModel):
    project_id: int
    agents: list[AgentExecutionRead]


class ProjectSuppliersResponse(BaseModel):
    project_id: int
    suppliers: list[ProjectSupplierRead]


class ProjectCrewResponse(BaseModel):
    project_id: int
    crew_plans: list[CrewPlanRead]


class CallAgentRequest(BaseModel):
    agent_name: str
    version: str = "default"
    text: str


class CallAgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    agent_name: str
    version: str
    output: Any
