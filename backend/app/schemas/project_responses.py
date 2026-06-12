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


class ProjectListItem(ProjectRead):
    agent_completed: int = 0
    supplier_count: int = 0
    crew_count: int = 0
    phase_progress: Optional[int] = None


class DashboardKPI(BaseModel):
    active_projects: int = 0
    risk_projects: int = 0
    on_time_projects: int = 0
    total_budget: str = "$0"
    open_risks: int = 0
    recovery_plans: int = 0


class DashboardActivityItem(BaseModel):
    id: int
    agent: str
    action: str
    time: str
    severity: str = "info"
    project: str
    project_id: int


class DashboardRecommendationItem(BaseModel):
    id: int
    project: str
    recommendation: str
    confidence: int = 75
    impact: str = "Medium"
    category: str = "Permits"


class DashboardResponse(BaseModel):
    kpi: DashboardKPI
    health_trend: list[dict[str, Any]] = []
    risk_distribution: list[dict[str, Any]] = []
    recent_activities: list[DashboardActivityItem] = []
    recent_recommendations: list[DashboardRecommendationItem] = []
    total_tokens_recent: int = 0
