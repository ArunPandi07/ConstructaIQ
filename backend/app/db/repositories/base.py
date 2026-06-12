from typing import Any, Generic, TypeVar

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, session: AsyncSession, model: type[ModelT], pk_attr: str):
        self.session = session
        self.model = model
        self.pk_attr = pk_attr

    async def get_by_id(self, entity_id: int) -> ModelT | None:
        return await self.session.get(self.model, entity_id)

    async def list(self, *, skip: int = 0, limit: int = 100) -> list[ModelT]:
        stmt = (
            select(self.model)
            .order_by(getattr(self.model, self.pk_attr))
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, data: BaseModel | dict[str, Any]) -> ModelT:
        payload = data.model_dump() if isinstance(data, BaseModel) else data
        entity = self.model(**payload)
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def update(self, entity: ModelT, data: BaseModel | dict[str, Any]) -> ModelT:
        payload = data.model_dump(exclude_unset=True) if isinstance(data, BaseModel) else data
        for key, value in payload.items():
            setattr(entity, key, value)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity: ModelT) -> None:
        await self.session.delete(entity)
        await self.session.flush()
