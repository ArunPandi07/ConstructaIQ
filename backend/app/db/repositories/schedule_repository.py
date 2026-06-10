from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.schedule import Schedule
from app.db.repositories.base import BaseRepository


class ScheduleRepository(BaseRepository[Schedule]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Schedule, "schedule_id")

    async def list_by_project(
        self, project_id: int, *, skip: int = 0, limit: int = 100
    ) -> list[Schedule]:
        stmt = (
            select(Schedule)
            .where(Schedule.project_id == project_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
