"""Database dialect helpers for MySQL and legacy SQL Server scripts."""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def is_mysql(url: str) -> bool:
    return url.startswith("mysql")


def is_mssql(url: str) -> bool:
    return url.startswith("mssql")


async def reset_table_identities(
    session: AsyncSession,
    tables: list[str],
    url: str,
    *,
    reseed_to: int = 0,
) -> None:
    """Reset auto-increment / identity counters after truncate or delete."""
    if is_mysql(url):
        for table in tables:
            next_val = reseed_to + 1 if reseed_to == 0 else reseed_to
            await session.execute(
                text(f"ALTER TABLE `{table}` AUTO_INCREMENT = {next_val}")
            )
    elif is_mssql(url):
        for table in tables:
            await session.execute(
                text(f"DBCC CHECKIDENT ('{table}', RESEED, {reseed_to})")
            )
    else:
        raise ValueError(f"Unsupported database URL for identity reset: {url!r}")


async def set_foreign_key_checks(session: AsyncSession, url: str, *, enabled: bool) -> None:
    if is_mysql(url):
        value = 1 if enabled else 0
        await session.execute(text(f"SET FOREIGN_KEY_CHECKS = {value}"))


def top_n_clause(url: str, n: int) -> str:
    if is_mysql(url):
        return f"LIMIT {n}"
    if is_mssql(url):
        return f"TOP {n}"
    raise ValueError(f"Unsupported database URL for TOP/LIMIT: {url!r}")


def select_limited(
    url: str,
    columns: str,
    table: str,
    *,
    order_by: str,
    n: int = 5,
) -> str:
    if is_mysql(url):
        return f"SELECT {columns} FROM {table} ORDER BY {order_by} LIMIT {n}"
    if is_mssql(url):
        return f"SELECT TOP {n} {columns} FROM {table} ORDER BY {order_by}"
    raise ValueError(f"Unsupported database URL for limited select: {url!r}")
