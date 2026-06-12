import json
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_required
from app.orchestrator.analyze_orchestrator import (
    PIPELINE_AGENTS,
    resolve_call_agent_version,
)
from app.schemas.api_response import success_response
from app.schemas.document import DocumentRead
from app.schemas.project import ProjectCreate, ProjectRead
from app.schemas.project_responses import (
    AnalyzeJobResponse,
    AnalyzeJobStatusResponse,
    CallAgentRequest,
    CallAgentResponse,
    ProjectAgentsResponse,
    ProjectCrewResponse,
    ProjectSummaryResponse,
    ProjectSuppliersResponse,
    ProjectUploadResponse,
)
from app.schemas.agent_execution import AgentExecutionRead
from app.schemas.crew_plan import CrewPlanRead
from app.schemas.project_supplier import ProjectSupplierRead
from app.services.foundry_service import foundry_service
from app.services.logging_service import get_logger
from app.services.project_service import (
    create_project,
    get_analyze_job_status,
    get_project,
    get_project_agents,
    get_project_crew,
    get_project_summary,
    get_project_suppliers,
    start_analyze_job,
    upload_project_documents,
)
from app.services.response_mapper import map_upload_session

logger = get_logger("ProjectsRouter")
router = APIRouter(prefix="/projects", tags=["Projects"])


class AnalyzeProjectRequest(BaseModel):
    description: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_project_endpoint(
    payload: ProjectCreate,
    session: AsyncSession = Depends(get_db_required),
):
    project = await create_project(session, payload)
    return success_response(ProjectRead.model_validate(project))


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_project(
    project_name: str = Form(...),
    contract: UploadFile | None = File(None),
    blueprint: UploadFile | None = File(None),
    session: AsyncSession = Depends(get_db_required),
):
    project, documents = await upload_project_documents(
        session,
        project_name=project_name,
        contract=contract,
        blueprint=blueprint,
    )
    return success_response(
        ProjectUploadResponse(
            project_id=project.project_id,
            documents=[DocumentRead.model_validate(d) for d in documents],
        )
    )


@router.post("/{project_id}/analyze", status_code=status.HTTP_202_ACCEPTED)
async def analyze_project(
    project_id: int,
    body: AnalyzeProjectRequest = AnalyzeProjectRequest(),
    session: AsyncSession = Depends(get_db_required),
):
    job = await start_analyze_job(
        session,
        project_id,
        description=body.description,
    )
    return success_response(
        AnalyzeJobResponse(
            job_id=job.job_id,
            project_id=project_id,
            status=job.status,
        )
    )


@router.get("/{project_id}/analyze/status")
async def analyze_project_status(
    project_id: int,
    job_id: Optional[str] = None,
):
    job = get_analyze_job_status(project_id, job_id)
    return success_response(
        AnalyzeJobStatusResponse(
            job_id=job.job_id,
            project_id=job.project_id,
            status=job.status,
            progress_step=job.progress_step,
            overall_pct=job.overall_pct,
            result=job.result,
            error=job.error,
        )
    )


@router.get("/{project_id}/upload-session")
async def get_upload_session(project_id: int, job_id: Optional[str] = None):
    job = get_analyze_job_status(project_id, job_id)
    return success_response(map_upload_session(job))


@router.get("/{project_id}")
async def read_project(
    project_id: int,
    session: AsyncSession = Depends(get_db_required),
):
    project = await get_project(session, project_id)
    return success_response(ProjectRead.model_validate(project))


@router.get("/{project_id}/summary")
async def read_project_summary(
    project_id: int,
    session: AsyncSession = Depends(get_db_required),
):
    data = await get_project_summary(session, project_id)
    return success_response(
        ProjectSummaryResponse(
            project=ProjectRead.model_validate(data["project"]),
            intelligence=data["intelligence"],
        )
    )


@router.get("/{project_id}/suppliers")
async def read_project_suppliers(
    project_id: int,
    session: AsyncSession = Depends(get_db_required),
):
    suppliers = await get_project_suppliers(session, project_id)
    return success_response(
        ProjectSuppliersResponse(
            project_id=project_id,
            suppliers=[ProjectSupplierRead.model_validate(s) for s in suppliers],
        )
    )


@router.get("/{project_id}/crew")
async def read_project_crew(
    project_id: int,
    session: AsyncSession = Depends(get_db_required),
):
    crew_plans = await get_project_crew(session, project_id)
    return success_response(
        ProjectCrewResponse(
            project_id=project_id,
            crew_plans=[CrewPlanRead.model_validate(c) for c in crew_plans],
        )
    )


@router.get("/{project_id}/agents")
async def read_project_agents(
    project_id: int,
    session: AsyncSession = Depends(get_db_required),
):
    agents = await get_project_agents(session, project_id)
    return success_response(
        ProjectAgentsResponse(
            project_id=project_id,
            agents=[AgentExecutionRead.model_validate(a) for a in agents],
        )
    )


@router.post("/call-agent")
async def call_single_agent(request: CallAgentRequest):
    if request.agent_name not in PIPELINE_AGENTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Agent '{request.agent_name}' is not in the active pipeline. "
                f"Allowed: {', '.join(sorted(PIPELINE_AGENTS))}"
            ),
        )

    try:
        version = resolve_call_agent_version(request.agent_name, request.version)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    logger.info(
        "Direct agent call: agent_name=%s, version=%s",
        request.agent_name,
        version,
    )
    try:
        response = await foundry_service.call_agent_directly(
            text=request.text,
            agent_name=request.agent_name,
            version=version,
        )
        try:
            parsed_json = json.loads(response)
            output = parsed_json
        except Exception:
            output = response

        return success_response(
            CallAgentResponse(
                agent_name=request.agent_name,
                version=version,
                output=output,
            )
        )
    except Exception as e:
        logger.error("Failed direct agent execution: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute agent: {str(e)}",
        ) from e
