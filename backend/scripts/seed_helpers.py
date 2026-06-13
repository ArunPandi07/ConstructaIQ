"""Shared utilities for database seeding scripts."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.logging_service import get_logger

logger = get_logger("SeedHelpers")


async def truncate_all_tables(session: AsyncSession) -> None:
    """Truncate all tables in FK-safe order (children before parents)."""
    logger.info("Truncating all tables...")

    # FK-safe deletion order: children before parents
    tables_in_order = [
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
    ]

    for table in tables_in_order:
        await session.execute(text(f"DELETE FROM {table}"))
        logger.info(f"  [OK] Truncated {table}")

    await session.flush()
    logger.info("All tables truncated successfully")


async def reseed_identities(session: AsyncSession, tables: list[str] | None = None) -> None:
    """Reset IDENTITY columns to 0 for predictable IDs.

    Args:
        session: Database session
        tables: List of table names to reseed. If None, reseeds all tables.
    """
    if tables is None:
        tables = [
            "projects",
            "documents",
            "agent_executions",
            "permits",
            "schedules",
            "budgets",
            "inspections",
            "crew_plans",
            "project_suppliers",
            "project_risks",
            "supplier_master",
            "supplier_materials",
            "crew_master",
        ]

    logger.info("Reseeding IDENTITY columns...")
    for table in tables:
        await session.execute(text(f"DBCC CHECKIDENT ('{table}', RESEED, 0)"))
        logger.info(f"  [OK] Reseeded {table}")

    await session.flush()
    logger.info("IDENTITY columns reseeded successfully")


def build_agent_executions(
    pipeline: dict[str, Any],
    *,
    base_time: datetime | None = None,
) -> list[dict[str, Any]]:
    """Build 6 agent execution records with sequential timestamps.

    Args:
        pipeline: Pipeline data dict with agent output keys
        base_time: Starting timestamp (defaults to now)

    Returns:
        List of execution record dicts
    """
    PIPELINE_AGENTS: tuple[tuple[str, str, str], ...] = (
        ("ContractAgent", "4", "projectSummary"),
        ("BlueprintAgent", "5", "blueprintSummary"),
        ("PermitAgent", "3", "permitAssessment"),
        ("ScheduleAgent", "2", "projectPlan"),
        ("SupplierAgent", "3", "supplierAnalysis"),
        ("CrewAgent", "2", "crewAnalysis"),
    )

    started = base_time or datetime.now(timezone.utc)
    records: list[dict[str, Any]] = []
    offset_minutes = 0

    for agent_name, version, payload_key in PIPELINE_AGENTS:
        step_start = started + timedelta(minutes=offset_minutes)
        step_end = step_start + timedelta(minutes=2)
        offset_minutes += 3
        output = pipeline.get(payload_key) or {}

        records.append(
            {
                "agent_name": agent_name,
                "agent_version": version,
                "status": "complete",
                "started_at": step_start,
                "completed_at": step_end,
                "output": output,
            }
        )

    return records


async def validate_seed_data(session: AsyncSession) -> dict[str, int]:
    """Validate and count seeded data across all tables.

    Returns:
        Dictionary with table counts
    """
    logger.info("Validating seed data...")

    tables = [
        "projects",
        "documents",
        "agent_executions",
        "permits",
        "schedules",
        "budgets",
        "inspections",
        "crew_plans",
        "project_suppliers",
        "project_risks",
        "supplier_master",
        "supplier_materials",
        "crew_master",
    ]

    counts = {}
    for table in tables:
        result = await session.execute(text(f"SELECT COUNT(*) as cnt FROM {table}"))
        count = result.scalar() or 0
        counts[table] = count
        logger.info(f"  {table}: {count}")

    return counts


async def display_sample_data(session: AsyncSession) -> None:
    """Display sample data from key tables for verification."""
    logger.info("\n" + "=" * 80)
    logger.info("SAMPLE DATA VERIFICATION")
    logger.info("=" * 80)

    # Sample project
    result = await session.execute(
        text("SELECT project_id, project_name, client_name, status FROM projects ORDER BY project_id")
    )
    projects = result.fetchall()
    logger.info("\nProjects:")
    for row in projects:
        logger.info(f"  [{row[0]}] {row[1]} | Client: {row[2]} | Status: {row[3]}")

    # Sample suppliers
    result = await session.execute(
        text("SELECT TOP 5 supplier_id, supplier_code, supplier_name, supplier_category FROM supplier_master ORDER BY supplier_id")
    )
    suppliers = result.fetchall()
    logger.info("\nSuppliers (first 5):")
    for row in suppliers:
        logger.info(f"  [{row[0]}] {row[1]} - {row[2]} ({row[3]})")

    # Sample crew
    result = await session.execute(
        text("SELECT TOP 5 crew_id, employee_code, employee_name, skill_type FROM crew_master ORDER BY crew_id")
    )
    crew = result.fetchall()
    logger.info("\nCrew Members (first 5):")
    for row in crew:
        logger.info(f"  [{row[0]}] {row[1]} - {row[2]} ({row[3]})")

    # Project relationships summary
    result = await session.execute(
        text("""
            SELECT
                p.project_id,
                p.project_name,
                COUNT(DISTINCT pm.permit_id) as permits,
                COUNT(DISTINCT s.schedule_id) as schedules,
                COUNT(DISTINCT cp.crew_plan_id) as crew_plans,
                COUNT(DISTINCT ps.supplier_record_id) as suppliers,
                COUNT(DISTINCT pr.risk_id) as risks
            FROM projects p
            LEFT JOIN permits pm ON p.project_id = pm.project_id
            LEFT JOIN schedules s ON p.project_id = s.project_id
            LEFT JOIN crew_plans cp ON p.project_id = cp.project_id
            LEFT JOIN project_suppliers ps ON p.project_id = ps.project_id
            LEFT JOIN project_risks pr ON p.project_id = pr.project_id
            GROUP BY p.project_id, p.project_name
            ORDER BY p.project_id
        """)
    )
    relationships = result.fetchall()
    logger.info("\nProject Relationships:")
    for row in relationships:
        logger.info(
            f"  [{row[0]}] {row[1]}: "
            f"{row[2]} permits, {row[3]} schedules, {row[4]} crew, {row[5]} suppliers, {row[6]} risks"
        )

    logger.info("\n" + "=" * 80)
