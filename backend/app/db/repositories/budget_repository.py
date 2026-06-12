from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.budget import Budget
from app.db.repositories.base import BaseRepository


class BudgetRepository(BaseRepository[Budget]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Budget, "budget_id")

    async def list_by_project(
        self, project_id: int, *, skip: int = 0, limit: int = 100
    ) -> list[Budget]:
        stmt = (
            select(Budget)
            .where(Budget.project_id == project_id)
            .order_by(Budget.budget_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete_by_project(self, project_id: int) -> int:
        stmt = delete(Budget).where(Budget.project_id == project_id)
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount or 0
