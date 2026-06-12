import time
from typing import Any

from sqlalchemy import text

from app.db.engine import get_engine, is_db_configured


async def check_db() -> dict[str, Any]:
    """Run SELECT 1 and return health status with latency."""
    if not is_db_configured():
        return {
            "status": "unavailable",
            "message": "DATABASE_URL is not configured",
        }

    engine = get_engine()
    if engine is None:
        return {
            "status": "unavailable",
            "message": "Database engine is not initialized",
        }

    start = time.perf_counter()
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "status": "healthy",
            "latency_ms": latency_ms,
        }
    except Exception as exc:
        return {
            "status": "unavailable",
            "message": str(exc),
        }
