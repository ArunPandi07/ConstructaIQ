"""Seed supplier_master and supplier_materials with construction catalog data."""

import asyncio
import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.engine import dispose_db, init_db, is_db_configured
from app.db.repositories.supplier_master_repository import SupplierMasterRepository
from app.db.repositories.supplier_material_repository import SupplierMaterialRepository
from app.db.session import _get_session_factory
from app.schemas.supplier_master import SupplierMasterCreate
from app.schemas.supplier_material import SupplierMaterialCreate

SUPPLIERS: list[dict] = [
    {
        "supplier_code": "SUP-MWS",
        "supplier_name": "MidWest Steel Corp",
        "supplier_category": "Structural Steel",
        "contact_person": "Karen Whitfield",
        "email": "karen.whitfield@midweststeel.example",
        "phone": "+1-312-555-0142",
        "location": "Gary, IN",
        "lead_time_days": 140,
        "reliability_score": Decimal("72.50"),
        "preferred_supplier": True,
        "status": "active",
        "materials": [
            {
                "material_name": "Wide Flange Beam W14x90",
                "material_category": "Structural Steel",
                "unit_price": Decimal("2850.00"),
                "currency_code": "USD",
                "moq": 10,
                "lead_time_days": 140,
            },
            {
                "material_name": "Rebar #5 Grade 60",
                "material_category": "Reinforcement",
                "unit_price": Decimal("0.82"),
                "currency_code": "USD",
                "moq": 5000,
                "lead_time_days": 21,
            },
        ],
    },
    {
        "supplier_code": "SUP-RSC",
        "supplier_name": "RegionalSteel Co",
        "supplier_category": "Structural Steel",
        "contact_person": "Marcus Chen",
        "email": "marcus.chen@regionalsteel.example",
        "phone": "+1-414-555-0198",
        "location": "Milwaukee, WI",
        "lead_time_days": 56,
        "reliability_score": Decimal("88.00"),
        "preferred_supplier": False,
        "status": "active",
        "materials": [
            {
                "material_name": "Wide Flange Beam W14x90",
                "material_category": "Structural Steel",
                "unit_price": Decimal("2925.00"),
                "currency_code": "USD",
                "moq": 8,
                "lead_time_days": 56,
            },
            {
                "material_name": "Steel Plate 1/2 inch A36",
                "material_category": "Structural Steel",
                "unit_price": Decimal("1.15"),
                "currency_code": "USD",
                "moq": 2000,
                "lead_time_days": 42,
            },
        ],
    },
    {
        "supplier_code": "SUP-CCS",
        "supplier_name": "Chicago Concrete Supply",
        "supplier_category": "Concrete",
        "contact_person": "Diana Ortiz",
        "email": "diana.ortiz@chicagoconcrete.example",
        "phone": "+1-312-555-0267",
        "location": "Chicago, IL",
        "lead_time_days": 3,
        "reliability_score": Decimal("94.25"),
        "preferred_supplier": True,
        "status": "active",
        "materials": [
            {
                "material_name": "Ready-Mix Concrete 5000 PSI",
                "material_category": "Concrete",
                "unit_price": Decimal("142.00"),
                "currency_code": "USD",
                "moq": 10,
                "lead_time_days": 2,
            },
            {
                "material_name": "Post-Tensioning Strand",
                "material_category": "Concrete Accessories",
                "unit_price": Decimal("0.48"),
                "currency_code": "USD",
                "moq": 1000,
                "lead_time_days": 14,
            },
        ],
    },
    {
        "supplier_code": "SUP-MED",
        "supplier_name": "Midwest Electrical Distributors",
        "supplier_category": "Electrical",
        "contact_person": "James Holloway",
        "email": "james.holloway@medistrib.example",
        "phone": "+1-630-555-0331",
        "location": "Naperville, IL",
        "lead_time_days": 10,
        "reliability_score": Decimal("91.00"),
        "preferred_supplier": True,
        "status": "active",
        "materials": [
            {
                "material_name": "Copper THHN 12 AWG",
                "material_category": "Electrical Wire",
                "unit_price": Decimal("0.34"),
                "currency_code": "USD",
                "moq": 2500,
                "lead_time_days": 7,
            },
            {
                "material_name": "Switchgear Panel 480V",
                "material_category": "Electrical Equipment",
                "unit_price": Decimal("18500.00"),
                "currency_code": "USD",
                "moq": 1,
                "lead_time_days": 45,
            },
        ],
    },
]


async def main() -> int:
    if not is_db_configured():
        print("DATABASE_URL is not configured.")
        return 1

    await init_db()
    session_factory = _get_session_factory()

    created_suppliers = 0
    skipped_suppliers = 0
    created_materials = 0

    try:
        async with session_factory() as session:
            supplier_repo = SupplierMasterRepository(session)
            material_repo = SupplierMaterialRepository(session)

            for entry in SUPPLIERS:
                materials = entry["materials"]
                supplier_fields = {
                    key: value for key, value in entry.items() if key != "materials"
                }
                existing = await supplier_repo.get_by_code(supplier_fields["supplier_code"])

                if existing:
                    supplier = existing
                    skipped_suppliers += 1
                    print(f"Skip supplier {supplier_fields['supplier_code']} (already exists)")
                else:
                    supplier = await supplier_repo.create(
                        SupplierMasterCreate(**supplier_fields)
                    )
                    created_suppliers += 1
                    print(f"Created supplier {supplier.supplier_code} id={supplier.supplier_id}")

                existing_materials = await material_repo.list_by_supplier(supplier.supplier_id)
                existing_names = {m.material_name for m in existing_materials}

                for material in materials:
                    if material["material_name"] in existing_names:
                        continue
                    await material_repo.create(
                        SupplierMaterialCreate(
                            supplier_id=supplier.supplier_id,
                            **material,
                        )
                    )
                    created_materials += 1
                    print(
                        f"  + material {material['material_name']} "
                        f"for {supplier.supplier_code}"
                    )

            await session.commit()

        total_suppliers = created_suppliers + skipped_suppliers
        print(
            f"Supplier seed complete: {created_suppliers} created, "
            f"{skipped_suppliers} skipped, {created_materials} materials added "
            f"({total_suppliers} suppliers total)."
        )
        return 0
    except Exception as exc:
        print(f"Supplier seed failed: {exc}")
        return 1
    finally:
        await dispose_db()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
