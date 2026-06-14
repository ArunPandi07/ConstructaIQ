"""Seed crew_master with an expanded construction workforce directory (28 members)."""

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
    # ── Project Manager (3) ──────────────────────────────────────────────────
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
        "employee_code": "CREW-PM-002",
        "employee_name": "Nathan Holloway",
        "skill_type": "Project Manager",
        "experience_years": 10,
        "daily_rate": Decimal("880.00"),
        "availability_status": "available",
        "certification": "PMP, CCM",
        "location": "Denver, CO",
        "phone": "+1-720-555-1002",
        "email": "nathan.holloway@constructaiq.example",
    },
    {
        "employee_code": "CREW-PM-003",
        "employee_name": "Priya Sundaram",
        "skill_type": "Project Manager",
        "experience_years": 8,
        "daily_rate": Decimal("820.00"),
        "availability_status": "available",
        "certification": "PMP, LEED AP",
        "location": "Seattle, WA",
        "phone": "+1-206-555-1003",
        "email": "priya.sundaram@constructaiq.example",
    },
    # ── Structural Engineer (3) ───────────────────────────────────────────────
    {
        "employee_code": "CREW-SE-001",
        "employee_name": "Robert Nakamura",
        "skill_type": "Structural Engineer",
        "experience_years": 11,
        "daily_rate": Decimal("820.00"),
        "availability_status": "assigned",
        "certification": "PE Structural, SE",
        "location": "Chicago, IL",
        "phone": "+1-312-555-1004",
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
        "phone": "+1-847-555-1005",
        "email": "amara.okafor@constructaiq.example",
    },
    {
        "employee_code": "CREW-SE-003",
        "employee_name": "Carlos Mendes",
        "skill_type": "Structural Engineer",
        "experience_years": 16,
        "daily_rate": Decimal("980.00"),
        "availability_status": "assigned",
        "certification": "PE Structural, SE, AISC",
        "location": "San Francisco, CA",
        "phone": "+1-415-555-1006",
        "email": "carlos.mendes@constructaiq.example",
    },
    # ── General Contractor (2) ────────────────────────────────────────────────
    {
        "employee_code": "CREW-GC-001",
        "employee_name": "Tom Bradley",
        "skill_type": "General Contractor",
        "experience_years": 18,
        "daily_rate": Decimal("780.00"),
        "availability_status": "assigned",
        "certification": "OSHA 30, First Aid, CGC",
        "location": "Chicago, IL",
        "phone": "+1-312-555-1007",
        "email": "tom.bradley@constructaiq.example",
    },
    {
        "employee_code": "CREW-GC-002",
        "employee_name": "Monica Pearce",
        "skill_type": "General Contractor",
        "experience_years": 12,
        "daily_rate": Decimal("710.00"),
        "availability_status": "available",
        "certification": "OSHA 30, CGC, Lean Construction",
        "location": "Phoenix, AZ",
        "phone": "+1-602-555-1008",
        "email": "monica.pearce@constructaiq.example",
    },
    # ── Electrician (4) ───────────────────────────────────────────────────────
    {
        "employee_code": "CREW-ELEC-001",
        "employee_name": "Sofia Mendez",
        "skill_type": "Electrician",
        "experience_years": 9,
        "daily_rate": Decimal("520.00"),
        "availability_status": "assigned",
        "certification": "Master Electrician License, IBEW",
        "location": "Oak Park, IL",
        "phone": "+1-708-555-1009",
        "email": "sofia.mendez@constructaiq.example",
    },
    {
        "employee_code": "CREW-ELEC-002",
        "employee_name": "Kevin Brooks",
        "skill_type": "Electrician",
        "experience_years": 6,
        "daily_rate": Decimal("465.00"),
        "availability_status": "available",
        "certification": "Journeyman Electrician, IBEW Local 26",
        "location": "Naperville, IL",
        "phone": "+1-630-555-1010",
        "email": "kevin.brooks@constructaiq.example",
    },
    {
        "employee_code": "CREW-ELEC-003",
        "employee_name": "Tyrone Jackson",
        "skill_type": "Electrician",
        "experience_years": 14,
        "daily_rate": Decimal("610.00"),
        "availability_status": "assigned",
        "certification": "Master Electrician, High Voltage (15kV), IBEW Local 3",
        "location": "Brooklyn, NY",
        "phone": "+1-718-555-1011",
        "email": "tyrone.jackson@constructaiq.example",
    },
    {
        "employee_code": "CREW-ELEC-004",
        "employee_name": "Hannah Reyes",
        "skill_type": "Electrician",
        "experience_years": 5,
        "daily_rate": Decimal("435.00"),
        "availability_status": "recruiting",
        "certification": "Journeyman Electrician, OSHA 10",
        "location": "Atlanta, GA",
        "phone": "+1-404-555-1012",
        "email": "hannah.reyes@constructaiq.example",
    },
    # ── Pipefitter / Plumber (3) ──────────────────────────────────────────────
    {
        "employee_code": "CREW-PIPE-001",
        "employee_name": "Hassan Rahman",
        "skill_type": "Pipefitter",
        "experience_years": 10,
        "daily_rate": Decimal("535.00"),
        "availability_status": "assigned",
        "certification": "UA Local 638 Journeyman, HVAC, TAB Certified",
        "location": "Schaumburg, IL",
        "phone": "+1-847-555-1013",
        "email": "hassan.rahman@constructaiq.example",
    },
    {
        "employee_code": "CREW-PIPE-002",
        "employee_name": "Victor Nguyen",
        "skill_type": "Pipefitter",
        "experience_years": 13,
        "daily_rate": Decimal("575.00"),
        "availability_status": "available",
        "certification": "UA Local 602 Foreman, ASSE 6010, Orbital Welder SS316L",
        "location": "Arlington, VA",
        "phone": "+1-703-555-1014",
        "email": "victor.nguyen@constructaiq.example",
    },
    {
        "employee_code": "CREW-PIPE-003",
        "employee_name": "Grace Okonkwo",
        "skill_type": "Pipefitter",
        "experience_years": 7,
        "daily_rate": Decimal("490.00"),
        "availability_status": "available",
        "certification": "UA Local 447 Journeyman, Medical Gas ASSE 6010",
        "location": "Sacramento, CA",
        "phone": "+1-916-555-1015",
        "email": "grace.okonkwo@constructaiq.example",
    },
    # ── Ironworker (3) ────────────────────────────────────────────────────────
    {
        "employee_code": "CREW-IW-001",
        "employee_name": "Derek Sullivan",
        "skill_type": "Ironworker",
        "experience_years": 12,
        "daily_rate": Decimal("490.00"),
        "availability_status": "assigned",
        "certification": "Ironworker Local 40 Journeyman, OSHA 30, AWS D1.1 Welder",
        "location": "Gary, IN",
        "phone": "+1-219-555-1016",
        "email": "derek.sullivan@constructaiq.example",
    },
    {
        "employee_code": "CREW-IW-002",
        "employee_name": "Tony Marchetti",
        "skill_type": "Ironworker",
        "experience_years": 15,
        "daily_rate": Decimal("545.00"),
        "availability_status": "assigned",
        "certification": "Ironworker Local 40 Foreman, AWS D1.1 Certified Welder",
        "location": "Hoboken, NJ",
        "phone": "+1-201-555-1017",
        "email": "tony.marchetti@constructaiq.example",
    },
    {
        "employee_code": "CREW-IW-003",
        "employee_name": "Bill Frazier",
        "skill_type": "Ironworker",
        "experience_years": 20,
        "daily_rate": Decimal("620.00"),
        "availability_status": "available",
        "certification": "Ironworker Local 118 Superintendent, OSHPD Welder D1.1 + D1.8",
        "location": "Sacramento, CA",
        "phone": "+1-916-555-1018",
        "email": "bill.frazier@constructaiq.example",
    },
    # ── Glazier (2) ───────────────────────────────────────────────────────────
    {
        "employee_code": "CREW-GLZ-001",
        "employee_name": "Luis Ortega",
        "skill_type": "Glazier",
        "experience_years": 11,
        "daily_rate": Decimal("480.00"),
        "availability_status": "assigned",
        "certification": "Glazier Local 1087 Superintendent, HVHZ Certified Installer",
        "location": "Miami, FL",
        "phone": "+1-305-555-1019",
        "email": "luis.ortega@constructaiq.example",
    },
    {
        "employee_code": "CREW-GLZ-002",
        "employee_name": "Miguel Sandoval",
        "skill_type": "Glazier",
        "experience_years": 9,
        "daily_rate": Decimal("445.00"),
        "availability_status": "available",
        "certification": "Glazier Local 169 Foreman, OSHA 30",
        "location": "Sacramento, CA",
        "phone": "+1-916-555-1020",
        "email": "miguel.sandoval@constructaiq.example",
    },
    # ── Concrete Finisher (3) ─────────────────────────────────────────────────
    {
        "employee_code": "CREW-CF-001",
        "employee_name": "Patrick O'Neill",
        "skill_type": "Concrete Finisher",
        "experience_years": 15,
        "daily_rate": Decimal("475.00"),
        "availability_status": "assigned",
        "certification": "ACI Flatwork Finisher, PT Stressing Technician",
        "location": "Chicago, IL",
        "phone": "+1-312-555-1021",
        "email": "patrick.oneill@constructaiq.example",
    },
    {
        "employee_code": "CREW-CF-002",
        "employee_name": "Maria Flores",
        "skill_type": "Concrete Finisher",
        "experience_years": 7,
        "daily_rate": Decimal("420.00"),
        "availability_status": "available",
        "certification": "ACI Concrete Finisher, OSHA 10",
        "location": "Chicago, IL",
        "phone": "+1-312-555-1022",
        "email": "maria.flores@constructaiq.example",
    },
    {
        "employee_code": "CREW-CF-003",
        "employee_name": "Jorge Ramirez",
        "skill_type": "Concrete Finisher",
        "experience_years": 16,
        "daily_rate": Decimal("560.00"),
        "availability_status": "assigned",
        "certification": "ACI Concrete Superintendent, PT Installer (PTI Level III)",
        "location": "Miami, FL",
        "phone": "+1-305-555-1023",
        "email": "jorge.ramirez@constructaiq.example",
    },
    # ── Commissioning Agent (2) ───────────────────────────────────────────────
    {
        "employee_code": "CREW-CX-001",
        "employee_name": "Rachel Kim",
        "skill_type": "Commissioning Agent",
        "experience_years": 12,
        "daily_rate": Decimal("740.00"),
        "availability_status": "assigned",
        "certification": "ASHRAE CPMP, CxA, LEED AP BD+C",
        "location": "Washington, DC",
        "phone": "+1-202-555-1024",
        "email": "rachel.kim@constructaiq.example",
    },
    {
        "employee_code": "CREW-CX-002",
        "employee_name": "Karen Walsh",
        "skill_type": "Commissioning Agent",
        "experience_years": 9,
        "daily_rate": Decimal("680.00"),
        "availability_status": "available",
        "certification": "ASHRAE Healthcare Cx, LEED AP",
        "location": "Sacramento, CA",
        "phone": "+1-916-555-1025",
        "email": "karen.walsh@constructaiq.example",
    },
    # ── Safety Officer (3) ────────────────────────────────────────────────────
    {
        "employee_code": "CREW-SFTY-001",
        "employee_name": "James Park",
        "skill_type": "Safety Officer",
        "experience_years": 10,
        "daily_rate": Decimal("550.00"),
        "availability_status": "assigned",
        "certification": "OSHA 500, CSP, First Aid/CPR",
        "location": "Fairfax, VA",
        "phone": "+1-703-555-1026",
        "email": "james.park@constructaiq.example",
    },
    {
        "employee_code": "CREW-SFTY-002",
        "employee_name": "Bernice Okafor",
        "skill_type": "Safety Officer",
        "experience_years": 7,
        "daily_rate": Decimal("495.00"),
        "availability_status": "available",
        "certification": "OSHA 30, CHST, First Aid/CPR",
        "location": "Chicago, IL",
        "phone": "+1-312-555-1027",
        "email": "bernice.okafor@constructaiq.example",
    },
    {
        "employee_code": "CREW-SFTY-003",
        "employee_name": "Raj Patel",
        "skill_type": "Safety Officer",
        "experience_years": 14,
        "daily_rate": Decimal("620.00"),
        "availability_status": "assigned",
        "certification": "OSHA 500, CSP, Healthcare Construction Safety",
        "location": "Boston, MA",
        "phone": "+1-617-555-1028",
        "email": "raj.patel@constructaiq.example",
    },
]


async def seed_crew(session) -> None:
    crew_repo = CrewMasterRepository(session)
    for entry in CREW_MEMBERS:
        await crew_repo.create(CrewMasterCreate(**entry))
    await session.flush()


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
