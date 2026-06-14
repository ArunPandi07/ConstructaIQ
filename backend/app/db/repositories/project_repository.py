from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.project import Project
from app.db.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Project, "project_id")

    async def list_by_status(self, status: str, *, skip: int = 0, limit: int = 100) -> list[Project]:
        stmt = (
            select(Project)
            .where(Project.status == status)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_desc(
        self, *, skip: int = 0, limit: int = 100, include_related: bool = False
    ) -> list[Project]:
        stmt = select(Project).order_by(Project.project_id.desc()).offset(skip).limit(limit)
        if include_related:
            stmt = stmt.options(
                selectinload(Project.documents),
                selectinload(Project.agent_executions),
                selectinload(Project.permits),
                selectinload(Project.schedules),
                selectinload(Project.project_suppliers),
                selectinload(Project.crew_plans),
                selectinload(Project.inspections),
                selectinload(Project.budgets),
                selectinload(Project.project_risks),
            )
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())
