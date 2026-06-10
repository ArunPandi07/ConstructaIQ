from sqlalchemy import select
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
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
