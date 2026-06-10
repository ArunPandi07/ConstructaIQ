from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.supplier_material import SupplierMaterial
from app.db.repositories.base import BaseRepository


class SupplierMaterialRepository(BaseRepository[SupplierMaterial]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, SupplierMaterial, "supplier_material_id")

    async def list_by_supplier(
        self, supplier_id: int, *, skip: int = 0, limit: int = 100
    ) -> list[SupplierMaterial]:
        stmt = (
            select(SupplierMaterial)
            .where(SupplierMaterial.supplier_id == supplier_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
