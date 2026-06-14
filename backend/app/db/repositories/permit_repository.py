from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.permit import Permit
from app.db.repositories.base import BaseRepository


class PermitRepository(BaseRepository[Permit]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Permit, "permit_id")

    async def list_by_project(
        self, project_id: int, *, skip: int = 0, limit: int = 100
    ) -> list[Permit]:
        stmt = (
            select(Permit)
            .where(Permit.project_id == project_id)
            .order_by(Permit.permit_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_projects(
        self, project_ids: list[int], *, limit: int = 5000
    ) -> list[Permit]:
        if not project_ids:
            return []
        stmt = (
            select(Permit)
            .where(Permit.project_id.in_(project_ids))
            .order_by(Permit.project_id, Permit.permit_id)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete_by_project(self, project_id: int) -> int:
        stmt = delete(Permit).where(Permit.project_id == project_id)
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount or 0
