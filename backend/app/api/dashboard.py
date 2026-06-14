from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_required
from app.schemas.api_response import success_response
from app.schemas.project_responses import DashboardResponse
from app.services.project_service import get_dashboard

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
async def read_dashboard(
    session: AsyncSession = Depends(get_db_required),
    include_projects: bool = False,
):
    data = await get_dashboard(session, include_projects=include_projects)
    return success_response(DashboardResponse.model_validate(data))
