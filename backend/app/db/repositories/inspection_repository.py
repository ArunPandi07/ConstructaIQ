from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.inspection import Inspection
from app.db.repositories.base import BaseRepository


class InspectionRepository(BaseRepository[Inspection]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Inspection, "inspection_id")

    async def list_by_project(
        self, project_id: int, *, skip: int = 0, limit: int = 100
    ) -> list[Inspection]:
        stmt = (
            select(Inspection)
            .where(Inspection.project_id == project_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
