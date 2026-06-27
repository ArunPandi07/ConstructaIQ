from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.chat_message import ChatMessage
from app.db.repositories.base import BaseRepository


class ChatMessageRepository(BaseRepository[ChatMessage]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, ChatMessage, "message_id")

    async def list_recent(
        self,
        user_id: int,
        project_id: int,
        session_id: str,
        *,
        limit: int = 20,
    ) -> list[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(
                ChatMessage.user_id == user_id,
                ChatMessage.project_id == project_id,
                ChatMessage.session_id == session_id,
            )
            .order_by(ChatMessage.message_id.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        rows = list(result.scalars().all())
        rows.reverse()
        return rows

    async def delete_session(
        self,
        user_id: int,
        project_id: int,
        session_id: str,
    ) -> None:
        stmt = delete(ChatMessage).where(
            ChatMessage.user_id == user_id,
            ChatMessage.project_id == project_id,
            ChatMessage.session_id == session_id,
        )
        await self.session.execute(stmt)
