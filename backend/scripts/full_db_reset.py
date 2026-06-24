"""Truncate ALL tables (project-scoped + master catalogs) and reseed auto-increment counters."""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.db.dialect import reset_table_identities

# FK-safe deletion order: children before parents, master catalogs last.
ALL_TABLES_DELETE_ORDER: tuple[str, ...] = (
    "report_deliveries",
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
    "supplier_materials",
    "supplier_master",
    "crew_master",
    "users",
)

ALL_IDENTITY_TABLES: tuple[str, ...] = ALL_TABLES_DELETE_ORDER


async def truncate_all_tables(
    session: AsyncSession,
    *,
    reseed_identity: bool = True,
) -> dict[str, int]:
    """Delete every row from all tables. Returns per-table delete counts."""
    counts: dict[str, int] = {}
    for table in ALL_TABLES_DELETE_ORDER:
        result = await session.execute(text(f"DELETE FROM {table}"))
        counts[table] = result.rowcount or 0

    if reseed_identity and settings.DATABASE_URL:
        await reset_table_identities(session, list(ALL_IDENTITY_TABLES), settings.DATABASE_URL)

    await session.flush()
    return counts
