"""Truncate ALL tables (project-scoped + master catalogs) and reseed IDENTITY counters."""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# FK-safe deletion order: children before parents, master catalogs last.
ALL_TABLES_DELETE_ORDER: tuple[str, ...] = (
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
)

# All tables use IDENTITY columns — reseed after wipe for predictable demo IDs.
ALL_IDENTITY_TABLES: tuple[str, ...] = ALL_TABLES_DELETE_ORDER


async def truncate_all_tables(
    session: AsyncSession,
    *,
    reseed_identity: bool = True,
) -> dict[str, int]:
    """Delete every row from all 13 tables. Returns per-table delete counts."""
    counts: dict[str, int] = {}
    for table in ALL_TABLES_DELETE_ORDER:
        result = await session.execute(text(f"DELETE FROM {table}"))
        counts[table] = result.rowcount or 0

    if reseed_identity:
        for table in ALL_IDENTITY_TABLES:
            await session.execute(text(f"DBCC CHECKIDENT ('{table}', RESEED, 0)"))

    await session.flush()
    return counts
