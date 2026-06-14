"""Delete all project-scoped rows; preserve supplier/crew master catalogs."""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Children first, parent last (SQL Server FK constraints).
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

# Tables with IDENTITY columns — reseed after wipe for predictable demo IDs.
IDENTITY_TABLES_RESEED: tuple[str, ...] = (
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

    if reseed_identity:
        for table in IDENTITY_TABLES_RESEED:
            await session.execute(text(f"DBCC CHECKIDENT ('{table}', RESEED, 0)"))

    await session.flush()
    return counts
