from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.crew_master import CrewMaster
from app.db.repositories.base import BaseRepository


class CrewMasterRepository(BaseRepository[CrewMaster]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, CrewMaster, "crew_id")

    async def get_by_employee_code(self, employee_code: str) -> CrewMaster | None:
        stmt = select(CrewMaster).where(CrewMaster.employee_code == employee_code)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
