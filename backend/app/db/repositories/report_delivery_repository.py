from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.report_delivery import ReportDelivery
from app.db.repositories.base import BaseRepository


class ReportDeliveryRepository(BaseRepository[ReportDelivery]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ReportDelivery, "delivery_id")

    async def list_by_project(self, project_id: int, limit: int = 20) -> list[ReportDelivery]:
        stmt = (
            select(ReportDelivery)
            .where(ReportDelivery.project_id == project_id)
            .order_by(ReportDelivery.delivery_id.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def recent_for_user_project(
        self,
        project_id: int,
        user_id: int,
        *,
        since_minutes: int,
    ) -> list[ReportDelivery]:
        since = datetime.now(timezone.utc) - timedelta(minutes=since_minutes)
        stmt = (
            select(ReportDelivery)
            .where(
                ReportDelivery.project_id == project_id,
                ReportDelivery.user_id == user_id,
                ReportDelivery.created_at >= since,
                ReportDelivery.status == "sent",
            )
            .order_by(ReportDelivery.delivery_id.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
