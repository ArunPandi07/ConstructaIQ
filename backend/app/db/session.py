from collections.abc import AsyncGenerator
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.engine import get_engine, is_db_configured

_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def _get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory

    engine = get_engine()
    if engine is None:
        raise RuntimeError("Database is not configured. Set DATABASE_URL in .env.")

    if _session_factory is None:
        _session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

    return _session_factory


def reset_session_factory() -> None:
    """Clear cached session factory (used after engine disposal)."""
    global _session_factory
    _session_factory = None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async database session."""
    factory = _get_session_factory()
    async with factory() as session:
        yield session


async def get_db_optional() -> AsyncGenerator[AsyncSession | None, None]:
    """Yield a DB session when configured, otherwise None."""
    if not is_db_configured():
        yield None
        return

    factory = _get_session_factory()
    async with factory() as session:
        yield session


async def get_db_required() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that requires a configured database."""
    if not is_db_configured():
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DATABASE_URL is not configured.",
        )

    factory = _get_session_factory()
    async with factory() as session:
        yield session
