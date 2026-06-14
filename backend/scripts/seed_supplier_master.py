"""Seed supplier_master and supplier_materials with an expanded construction catalog."""

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
    # ------------------------------------------------------------------ 1
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
            {
                "material_name": "HSS 8x8x3/8 Square Hollow Section",
                "material_category": "Structural Steel",
                "unit_price": Decimal("3120.00"),
                "currency_code": "USD",
                "moq": 5,
                "lead_time_days": 90,
            },
            {
                "material_name": "Rebar #8 Grade 60 (Seismic)",
                "material_category": "Reinforcement",
                "unit_price": Decimal("1.05"),
                "currency_code": "USD",
                "moq": 3000,
                "lead_time_days": 28,
            },
        ],
    },
    # ------------------------------------------------------------------ 2
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
                "material_name": "Wide Flange Column W14x730 (Grade 65)",
                "material_category": "Structural Steel",
                "unit_price": Decimal("4250.00"),
                "currency_code": "USD",
                "moq": 6,
                "lead_time_days": 154,
            },
            {
                "material_name": "Steel Plate 1/2 inch A36",
                "material_category": "Structural Steel",
                "unit_price": Decimal("1.15"),
                "currency_code": "USD",
                "moq": 2000,
                "lead_time_days": 42,
            },
            {
                "material_name": "Composite Metal Deck 3-inch (20 gauge)",
                "material_category": "Structural Steel",
                "unit_price": Decimal("0.78"),
                "currency_code": "USD",
                "moq": 10000,
                "lead_time_days": 35,
            },
        ],
    },
    # ------------------------------------------------------------------ 3
    {
        "supplier_code": "SUP-CEX",
        "supplier_name": "CEMEX Southeast",
        "supplier_category": "Ready-Mix Concrete",
        "contact_person": "Patricia Delgado",
        "email": "p.delgado@cemex.example",
        "phone": "+1-305-555-0233",
        "location": "Miami, FL",
        "lead_time_days": 7,
        "reliability_score": Decimal("91.00"),
        "preferred_supplier": True,
        "status": "active",
        "materials": [
            {
                "material_name": "Ready-Mix Concrete 5000 psi (standard)",
                "material_category": "Concrete",
                "unit_price": Decimal("168.00"),
                "currency_code": "USD",
                "moq": 10,
                "lead_time_days": 1,
            },
            {
                "material_name": "Ready-Mix Concrete 8000 psi (high-strength core walls)",
                "material_category": "Concrete",
                "unit_price": Decimal("225.00"),
                "currency_code": "USD",
                "moq": 10,
                "lead_time_days": 3,
            },
            {
                "material_name": "Ready-Mix Concrete 6000 psi Marine Grade (chloride-resistant)",
                "material_category": "Concrete",
                "unit_price": Decimal("178.00"),
                "currency_code": "USD",
                "moq": 10,
                "lead_time_days": 2,
            },
            {
                "material_name": "Shotcrete 5000 psi (pumpable)",
                "material_category": "Concrete",
                "unit_price": Decimal("195.00"),
                "currency_code": "USD",
                "moq": 5,
                "lead_time_days": 2,
            },
        ],
    },
    # ------------------------------------------------------------------ 4
    {
        "supplier_code": "SUP-FRR",
        "supplier_name": "Ferrara Bros. Building Materials",
        "supplier_category": "Ready-Mix Concrete",
        "contact_person": "Anthony Ferrara",
        "email": "anthony@ferrarabros.example",
        "phone": "+1-718-555-0381",
        "location": "Queens, NY",
        "lead_time_days": 5,
        "reliability_score": Decimal("85.50"),
        "preferred_supplier": True,
        "status": "active",
        "materials": [
            {
                "material_name": "High-Strength Concrete 8000 psi (NYC core wall mix)",
                "material_category": "Concrete",
                "unit_price": Decimal("195.00"),
                "currency_code": "USD",
                "moq": 10,
                "lead_time_days": 2,
            },
            {
                "material_name": "Flowable Fill / CLSM (controlled low-strength material)",
                "material_category": "Concrete",
                "unit_price": Decimal("95.00"),
                "currency_code": "USD",
                "moq": 5,
                "lead_time_days": 1,
            },
            {
                "material_name": "Lightweight Concrete 4000 psi (composite deck topping)",
                "material_category": "Concrete",
                "unit_price": Decimal("182.00"),
                "currency_code": "USD",
                "moq": 10,
                "lead_time_days": 3,
            },
        ],
    },
    # ------------------------------------------------------------------ 5
    {
        "supplier_code": "SUP-PSL",
        "supplier_name": "Permasteelisa North America",
        "supplier_category": "Curtain Wall Systems",
        "contact_person": "David Heikkinen",
        "email": "d.heikkinen@permasteelisa.example",
        "phone": "+1-860-555-0117",
        "location": "Windsor, CT",
        "lead_time_days": 252,
        "reliability_score": Decimal("79.00"),
        "preferred_supplier": True,
        "status": "active",
        "materials": [
            {
                "material_name": "Unitized Curtain Wall Panel (triple-glazed IGU, 4.5 ft x 13 ft)",
                "material_category": "Glazing & Facade",
                "unit_price": Decimal("1850.00"),
                "currency_code": "USD",
                "moq": 100,
                "lead_time_days": 252,
            },
            {
                "material_name": "Curtain Wall Storefront System (Thermally Broken, 2-in frame)",
                "material_category": "Glazing & Facade",
                "unit_price": Decimal("480.00"),
                "currency_code": "USD",
                "moq": 50,
                "lead_time_days": 168,
            },
            {
                "material_name": "Spandrel Panel (back-painted, insulated, 5 ft x 5 ft)",
                "material_category": "Glazing & Facade",
                "unit_price": Decimal("320.00"),
                "currency_code": "USD",
                "moq": 200,
                "lead_time_days": 210,
            },
        ],
    },
    # ------------------------------------------------------------------ 6
    {
        "supplier_code": "SUP-YKK",
        "supplier_name": "YKK AP America Inc.",
        "supplier_category": "Glazing & Facade",
        "contact_person": "Hiroshi Tanaka",
        "email": "h.tanaka@ykkap.example",
        "phone": "+1-706-555-0284",
        "location": "Dublin, GA",
        "lead_time_days": 182,
        "reliability_score": Decimal("93.00"),
        "preferred_supplier": True,
        "status": "active",
        "materials": [
            {
                "material_name": "Impact-Rated IGU (Miami-Dade NOA, PGT WinGuard, 4 ft x 7 ft)",
                "material_category": "Glazing & Facade",
                "unit_price": Decimal("2400.00"),
                "currency_code": "USD",
                "moq": 50,
                "lead_time_days": 182,
            },
            {
                "material_name": "Skylight Unit (triple-glazed, aluminum frame, 6 ft x 6 ft)",
                "material_category": "Glazing & Facade",
                "unit_price": Decimal("3800.00"),
                "currency_code": "USD",
                "moq": 10,
                "lead_time_days": 140,
            },
            {
                "material_name": "YKK 350 Thermally Broken Curtain Wall System (per SF)",
                "material_category": "Glazing & Facade",
                "unit_price": Decimal("95.00"),
                "currency_code": "USD",
                "moq": 1000,
                "lead_time_days": 168,
            },
            {
                "material_name": "Blast-Resistant Glazing Unit (GSA Level B, 4 ft x 8 ft)",
                "material_category": "Glazing & Facade",
                "unit_price": Decimal("4200.00"),
                "currency_code": "USD",
                "moq": 20,
                "lead_time_days": 196,
            },
        ],
    },
    # ------------------------------------------------------------------ 7
    {
        "supplier_code": "SUP-CAT",
        "supplier_name": "Caterpillar / Carter Machinery",
        "supplier_category": "Power Generation",
        "contact_person": "James Wheeler",
        "email": "j.wheeler@cartermachinery.example",
        "phone": "+1-804-555-0319",
        "location": "Richmond, VA",
        "lead_time_days": 280,
        "reliability_score": Decimal("87.50"),
        "preferred_supplier": True,
        "status": "active",
        "materials": [
            {
                "material_name": "CAT 3516C Diesel Generator (3 MW, 480V, EPA Tier 4F)",
                "material_category": "Power Generation",
                "unit_price": Decimal("1450000.00"),
                "currency_code": "USD",
                "moq": 1,
                "lead_time_days": 280,
            },
            {
                "material_name": "CAT 3412 Diesel Generator (1 MW, 480V, EPA Tier 4F)",
                "material_category": "Power Generation",
                "unit_price": Decimal("685000.00"),
                "currency_code": "USD",
                "moq": 1,
                "lead_time_days": 210,
            },
            {
                "material_name": "CAT Automatic Transfer Switch (4000A, 480V)",
                "material_category": "Power Generation",
                "unit_price": Decimal("48000.00"),
                "currency_code": "USD",
                "moq": 1,
                "lead_time_days": 84,
            },
        ],
    },
    # ------------------------------------------------------------------ 8
    {
        "supplier_code": "SUP-VRT",
        "supplier_name": "Vertiv / Wesco International",
        "supplier_category": "Data Center MEP",
        "contact_person": "Rachel Kim",
        "email": "r.kim@vertiv.example",
        "phone": "+1-614-555-0452",
        "location": "Columbus, OH",
        "lead_time_days": 196,
        "reliability_score": Decimal("82.00"),
        "preferred_supplier": False,
        "status": "active",
        "materials": [
            {
                "material_name": "Vertiv Liebert EXL S1 UPS (1500 kVA, Li-ion, 480V)",
                "material_category": "Data Center MEP",
                "unit_price": Decimal("625000.00"),
                "currency_code": "USD",
                "moq": 1,
                "lead_time_days": 196,
            },
            {
                "material_name": "Vertiv Liebert DSE CRAH Unit (165 kW, EC fan, glycol)",
                "material_category": "Data Center MEP",
                "unit_price": Decimal("78000.00"),
                "currency_code": "USD",
                "moq": 1,
                "lead_time_days": 168,
            },
            {
                "material_name": "Eaton VCP-W Medium Voltage Switchgear (15 kV, 1200A)",
                "material_category": "Electrical",
                "unit_price": Decimal("285000.00"),
                "currency_code": "USD",
                "moq": 1,
                "lead_time_days": 224,
            },
        ],
    },
    # ------------------------------------------------------------------ 9
    {
        "supplier_code": "SUP-EPS",
        "supplier_name": "Earthquake Protection Systems Inc.",
        "supplier_category": "Seismic Isolation",
        "contact_person": "Dr. Victor Zayas",
        "email": "v.zayas@earthquakeprotection.example",
        "phone": "+1-707-555-0188",
        "location": "Vallejo, CA",
        "lead_time_days": 168,
        "reliability_score": Decimal("96.00"),
        "preferred_supplier": True,
        "status": "active",
        "materials": [
            {
                "material_name": "Friction Pendulum Seismic Isolation Bearing (FPS-3, 24-in dia)",
                "material_category": "Seismic Isolation",
                "unit_price": Decimal("125000.00"),
                "currency_code": "USD",
                "moq": 4,
                "lead_time_days": 168,
            },
            {
                "material_name": "Buckling-Restrained Brace (CoreBrace, 500-kip capacity)",
                "material_category": "Seismic Isolation",
                "unit_price": Decimal("42000.00"),
                "currency_code": "USD",
                "moq": 2,
                "lead_time_days": 112,
            },
            {
                "material_name": "Viscous Fluid Damper (Taylor Devices, 1000-kip peak force)",
                "material_category": "Seismic Isolation",
                "unit_price": Decimal("68000.00"),
                "currency_code": "USD",
                "moq": 2,
                "lead_time_days": 140,
            },
        ],
    },
    # ------------------------------------------------------------------ 10
    {
        "supplier_code": "SUP-THK",
        "supplier_name": "ThyssenKrupp Elevator Americas",
        "supplier_category": "Vertical Transport",
        "contact_person": "Sandra Kowalski",
        "email": "s.kowalski@tk-elevator.example",
        "phone": "+1-404-555-0276",
        "location": "Atlanta, GA",
        "lead_time_days": 336,
        "reliability_score": Decimal("89.00"),
        "preferred_supplier": True,
        "status": "active",
        "materials": [
            {
                "material_name": "Gearless MRL Traction Elevator (4000 lb, 700 ft/min)",
                "material_category": "Vertical Transport",
                "unit_price": Decimal("385000.00"),
                "currency_code": "USD",
                "moq": 1,
                "lead_time_days": 336,
            },
            {
                "material_name": "High-Speed Elevator (8000 lb, 1800 ft/min, supertall)",
                "material_category": "Vertical Transport",
                "unit_price": Decimal("980000.00"),
                "currency_code": "USD",
                "moq": 1,
                "lead_time_days": 420,
            },
            {
                "material_name": "Escalator (32-inch tread, 115 ft, indoor)",
                "material_category": "Vertical Transport",
                "unit_price": Decimal("145000.00"),
                "currency_code": "USD",
                "moq": 1,
                "lead_time_days": 210,
            },
        ],
    },
]


async def seed_suppliers(session) -> None:
    supplier_repo = SupplierMasterRepository(session)
    material_repo = SupplierMaterialRepository(session)

    for s in SUPPLIERS:
        materials = s.get("materials", [])
        supplier_fields = {k: v for k, v in s.items() if k != "materials"}
        supplier = await supplier_repo.create(SupplierMasterCreate(**supplier_fields))
        await session.flush()
        for m in materials:
            await material_repo.create(
                SupplierMaterialCreate(supplier_id=supplier.supplier_id, **m)
            )
    await session.flush()


async def main() -> None:
    if not is_db_configured():
        print("Database not configured. Set AZURE_SQL_* environment variables.", flush=True)
        return

    await init_db()
    session_factory = _get_session_factory()

    supplier_count = len(SUPPLIERS)
    material_count = sum(len(s.get("materials", [])) for s in SUPPLIERS)

    async with session_factory() as session:
        await seed_suppliers(session)
        await session.commit()

    print(
        f"Seeded {supplier_count} suppliers and {material_count} materials.",
        flush=True,
    )
    await dispose_db()


if __name__ == "__main__":
    asyncio.run(main())
