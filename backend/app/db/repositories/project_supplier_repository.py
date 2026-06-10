from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.project_supplier import ProjectSupplier
from app.db.repositories.base import BaseRepository


class ProjectSupplierRepository(BaseRepository[ProjectSupplier]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ProjectSupplier, "supplier_record_id")

    async def list_by_project(
        self, project_id: int, *, skip: int = 0, limit: int = 100
    ) -> list[ProjectSupplier]:
        stmt = (
            select(ProjectSupplier)
            .where(ProjectSupplier.project_id == project_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
