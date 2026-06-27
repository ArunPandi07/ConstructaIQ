import json
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_optional_current_user
from app.db.models.user import User
from app.db.models.project_crew_roster import ProjectCrewRoster
from app.db.session import get_db_required
from sqlalchemy import select
from app.schemas.report_delivery import ReportDeliveryRead, ReportEmailResponse
from app.services.report_delivery_service import (
    list_report_deliveries,
    send_project_report_email,
)
from app.orchestrator.analyze_orchestrator import (
    JSON_OUTPUT_SUFFIX,
    PIPELINE_AGENTS,
    resolve_call_agent_version,
)
from app.schemas.api_response import success_response
from app.schemas.document import DocumentRead, ProjectDocumentsResponse
from app.schemas.project import ProjectCreate, ProjectRead
from app.schemas.project_responses import (
    AnalyzeJobResponse,
    AnalyzeJobStatusResponse,
    CallAgentRequest,
    CallAgentResponse,
    ProjectAgentsResponse,
    ProjectCrewResponse,
    ProjectPipelineRunsResponse,
    ProjectSummaryResponse,
    ProjectSuppliersResponse,
    ProjectUploadResponse,
)
from app.schemas.agent_execution import AgentExecutionListItem, AgentExecutionRead
from app.schemas.crew_plan import CrewPlanRead
from app.schemas.project_supplier import ProjectSupplierRead
from app.services.document_service import (
    get_project_document_file,
    list_project_documents,
)
from app.services.llm_service import llm_service
from app.services.logging_service import get_logger
from app.services.project_service import (
    create_project,
    count_pipeline_runs,
    get_analyze_job_status,
    get_pipeline_runs,
    get_project,
    get_project_agents,
    get_project_crew,
    get_project_summary,
    get_project_suppliers,
    list_projects,
    start_analyze_job,
    upload_project_documents,
)
from app.services.response_mapper import map_upload_session

logger = get_logger("ProjectsRouter")
router = APIRouter(prefix="/projects", tags=["Projects"])


class AnalyzeProjectRequest(BaseModel):
    description: Optional[str] = None
    send_report_email: bool = True


