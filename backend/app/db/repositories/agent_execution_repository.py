from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.agent_execution import AgentExecution
from app.db.repositories.base import BaseRepository


class AgentExecutionRepository(BaseRepository[AgentExecution]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, AgentExecution, "execution_id")

    async def list_by_project(
        self, project_id: int, *, skip: int = 0, limit: int = 100
    ) -> list[AgentExecution]:
        stmt = (
            select(AgentExecution)
            .where(AgentExecution.project_id == project_id)
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
            .where(
                AgentExecution.project_id == project_id,
                AgentExecution.agent_name == agent_name,
            )
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
