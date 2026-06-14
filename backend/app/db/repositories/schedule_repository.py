from sqlalchemy import delete, select
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
            .order_by(Schedule.schedule_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_projects(
        self, project_ids: list[int], *, limit: int = 5000
    ) -> list[Schedule]:
        if not project_ids:
            return []
        stmt = (
            select(Schedule)
            .where(Schedule.project_id.in_(project_ids))
            .order_by(Schedule.project_id, Schedule.schedule_id)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete_by_project(self, project_id: int) -> int:
        stmt = delete(Schedule).where(Schedule.project_id == project_id)
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount or 0
