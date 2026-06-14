from sqlalchemy import delete, select
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
            .order_by(ProjectSupplier.supplier_record_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_projects(
        self, project_ids: list[int], *, limit: int = 5000
    ) -> list[ProjectSupplier]:
        if not project_ids:
            return []
        stmt = (
            select(ProjectSupplier)
            .where(ProjectSupplier.project_id.in_(project_ids))
            .order_by(ProjectSupplier.project_id, ProjectSupplier.supplier_record_id)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete_by_project(self, project_id: int) -> int:
        stmt = delete(ProjectSupplier).where(ProjectSupplier.project_id == project_id)
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount or 0
