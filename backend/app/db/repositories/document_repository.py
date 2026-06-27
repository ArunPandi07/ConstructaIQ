from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.document import Document
from app.db.repositories.base import BaseRepository


class DocumentRepository(BaseRepository[Document]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Document, "document_id")

    async def list_by_project(
        self, project_id: int, *, skip: int = 0, limit: int = 100
    ) -> list[Document]:
        stmt = (
            select(Document)
            .where(Document.project_id == project_id)
            .order_by(Document.document_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, project_id: int, document_id: int) -> Document | None:
        stmt = select(Document).where(
            Document.project_id == project_id,
            Document.document_id == document_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_type(
        self, project_id: int, document_type: str
    ) -> Document | None:
        stmt = (
            select(Document)
            .where(
                Document.project_id == project_id,
                Document.document_type == document_type,
            )
            .order_by(Document.document_id.desc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
