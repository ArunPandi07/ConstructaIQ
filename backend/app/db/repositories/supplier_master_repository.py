from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.supplier_master import SupplierMaster
from app.db.repositories.base import BaseRepository


class SupplierMasterRepository(BaseRepository[SupplierMaster]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, SupplierMaster, "supplier_id")

    async def get_by_code(self, supplier_code: str) -> SupplierMaster | None:
        stmt = select(SupplierMaster).where(SupplierMaster.supplier_code == supplier_code)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
