from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.config.settings import settings
from app.services.logging_service import get_logger

logger = get_logger("DatabaseEngine")

_engine: Optional[AsyncEngine] = None


def get_engine() -> Optional[AsyncEngine]:
    return _engine


def is_db_configured() -> bool:
    return bool(settings.DATABASE_URL)


async def init_db() -> None:
    """Create the async engine and verify connectivity when DATABASE_URL is set."""
    global _engine

    if not settings.DATABASE_URL:
        logger.info("DATABASE_URL not set — database layer disabled.")
        return

    _engine = create_async_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        echo=settings.DB_ECHO,
    )

    try:
        async with _engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Azure SQL connection verified successfully.")
    except Exception as exc:
        await dispose_db()
        raise RuntimeError(
            "Failed to connect to Azure SQL. Verify DATABASE_URL, ODBC Driver 18, "
            "and Azure SQL firewall rules."
        ) from exc


async def dispose_db() -> None:
    """Dispose the engine and release pooled connections."""
    global _engine

    if _engine is not None:
        await _engine.dispose()
        _engine = None
        from app.db.session import reset_session_factory

        reset_session_factory()
        logger.info("Database engine disposed.")
