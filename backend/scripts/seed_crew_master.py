"""Seed crew_master with construction workforce directory data."""

import asyncio
import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.engine import dispose_db, init_db, is_db_configured
from app.db.repositories.crew_master_repository import CrewMasterRepository
from app.db.session import _get_session_factory
from app.schemas.crew_master import CrewMasterCreate

CREW_MEMBERS: list[dict] = [
    {
        "employee_code": "CREW-PM-001",
        "employee_name": "Elena Vasquez",
        "skill_type": "Project Manager",
        "experience_years": 14,
        "daily_rate": Decimal("950.00"),
        "availability_status": "assigned",
        "certification": "PMP, OSHA 30",
        "location": "Chicago, IL",
        "phone": "+1-312-555-1001",
        "email": "elena.vasquez@constructaiq.example",
    },
    {
        "employee_code": "CREW-SE-001",
        "employee_name": "Robert Nakamura",
        "skill_type": "Structural Engineer",
        "experience_years": 11,
        "daily_rate": Decimal("820.00"),
        "availability_status": "assigned",
        "certification": "PE Structural, SE",
        "location": "Chicago, IL",
        "phone": "+1-312-555-1002",
        "email": "robert.nakamura@constructaiq.example",
    },
    {
        "employee_code": "CREW-SE-002",
        "employee_name": "Amara Okafor",
        "skill_type": "Structural Engineer",
        "experience_years": 8,
        "daily_rate": Decimal("760.00"),
        "availability_status": "available",
        "certification": "PE Structural",
        "location": "Evanston, IL",
        "phone": "+1-847-555-1003",
        "email": "amara.okafor@constructaiq.example",
    },
    {
        "employee_code": "CREW-GC-001",
        "employee_name": "Tom Bradley",
        "skill_type": "General Contractor",
        "experience_years": 18,
        "daily_rate": Decimal("780.00"),
        "availability_status": "assigned",
        "certification": "OSHA 30, First Aid",
        "location": "Chicago, IL",
        "phone": "+1-312-555-1004",
        "email": "tom.bradley@constructaiq.example",
    },
    {
        "employee_code": "CREW-ELEC-001",
        "employee_name": "Sofia Mendez",
        "skill_type": "Electrician",
        "experience_years": 9,
        "daily_rate": Decimal("520.00"),
        "availability_status": "assigned",
        "certification": "Master Electrician License",
        "location": "Oak Park, IL",
        "phone": "+1-708-555-1005",
        "email": "sofia.mendez@constructaiq.example",
    },
    {
        "employee_code": "CREW-ELEC-002",
        "employee_name": "Kevin Brooks",
        "skill_type": "Electrician",
        "experience_years": 6,
        "daily_rate": Decimal("465.00"),
        "availability_status": "available",
        "certification": "Journeyman Electrician",
        "location": "Naperville, IL",
        "phone": "+1-630-555-1006",
        "email": "kevin.brooks@constructaiq.example",
    },
    {
        "employee_code": "CREW-STL-001",
        "employee_name": "Derek Sullivan",
        "skill_type": "Steel Worker",
        "experience_years": 12,
        "daily_rate": Decimal("490.00"),
        "availability_status": "assigned",
        "certification": "Ironworker Journeyman, OSHA 30",
        "location": "Gary, IN",
        "phone": "+1-219-555-1007",
        "email": "derek.sullivan@constructaiq.example",
    },
    {
        "employee_code": "CREW-STL-002",
        "employee_name": "Maria Flores",
        "skill_type": "Steel Worker",
        "experience_years": 7,
        "daily_rate": Decimal("445.00"),
        "availability_status": "recruiting",
        "certification": "Ironworker Apprentice",
        "location": "Chicago, IL",
        "phone": "+1-312-555-1008",
        "email": "maria.flores@constructaiq.example",
    },
    {
        "employee_code": "CREW-CONC-001",
        "employee_name": "Patrick O'Neill",
        "skill_type": "Concrete Crew",
        "experience_years": 15,
        "daily_rate": Decimal("475.00"),
        "availability_status": "assigned",
        "certification": "ACI Flatwork Finisher",
        "location": "Chicago, IL",
        "phone": "+1-312-555-1009",
        "email": "patrick.oneill@constructaiq.example",
    },
    {
        "employee_code": "CREW-CONC-002",
        "employee_name": "Jasmine Wright",
        "skill_type": "Concrete Crew",
        "experience_years": 5,
        "daily_rate": Decimal("410.00"),
        "availability_status": "available",
        "certification": "OSHA 10",
        "location": "Joliet, IL",
        "phone": "+1-815-555-1010",
        "email": "jasmine.wright@constructaiq.example",
    },
    {
        "employee_code": "CREW-MEP-001",
        "employee_name": "Hassan Rahman",
        "skill_type": "MEP Technician",
        "experience_years": 10,
        "daily_rate": Decimal("535.00"),
        "availability_status": "assigned",
        "certification": "HVAC Journeyman, TAB Certified",
        "location": "Schaumburg, IL",
        "phone": "+1-847-555-1011",
        "email": "hassan.rahman@constructaiq.example",
    },
    {
        "employee_code": "CREW-FIN-001",
        "employee_name": "Lisa Chen",
        "skill_type": "Finishing Crew",
        "experience_years": 8,
        "daily_rate": Decimal("395.00"),
        "availability_status": "available",
        "certification": "Drywall Finisher Journeyman",
        "location": "Chicago, IL",
        "phone": "+1-312-555-1012",
        "email": "lisa.chen@constructaiq.example",
    },
]


async def main() -> int:
    if not is_db_configured():
        print("DATABASE_URL is not configured.")
        return 1

    await init_db()
    session_factory = _get_session_factory()

    created = 0
    skipped = 0

    try:
        async with session_factory() as session:
            crew_repo = CrewMasterRepository(session)

            for entry in CREW_MEMBERS:
                existing = await crew_repo.get_by_employee_code(entry["employee_code"])
                if existing:
                    skipped += 1
                    print(f"Skip crew {entry['employee_code']} (already exists)")
                    continue

                crew = await crew_repo.create(CrewMasterCreate(**entry))
                created += 1
                print(
                    f"Created crew {crew.employee_code} "
                    f"({crew.skill_type}) id={crew.crew_id}"
                )

            await session.commit()

        print(
            f"Crew seed complete: {created} created, {skipped} skipped "
            f"({created + skipped} total)."
        )
        return 0
    except Exception as exc:
        print(f"Crew seed failed: {exc}")
        return 1
    finally:
        await dispose_db()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