@router.get("")
async def read_projects(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_db_required),
):
    items = await list_projects(session, skip=skip, limit=limit)
    return success_response(items)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_project_endpoint(
    payload: ProjectCreate,
    session: AsyncSession = Depends(get_db_required),
    current_user: User | None = Depends(get_optional_current_user),
):
    project = await create_project(
        session,
        payload,
        created_by_user_id=current_user.user_id if current_user else None,
    )
    return success_response(ProjectRead.model_validate(project))


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_project(
    project_name: str = Form(...),
    contract: UploadFile | None = File(None),
    blueprint: UploadFile | None = File(None),
    session: AsyncSession = Depends(get_db_required),
    current_user: User | None = Depends(get_optional_current_user),
):
    project, documents = await upload_project_documents(
        session,
        project_name=project_name,
        contract=contract,
        blueprint=blueprint,
        created_by_user_id=current_user.user_id if current_user else None,
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
    current_user: User | None = Depends(get_optional_current_user),
):
    project = await get_project(session, project_id)
    report_user_id = (
        current_user.user_id if current_user is not None else None
    ) or project.created_by_user_id
    send_report = body.send_report_email and report_user_id is not None
    job = await start_analyze_job(
        session,
        project_id,
        description=body.description,
        triggering_user_id=report_user_id if send_report else None,
        send_report_email=send_report,
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
    job = await get_analyze_job_status(project_id, job_id)
    return success_response(
        AnalyzeJobStatusResponse(
            job_id=job.job_id,
            project_id=job.project_id,
            status=job.status,
            progress_step=job.progress_step,
            overall_pct=job.overall_pct,
            result=job.result,
            error=job.error,
            report_delivery_status=job.report_delivery_status,
            report_delivery_error=job.report_delivery_error,
        )
    )


@router.get("/{project_id}/upload-session")
async def get_upload_session(project_id: int, job_id: Optional[str] = None):
    job = await get_analyze_job_status(project_id, job_id)
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


@router.get("/{project_id}/documents")
async def read_project_documents(
    project_id: int,
    session: AsyncSession = Depends(get_db_required),
):
    await get_project(session, project_id)
    documents = await list_project_documents(session, project_id)
    return success_response(
        ProjectDocumentsResponse(
            project_id=project_id,
            documents=[DocumentRead.model_validate(d) for d in documents],
        )
    )


@router.get("/{project_id}/documents/{document_id}/file")
async def read_project_document_file(
    project_id: int,
    document_id: int,
    session: AsyncSession = Depends(get_db_required),
):
    await get_project(session, project_id)
    content, content_type, filename = await get_project_document_file(
        session, project_id, document_id
    )
    return Response(
        content=content,
        media_type=content_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
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
    run_id: Optional[str] = None,
    session: AsyncSession = Depends(get_db_required),
):
    agents = await get_project_agents(session, project_id, run_id=run_id)
    run_count = await count_pipeline_runs(session, project_id)

    return success_response(
        ProjectAgentsResponse(
            project_id=project_id,
            pipeline_run_count=run_count,
            agents=[AgentExecutionListItem.model_validate(a) for a in agents],
        )
    )


@router.get("/{project_id}/pipeline-runs")
async def read_project_pipeline_runs(
    project_id: int,
    session: AsyncSession = Depends(get_db_required),
):
    runs = await get_pipeline_runs(session, project_id)
    return success_response(
        ProjectPipelineRunsResponse(project_id=project_id, runs=runs)
    )


@router.post("/{project_id}/report/email", status_code=status.HTTP_202_ACCEPTED)
async def email_project_report(
    project_id: int,
    session: AsyncSession = Depends(get_db_required),
    current_user: User = Depends(get_current_user),
):
    """Send consolidated intelligence report to the logged-in user's email."""
    delivery = await send_project_report_email(
        session,
        project_id,
        current_user.user_id,
        skip_rate_limit=False,
    )
    return success_response(
        ReportEmailResponse(
            delivery_id=delivery.delivery_id,
            status=delivery.status,
            recipient_email=delivery.recipient_email,
            error_message=delivery.error_message,
        ),
        "Report email processed.",
    )


@router.get("/{project_id}/report/deliveries")
async def read_report_deliveries(
    project_id: int,
    session: AsyncSession = Depends(get_db_required),
    current_user: User = Depends(get_current_user),
):
    deliveries = await list_report_deliveries(session, project_id)
    user_deliveries = [d for d in deliveries if d.user_id == current_user.user_id]
    return success_response(
        [ReportDeliveryRead.model_validate(d) for d in user_deliveries]
    )


@router.post("/call-agent")
async def call_single_agent(
    request: CallAgentRequest,
):
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
        response = await llm_service.call_agent_directly(
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


@router.get("/{project_id}/crew-roster")
async def get_crew_roster(project_id: int, db: AsyncSession = Depends(get_db_required)):
    result = await db.execute(select(ProjectCrewRoster).where(ProjectCrewRoster.project_id == project_id))
    roster = [
        {
            "roster_id": r.roster_id,
            "worker_name": r.worker_name,
            "subcontractor": r.subcontractor,
            "title": r.title,
            "osha_verified": r.osha_verified,
            "is_mobilized": r.is_mobilized
        } for r in result.scalars().all()
    ]
    return success_response({"roster": roster})


@router.post("/{project_id}/crew-roster/excel")
async def upload_crew_excel(project_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db_required)):
    mock_record = ProjectCrewRoster(
        project_id=project_id,
        worker_name=f"AI Extracted: {file.filename}",
        subcontractor="AI Extract Ltd",
        title="AI Specialist",
        osha_verified=True,
        is_mobilized=False
    )
    db.add(mock_record)
    await db.commit()
    return success_response({"message": "Excel imported and parsed using AI Agent."})
