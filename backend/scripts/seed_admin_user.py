"""Seed a default admin user for testing."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.engine import dispose_db, init_db
from app.db.models.user import User
from app.db.session import _get_session_factory
from app.services.auth_service import get_password_hash
from app.services.logging_service import get_logger

logger = get_logger("SeedUser")


async def main():
    """Create a default admin user."""
    await init_db()
    session_factory = _get_session_factory()

    try:
        async with session_factory() as session:
            # Check if user already exists
            from app.db.repositories.user_repository import UserRepository

            user_repo = UserRepository(session)
            existing = await user_repo.get_by_email("admin@constructaiq.com")

            if existing:
                logger.info(f"User already exists: {existing.email} (ID: {existing.user_id})")
                return

            # Create new user
            hashed_password = get_password_hash("admin123")
            user = User(
                email="admin@constructaiq.com",
                hashed_password=hashed_password,
                full_name="Admin User",
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

            logger.info(f"✓ User created successfully!")
            logger.info(f"  Email: {user.email}")
            logger.info(f"  Password: admin123")
            logger.info(f"  User ID: {user.user_id}")

    except Exception as e:
        logger.error(f"Failed to create user: {e}")
        raise
    finally:
        await dispose_db()


if __name__ == "__main__":
    asyncio.run(main())
