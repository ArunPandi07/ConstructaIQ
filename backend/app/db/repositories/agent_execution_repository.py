from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import defer

from app.db.models.agent_execution import AgentExecution
from app.db.repositories.base import BaseRepository

# Dashboard/list queries only need metadata — not multi‑MB output_json payloads.
_EXECUTION_LIST_DEFERS = (
    defer(AgentExecution.output_json),
)


class AgentExecutionRepository(BaseRepository[AgentExecution]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, AgentExecution, "execution_id")

    async def list_by_project(
        self, project_id: int, *, skip: int = 0, limit: int = 100
    ) -> list[AgentExecution]:
        stmt = (
            select(AgentExecution)
            .options(*_EXECUTION_LIST_DEFERS)
            .where(AgentExecution.project_id == project_id)
            .order_by(AgentExecution.execution_id.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_project_full(
        self, project_id: int, *, skip: int = 0, limit: int = 100
    ) -> list[AgentExecution]:
        """Load executions WITH output_json (for summary/intelligence mapping)."""
        stmt = (
            select(AgentExecution)
            .where(AgentExecution.project_id == project_id)
            .order_by(AgentExecution.execution_id.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_project_and_agent(
        self,
        project_id: int,
        agent_name: str,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AgentExecution]:
        stmt = (
            select(AgentExecution)
            .options(*_EXECUTION_LIST_DEFERS)
            .where(
                AgentExecution.project_id == project_id,
                AgentExecution.agent_name == agent_name,
            )
            .order_by(AgentExecution.execution_id.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_latest_by_agent(
        self, project_id: int, agent_name: str
    ) -> AgentExecution | None:
        """Return the latest execution WITH output_json loaded (no defer)."""
        stmt = (
            select(AgentExecution)
            .where(
                AgentExecution.project_id == project_id,
                AgentExecution.agent_name == agent_name,
            )
            .order_by(AgentExecution.execution_id.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_by_projects(
        self, project_ids: list[int], *, limit: int = 5000
    ) -> list[AgentExecution]:
        if not project_ids:
            return []
        stmt = (
            select(AgentExecution)
            .options(*_EXECUTION_LIST_DEFERS)
            .where(AgentExecution.project_id.in_(project_ids))
            .order_by(AgentExecution.execution_id.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_recent_global(self, *, limit: int = 20) -> list[AgentExecution]:
        stmt = (
            select(AgentExecution)
            .options(*_EXECUTION_LIST_DEFERS)
            .order_by(AgentExecution.execution_id.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
