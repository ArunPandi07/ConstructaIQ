import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text

from app.db.engine import dispose_db, get_engine, init_db


async def main() -> int:
    await init_db()
    engine = get_engine()
    if engine is None:
        print("DATABASE_URL not configured.")
        return 1

    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
                "WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo' "
                "ORDER BY TABLE_NAME"
            )
        )
        tables = [row[0] for row in result.fetchall()]
        print(f"Tables in dbo: {len(tables)}")
        for name in tables:
            print(f"  - {name}")

    await dispose_db()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
