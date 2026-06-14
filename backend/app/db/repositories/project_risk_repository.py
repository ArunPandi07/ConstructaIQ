from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.project_risk import ProjectRisk
from app.db.repositories.base import BaseRepository


class ProjectRiskRepository(BaseRepository[ProjectRisk]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ProjectRisk, "risk_id")

    async def list_by_project(
        self, project_id: int, *, skip: int = 0, limit: int = 200
    ) -> list[ProjectRisk]:
        stmt = (
            select(ProjectRisk)
            .where(ProjectRisk.project_id == project_id)
            .order_by(ProjectRisk.risk_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_projects(
        self, project_ids: list[int], *, limit: int = 5000
    ) -> list[ProjectRisk]:
        if not project_ids:
            return []
        stmt = (
            select(ProjectRisk)
            .where(ProjectRisk.project_id.in_(project_ids))
            .order_by(ProjectRisk.project_id, ProjectRisk.risk_id)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def delete_by_project(self, project_id: int) -> int:
        stmt = delete(ProjectRisk).where(ProjectRisk.project_id == project_id)
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount or 0

    async def count_open_global(self) -> int:
        stmt = select(func.count()).select_from(ProjectRisk).where(
            ProjectRisk.status == "open"
        )
        result = await self.session.execute(stmt)
        return int(result.scalar() or 0)

    async def count_open_with_detail_global(self) -> int:
        stmt = (
            select(func.count())
            .select_from(ProjectRisk)
            .where(
                ProjectRisk.status == "open",
                ProjectRisk.detail.isnot(None),
                ProjectRisk.detail != "",
            )
        )
        result = await self.session.execute(stmt)
        return int(result.scalar() or 0)

    async def count_recovery_plans_global(self) -> int:
        """Supplier mitigations documented as recovery actions (distinct from all open risks)."""
        stmt = (
            select(func.count())
            .select_from(ProjectRisk)
            .where(
                ProjectRisk.status == "open",
                ProjectRisk.category == "supply_chain",
                ProjectRisk.detail.isnot(None),
                ProjectRisk.detail != "",
            )
        )
        result = await self.session.execute(stmt)
        return int(result.scalar() or 0)

    async def count_open_high_severity_global(self) -> int:
        """Open risk items flagged high severity (subset of open_risks)."""
        stmt = (
            select(func.count())
            .select_from(ProjectRisk)
            .where(
                ProjectRisk.status == "open",
                func.lower(ProjectRisk.severity) == "high",
            )
        )
        result = await self.session.execute(stmt)
        return int(result.scalar() or 0)

    async def count_risk_projects_global(self) -> int:
        """Distinct projects with at least one open high-severity risk."""
        stmt = (
            select(func.count(func.distinct(ProjectRisk.project_id)))
            .select_from(ProjectRisk)
            .where(
                ProjectRisk.status == "open",
                func.lower(ProjectRisk.severity) == "high",
            )
        )
        result = await self.session.execute(stmt)
        return int(result.scalar() or 0)

    async def count_by_category_global(self) -> dict[str, int]:
        stmt = (
            select(ProjectRisk.category, func.count())
            .where(ProjectRisk.status == "open")
            .group_by(ProjectRisk.category)
        )
        result = await self.session.execute(stmt)
        counts: dict[str, int] = {}
        for category, count in result.all():
            key = category or "other"
            counts[key] = int(count)
        return counts
