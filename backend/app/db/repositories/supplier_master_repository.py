from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.supplier_master import SupplierMaster
from app.db.repositories.base import BaseRepository


class SupplierMasterRepository(BaseRepository[SupplierMaster]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, SupplierMaster, "supplier_id")

    async def get_by_code(self, supplier_code: str) -> SupplierMaster | None:
        stmt = select(SupplierMaster).where(SupplierMaster.supplier_code == supplier_code)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_with_materials(
        self, *, skip: int = 0, limit: int = 500
    ) -> list[SupplierMaster]:
        stmt = (
            select(SupplierMaster)
            .options(selectinload(SupplierMaster.materials))
            .order_by(SupplierMaster.supplier_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())
