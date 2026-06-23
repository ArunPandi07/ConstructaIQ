import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text

from app.config.settings import settings
from app.db.dialect import is_mysql, is_mssql
from app.db.engine import dispose_db, get_engine, init_db


async def main() -> int:
    await init_db()
    engine = get_engine()
    if engine is None:
        print("DATABASE_URL not configured.")
        return 1

    db_url = settings.DATABASE_URL or ""

    async with engine.connect() as conn:
        if is_mysql(db_url):
            result = await conn.execute(
                text(
                    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' "
                    "ORDER BY TABLE_NAME"
                )
            )
            schema_label = "current database"
        elif is_mssql(db_url):
            result = await conn.execute(
                text(
                    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
                    "WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo' "
                    "ORDER BY TABLE_NAME"
                )
            )
            schema_label = "dbo"
        else:
            print(f"Unsupported DATABASE_URL dialect: {db_url.split(':', 1)[0]}")
            return 1

        tables = [row[0] for row in result.fetchall()]
        print(f"Tables in {schema_label}: {len(tables)}")
        for name in tables:
            print(f"  - {name}")

    await dispose_db()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
