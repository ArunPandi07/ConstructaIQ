from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.db.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, User, "user_id")

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def update_password(self, user_id: int, hashed_password: str) -> Optional[User]:
        user = await self.get_by_id(user_id)
        if not user:
            return None
        user.hashed_password = hashed_password
        await self.session.flush()
        return user
