"""Standalone Azure SQL connectivity check."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.engine import dispose_db, init_db, is_db_configured
from app.db.health import check_db


async def main() -> int:
    if not is_db_configured():
        print("DATABASE_URL is not configured.")
        return 1

    try:
        await init_db()
        result = await check_db()
        print(result)
        return 0 if result["status"] == "healthy" else 1
    except Exception as exc:
        print(f"Database check failed: {exc}")
        return 1
    finally:
        await dispose_db()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
