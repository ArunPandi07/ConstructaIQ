"""Delete all project-scoped rows; preserve supplier/crew master catalogs."""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.db.dialect import reset_table_identities

# Children first, parent last (FK constraints).
PROJECT_TABLES_DELETE_ORDER: tuple[str, ...] = (
    "project_risks",
    "budgets",
    "inspections",
    "crew_plans",
    "project_suppliers",
    "schedules",
    "permits",
    "agent_executions",
    "documents",
    "projects",
)

# Tables with auto-increment PKs — reseed after wipe for predictable demo IDs.
IDENTITY_TABLES_RESEED: tuple[str, ...] = PROJECT_TABLES_DELETE_ORDER


async def truncate_project_data(
    session: AsyncSession,
    *,
    reseed_identity: bool = True,
) -> dict[str, int]:
    """Delete all rows from project-scoped tables. Returns per-table delete counts."""
    counts: dict[str, int] = {}
    for table in PROJECT_TABLES_DELETE_ORDER:
        result = await session.execute(text(f"DELETE FROM {table}"))
        counts[table] = result.rowcount or 0

    if reseed_identity and settings.DATABASE_URL:
        await reset_table_identities(
            session, list(IDENTITY_TABLES_RESEED), settings.DATABASE_URL
        )

    await session.flush()
    return counts
