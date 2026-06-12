from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.engine import is_db_configured
from app.db.repositories.crew_master_repository import CrewMasterRepository
from app.db.repositories.supplier_master_repository import SupplierMasterRepository
from app.services.logging_service import get_logger

logger = get_logger("MasterCatalogService")


def _json_safe(value: Any) -> Any:
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    return value


def _serialize_supplier(supplier) -> dict[str, Any]:
    return _json_safe(
        {
            "supplier_id": supplier.supplier_id,
            "supplier_code": supplier.supplier_code,
            "supplier_name": supplier.supplier_name,
            "supplier_category": supplier.supplier_category,
            "contact_person": supplier.contact_person,
            "email": supplier.email,
            "phone": supplier.phone,
            "location": supplier.location,
            "lead_time_days": supplier.lead_time_days,
            "reliability_score": supplier.reliability_score,
            "preferred_supplier": supplier.preferred_supplier,
            "status": supplier.status,
            "materials": [
                {
                    "supplier_material_id": material.supplier_material_id,
                    "material_name": material.material_name,
                    "material_category": material.material_category,
                    "unit_price": material.unit_price,
                    "currency_code": material.currency_code,
                    "moq": material.moq,
                    "lead_time_days": material.lead_time_days,
                }
                for material in supplier.materials
            ],
        }
    )


def _serialize_crew_member(crew) -> dict[str, Any]:
    return _json_safe(
        {
            "crew_id": crew.crew_id,
            "employee_code": crew.employee_code,
            "employee_name": crew.employee_name,
            "skill_type": crew.skill_type,
            "experience_years": crew.experience_years,
            "daily_rate": crew.daily_rate,
            "availability_status": crew.availability_status,
            "certification": crew.certification,
            "location": crew.location,
            "phone": crew.phone,
            "email": crew.email,
        }
    )


async def load_supplier_catalog(session: AsyncSession) -> list[dict[str, Any]]:
    repo = SupplierMasterRepository(session)
    suppliers = await repo.list_with_materials()
    return [_serialize_supplier(supplier) for supplier in suppliers]


async def load_crew_catalog(session: AsyncSession) -> list[dict[str, Any]]:
    repo = CrewMasterRepository(session)
    crew_members = await repo.list(limit=500)
    return [_serialize_crew_member(crew) for crew in crew_members]


async def load_catalogs(
    session: AsyncSession | None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if session is None or not is_db_configured():
        logger.warning(
            "Database session unavailable — supplier and crew catalogs will be empty."
        )
        return [], []

    supplier_catalog = await load_supplier_catalog(session)
    crew_catalog = await load_crew_catalog(session)
    logger.info(
        "Loaded master catalogs: %s suppliers, %s crew members",
        len(supplier_catalog),
        len(crew_catalog),
    )
    return supplier_catalog, crew_catalog
