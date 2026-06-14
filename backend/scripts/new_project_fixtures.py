"""Comprehensive fixtures for 5 diverse construction projects.

Each fixture contains realistic, detailed project data across all aspects:
permits, schedules, budgets, procurement, crew allocation, risks, and agent executions.
"""

from __future__ import annotations

from typing import Any

# Import helper to attach building definitions
from app.services.building_templates import generate_building_definition


def _attach_building_definition(pipeline: dict[str, Any]) -> dict[str, Any]:
    """Attach building definition using template engine."""
    blueprint = pipeline.get("blueprintSummary")
    project = pipeline.get("projectSummary")
    if isinstance(blueprint, dict):
        blueprint["building_definition"] = generate_building_definition(
            blueprint,
            project if isinstance(project, dict) else {},
        )
    return pipeline


# ==============================================================================
# PROJECT 1: Aurora Tower - 62-Story Luxury Residential High-Rise (Seattle, WA)
# ==============================================================================

def _aurora_tower_fixture() -> dict[str, Any]:
    return _attach_building_definition({
        "projectSummary": {
            "project_name": "Aurora Tower - Luxury Residences",
            "client_name": "Emerald City Development Partners LLC",
            "location": "1801 2nd Avenue, Seattle, WA 98101",
            "project_type": "Luxury Residential High-Rise",
            "budget": 850000000,
            "duration_months": 42,
            "scope": (
                "62-story luxury residential tower (850 ft) with 420 condominium units, "
                "3-story podium with retail and amenities (spa, fitness center, concierge), "
                "5 levels of below-grade parking (650 spaces). Structural system: cast-in-place "
                "concrete core with post-tensioned flat plate floors. Curtain wall facade with "
                "floor-to-ceiling glass, private balconies on 70% of units."
            ),
            "square_footage": 1200000,
            "floor_count": 62,
            "complexity_level": "High",
            "start_date": "2026-03-01",
            "target_completion_date": "2029-09-01",
            "milestones": [
                {"name": "Notice to Proceed", "date": "2026-03-01"},
                {"name": "Excavation & Shoring Complete", "date": "2026-08-15"},
                {"name": "Foundation Slab Pour", "date": "2026-11-01"},
                {"name": "Core Topping Out (Floor 62)", "date": "2028-05-15"},
                {"name": "Curtain Wall Completion", "date": "2028-11-30"},
                {"name": "Interior Finishes Complete", "date": "2029-05-31"},
                {"name": "Temporary Certificate of Occupancy", "date": "2029-07-15"},
                {"name": "Final Certificate of Occupancy", "date": "2029-09-01"},
            ],
        },
        "blueprintSummary": {
            "construction_type": "Type I-A (Non-combustible, fully sprinklered)",
            "stories_above_grade": 62,
            "stories_below_grade": 5,
            "structural_steel_tons": 0,
            "concrete_cy": 95000,
            "curtain_wall_sf": 480000,
            "lateral_system": "Cast-in-place reinforced concrete core walls",
            "foundation_type": "Mat foundation on glacial till with micropile support",
            "mep_highlights": {
                "electrical_service_amps": 12000,
                "elevators": 8,
                "emergency_generators_kw": 2500,
                "cooling_tons": 2800,
                "fire_pump_gpm": 2000,
            },
        },
        "permitAssessment": {
            "required_permits": [
                {
                    "name": "Seattle DCI Master Use Permit (MUP)",
                    "category": "Municipal - Land Use",
                    "status": "Approved",
                    "estimated_days": 0,
                    "permit_number": "MUP-2025-018442",
                },
                {
                    "name": "Building Permit - Foundations & Excavation",
                    "category": "Municipal - SDCI",
                    "status": "Approved",
                    "estimated_days": 0,
                    "permit_number": "BP-2026-004891",
                },
                {
                    "name": "Building Permit - Superstructure",
                    "category": "Municipal - SDCI",
                    "status": "In Review",
                    "estimated_days": 21,
                },
                {
                    "name": "Mechanical Permit - HVAC Systems",
                    "category": "Municipal - SDCI",
                    "status": "Pending",
                    "estimated_days": 35,
                },
                {
                    "name": "Electrical Permit - Service & Distribution",
                    "category": "Municipal - SDCI",
                    "status": "Pending",
                    "estimated_days": 28,
                },
                {
                    "name": "Plumbing Permit - Domestic & Fire Protection",
                    "category": "Municipal - SDCI",
                    "status": "Pending",
                    "estimated_days": 28,
                },
                {
                    "name": "Crane Operating Permit (2 Tower Cranes)",
                    "category": "Municipal - SDCI Cranes",
                    "status": "Approved",
                    "estimated_days": 0,
                },
                {
                    "name": "Right-of-Way Use Permit",
                    "category": "Municipal - SDOT",
                    "status": "Approved",
                    "estimated_days": 0,
                },
                {
                    "name": "Stormwater Drainage Review",
                    "category": "Environmental - SPU",
                    "status": "Approved",
                    "estimated_days": 0,
                },
                {
                    "name": "SEPA Environmental Determination",
                    "category": "Environmental - State",
                    "status": "Approved",
                    "estimated_days": 0,
                },
                {
                    "name": "Fire Sprinkler System Plan Review",
                    "category": "Life Safety - SFD",
                    "status": "In Review",
                    "estimated_days": 18,
                },
            ],
        },
        "projectPlan": {
            "phases": [
                {
                    "phase_name": "Site Preparation & Demolition",
                    "duration_days": 45,
                    "progress_percentage": 100,
                    "materials": ["Erosion control blanket", "Silt fence", "Geotextile fabric"],
                    "inspections": ["Site safety setup", "Erosion control"],
                },
                {
                    "phase_name": "Excavation & Shoring",
                    "duration_days": 120,
                    "progress_percentage": 0,
                    "materials": ["Shotcrete", "Soldier piles", "Lagging"],
                    "inspections": ["Shoring system", "Dewatering"],
                },
                {
                    "phase_name": "Foundation Construction",
                    "duration_days": 90,
                    "progress_percentage": 0,
                    "materials": ["Ready-mix concrete 5000 PSI", "Rebar #10", "Waterproofing membrane"],
                    "inspections": ["Foundation inspection", "Concrete testing"],
                },
                {
                    "phase_name": "Core & Podium Structure",
                    "duration_days": 180,
                    "progress_percentage": 0,
                    "materials": ["Ready-mix concrete 4000 PSI", "Post-tensioning tendons", "Composite metal deck"],
                    "inspections": ["Formwork", "Rebar placement", "PT system"],
                },
                {
                    "phase_name": "Tower Floors Construction",
                    "duration_days": 420,
                    "progress_percentage": 0,
                    "materials": ["Ready-mix concrete 4000 PSI", "Post-tensioning tendons", "Embed plates"],
                    "inspections": ["Floor slab", "PT stressing", "Concrete strength"],
                },
                {
                    "phase_name": "Curtain Wall Installation",
                    "duration_days": 280,
                    "progress_percentage": 0,
                    "materials": ["Unitized curtain wall system", "Triple-glazed IGU", "Structural silicone"],
                    "inspections": ["Mock-up testing", "Water testing", "Air infiltration"],
                },
                {
                    "phase_name": "MEP Rough-In",
                    "duration_days": 300,
                    "progress_percentage": 0,
                    "materials": ["Copper piping", "EMT conduit", "Ductwork", "VAV boxes"],
                    "inspections": ["Plumbing rough-in", "Electrical rough-in", "HVAC"],
                },
                {
                    "phase_name": "Interior Finishes",
                    "duration_days": 240,
                    "progress_percentage": 0,
                    "materials": ["Gypsum board", "LVT flooring", "Acoustic ceiling tiles", "Interior paint"],
                    "inspections": ["Fire-rated assemblies", "Accessibility compliance"],
                },
                {
                    "phase_name": "Elevator Installation & Testing",
                    "duration_days": 180,
                    "progress_percentage": 0,
                    "materials": ["Elevator passenger gearless", "Elevator cab finishes"],
                    "inspections": ["Elevator hoistway", "Cab inspection", "Load testing"],
                },
                {
                    "phase_name": "Final Commissioning & Closeout",
                    "duration_days": 90,
                    "progress_percentage": 0,
                    "materials": [],
                    "inspections": ["Final building inspection", "Fire alarm testing", "Occupancy inspection"],
                },
            ],
        },
        "supplierAnalysis": {
            "procurement_plan": [
                {"material": "Ready-Mix Concrete 5000 PSI", "supplier": "Holcim Concrete Co", "quantity": 32000, "unit": "CY", "unit_price": 165, "delivery_month": "month 6"},
                {"material": "Ready-Mix Concrete 4000 PSI", "supplier": "Holcim Concrete Co", "quantity": 63000, "unit": "CY", "unit_price": 145, "delivery_month": "month 8"},
                {"material": "Post-Tensioning Tendons", "supplier": "Nucor Building Components", "quantity": 450000, "unit": "LF", "unit_price": 3.85, "delivery_month": "month 9"},
                {"material": "Rebar #10 Grade 60", "supplier": "Commercial Steel Industries", "quantity": 2800, "unit": "TON", "unit_price": 1750, "delivery_month": "month 5"},
                {"material": "Unitized Curtain Wall System", "supplier": "YKK AP Facade Systems", "quantity": 480000, "unit": "SF", "unit_price": 185, "delivery_month": "month 18"},
                {"material": "Triple-Glazed IGU Low-E", "supplier": "YKK AP Facade Systems", "quantity": 420000, "unit": "SF", "unit_price": 65, "delivery_month": "month 18"},
                {"material": "Elevator Passenger Gearless", "supplier": "Otis Elevator Company", "quantity": 8, "unit": "EA", "unit_price": 485000, "delivery_month": "month 12"},
                {"material": "Chiller Water-Cooled 1000 Ton", "supplier": "Trane Commercial HVAC", "quantity": 2, "unit": "EA", "unit_price": 485000, "delivery_month": "month 24"},
                {"material": "Generator Diesel 2000kW", "supplier": "Eaton Electrical Systems", "quantity": 2, "unit": "EA", "unit_price": 485000, "delivery_month": "month 20"},
                {"material": "Fire Pump Electric 1500 GPM", "supplier": "Grohe Plumbing Systems", "quantity": 1, "unit": "EA", "unit_price": 85000, "delivery_month": "month 16"},
                {"material": "Building Automation System", "supplier": "Honeywell Building Automation", "quantity": 1, "unit": "EA", "unit_price": 185000, "delivery_month": "month 22"},
                {"material": "Fire Alarm Panel 500-Point", "supplier": "Simplex Fire Protection", "quantity": 1, "unit": "EA", "unit_price": 28500, "delivery_month": "month 28"},
                {"material": "Gypsum Board 5/8-inch Type X", "supplier": "USG Gypsum & Finishes", "quantity": 280000, "unit": "SF", "unit_price": 12.50, "delivery_month": "month 30"},
                {"material": "LVT Luxury Vinyl Tile", "supplier": "Armstrong Flooring Co", "quantity": 450000, "unit": "SF", "unit_price": 5.50, "delivery_month": "month 32"},
                {"material": "Interior Paint Latex Eggshell", "supplier": "Sherwin-Williams Commercial Coatings", "quantity": 2800, "unit": "GAL", "unit_price": 185, "delivery_month": "month 34"},
            ],
            "supply_chain_risks": [
                {"risk": "Concrete supply disruption due to regional demand", "severity": "medium", "mitigation": "Secure 2 backup suppliers, stockpile aggregates on-site"},
                {"risk": "Curtain wall delivery delay (180-day lead time)", "severity": "high", "mitigation": "Early procurement, progress payments, expedited shipping clause"},
                {"risk": "Elevator equipment tariff impact on pricing", "severity": "medium", "mitigation": "Fixed-price contract with escalation cap"},
                {"risk": "Post-tensioning material shortage", "severity": "medium", "mitigation": "Order full quantity upfront with phased delivery"},
            ],
        },
        "crewAnalysis": {
            "crew_allocations": [
                {"phase": "Excavation & Shoring", "crew": "Excavation Crew", "headcount": 18, "skill_type": "Laborer", "start_month": 2, "end_month": 6, "cost": 450000},
                {"phase": "Foundation", "crew": "Concrete Crew", "headcount": 35, "skill_type": "Foreman - Concrete", "start_month": 6, "end_month": 9, "cost": 850000},
                {"phase": "Core Construction", "crew": "Tower Crew", "headcount": 55, "skill_type": "Foreman - Concrete", "start_month": 9, "end_month": 28, "cost": 4200000},
                {"phase": "Curtain Wall", "crew": "Glazier Crew", "headcount": 28, "skill_type": "Glazier - Curtain Wall", "start_month": 18, "end_month": 32, "cost": 2100000},
                {"phase": "MEP Rough-In", "crew": "MEP Trade Crews", "headcount": 65, "skill_type": "Mixed Trades", "start_month": 20, "end_month": 36, "cost": 5200000},
                {"phase": "Interior Finishes", "crew": "Finish Crews", "headcount": 85, "skill_type": "Carpenter - Finish", "start_month": 28, "end_month": 40, "cost": 6800000},
                {"phase": "Full Project", "crew": "Project Management", "headcount": 8, "skill_type": "Project Manager", "start_month": 1, "end_month": 42, "cost": 3600000},
                {"phase": "Full Project", "crew": "Safety & QC", "headcount": 6, "skill_type": "Safety Officer", "start_month": 1, "end_month": 42, "cost": 2200000},
            ],
            "workforce_gaps": [
                {"role": "Glaziers (Curtain Wall Specialists)", "gap_count": 12, "severity": "high", "detail": "High demand for luxury high-rise projects in Seattle - consider recruiting from Vancouver BC"},
                {"role": "Post-Tensioning Technicians", "gap_count": 6, "severity": "medium", "detail": "Specialized PT crews needed for slab construction - contact PT supplier for certified crews"},
                {"role": "High-Rise Concrete Finishers", "gap_count": 8, "severity": "medium", "detail": "Need experienced finishers for luxury unit standards"},
            ],
        },
    })


# ==============================================================================
# PROJECT 2: Thunderdome Arena - 22,000-Seat Sports/Entertainment Venue (Austin, TX)
# ==============================================================================

def _thunderdome_arena_fixture() -> dict[str, Any]:
    return _attach_building_definition({
        "projectSummary": {
            "project_name": "Thunderdome Arena",
            "client_name": "Austin Entertainment Ventures & Live Nation",
            "location": "4500 Republic Drive, Austin, TX 78744",
            "project_type": "Sports & Entertainment Arena",
            "budget": 620000000,
            "duration_months": 36,
            "scope": (
                "22,000-seat multi-purpose arena (750K GSF) with retractable roof, NBA/NHL ice rink, "
                "48 luxury suites, club seating (2,800 seats), 360° concourse with F&B venues, "
                "practice facility, underground loading docks, 4,500-space parking structure. "
                "Long-span steel trusses supporting retractable roof panels."
            ),
            "square_footage": 750000,
            "floor_count": 6,
            "complexity_level": "Critical",
            "start_date": "2026-06-01",
            "target_completion_date": "2029-06-01",
            "milestones": [
                {"name": "Notice to Proceed", "date": "2026-06-01"},
                {"name": "Site Clearing & Grading Complete", "date": "2026-09-01"},
                {"name": "Foundation & Below-Grade Complete", "date": "2027-02-01"},
                {"name": "Steel Bowl Structure Erected", "date": "2027-11-01"},
                {"name": "Roof Trusses & Retractable Panels Installed", "date": "2028-06-01"},
                {"name": "Seating & Interior Finishes Complete", "date": "2029-02-01"},
                {"name": "Systems Commissioning Complete", "date": "2029-04-15"},
                {"name": "Certificate of Occupancy", "date": "2029-06-01"},
            ],
        },
        "blueprintSummary": {
            "construction_type": "Type I-B (Non-combustible, fully sprinklered)",
            "stories_above_grade": 6,
            "stories_below_grade": 2,
            "structural_steel_tons": 18500,
            "concrete_cy": 45000,
            "curtain_wall_sf": 85000,
            "lateral_system": "Braced frame steel bowl with reinforced concrete shear walls",
            "foundation_type": "Drilled pier foundation with grade beams",
            "mep_highlights": {
                "electrical_service_amps": 28000,
                "elevators": 12,
                "emergency_generators_kw": 8000,
                "cooling_tons": 6500,
                "fire_pump_gpm": 3500,
            },
        },
        "permitAssessment": {
            "required_permits": [
                {
                    "name": "City of Austin Site Plan Approval",
                    "category": "Municipal - Land Use",
                    "status": "Approved",
                    "estimated_days": 0,
                    "permit_number": "SP-2025-007821",
                },
                {
                    "name": "Building Permit - Foundations",
                    "category": "Municipal - COA",
                    "status": "Approved",
                    "estimated_days": 0,
                },
                {
                    "name": "Building Permit - Structural Steel",
                    "category": "Municipal - COA",
                    "status": "In Review",
                    "estimated_days": 28,
                },
                {
                    "name": "Special Inspections Program Approval",
                    "category": "Municipal - COA",
                    "status": "Approved",
                    "estimated_days": 0,
                },
                {
                    "name": "Mechanical Permit - HVAC & Refrigeration",
                    "category": "Municipal - COA",
                    "status": "Pending",
                    "estimated_days": 42,
                },
                {
                    "name": "Electrical Permit - Service & Arena Systems",
                    "category": "Municipal - COA",
                    "status": "Pending",
                    "estimated_days": 35,
                },
                {
                    "name": "Plumbing Permit - Arena Plumbing Systems",
                    "category": "Municipal - COA",
                    "status": "Pending",
                    "estimated_days": 30,
                },
                {
                    "name": "Fire Sprinkler System Permit",
                    "category": "Life Safety - AFD",
                    "status": "In Review",
                    "estimated_days": 25,
                },
                {
                    "name": "Fire Alarm & Life Safety Systems Permit",
                    "category": "Life Safety - AFD",
                    "status": "Pending",
                    "estimated_days": 28,
                },
                {
                    "name": "Traffic Impact Analysis Approval",
                    "category": "Transportation - TxDOT",
                    "status": "Approved",
                    "estimated_days": 0,
                },
                {
                    "name": "Stormwater Pollution Prevention Plan",
                    "category": "Environmental - TCEQ",
                    "status": "Approved",
                    "estimated_days": 0,
                },
                {
                    "name": "FAA Obstruction Evaluation (Roof Height)",
                    "category": "Federal - FAA",
                    "status": "Approved",
                    "estimated_days": 0,
                },
            ],
        },
        "projectPlan": {
            "phases": [
                {
                    "phase_name": "Site Preparation & Earthwork",
                    "duration_days": 75,
                    "progress_percentage": 0,
                    "materials": ["Gravel base course", "Geotextile fabric", "Silt fence"],
                    "inspections": ["Site survey", "Soil compaction"],
                },
                {
                    "phase_name": "Foundation & Below-Grade",
                    "duration_days": 120,
                    "progress_percentage": 0,
                    "materials": ["Ready-mix concrete 5000 PSI", "Drilled piers", "Rebar #9"],
                    "inspections": ["Pier depth verification", "Foundation concrete"],
                },
                {
                    "phase_name": "Bowl Structure Steel Erection",
                    "duration_days": 210,
                    "progress_percentage": 0,
                    "materials": ["Wide flange beams W36x210", "HSS sections", "Structural bolts"],
                    "inspections": ["Steel fabrication", "Connection inspection", "High-strength bolts"],
                },
                {
                    "phase_name": "Roof Trusses & Retractable System",
                    "duration_days": 150,
                    "progress_percentage": 0,
                    "materials": ["Steel trusses 60-ft span", "Roof deck", "Retractable panels"],
                    "inspections": ["Truss erection", "Retractable mechanism testing"],
                },
                {
                    "phase_name": "Concourse & Elevated Levels",
                    "duration_days": 180,
                    "progress_percentage": 0,
                    "materials": ["Precast concrete hollow core slabs", "Composite metal deck"],
                    "inspections": ["Precast connections", "Deck attachment"],
                },
                {
                    "phase_name": "Building Enclosure",
                    "duration_days": 150,
                    "progress_percentage": 0,
                    "materials": ["Metal panels", "Curtain wall", "Insulated roof panels"],
                    "inspections": ["Weather barrier", "Roof waterproofing"],
                },
                {
                    "phase_name": "MEP Systems Installation",
                    "duration_days": 240,
                    "progress_percentage": 0,
                    "materials": ["Chillers 500-ton", "Air handling units", "Emergency generators", "Lighting"],
                    "inspections": ["Refrigeration system", "Emergency power", "Life safety"],
                },
                {
                    "phase_name": "Seating Bowl & Premium Spaces",
                    "duration_days": 180,
                    "progress_percentage": 0,
                    "materials": ["Arena seating", "Luxury suite finishes", "Millwork"],
                    "inspections": ["Seating load test", "Accessibility compliance"],
                },
                {
                    "phase_name": "Scoreboard & AV Systems",
                    "duration_days": 90,
                    "progress_percentage": 0,
                    "materials": ["Center-hung scoreboard", "LED ribbon boards", "Sound system"],
                    "inspections": ["Rigging inspection", "Audio testing"],
                },
                {
                    "phase_name": "Final Commissioning & Testing",
                    "duration_days": 75,
                    "progress_percentage": 0,
                    "materials": [],
                    "inspections": ["Retractable roof load test", "Emergency egress drill", "Final CO inspection"],
                },
            ],
        },
        "supplierAnalysis": {
            "procurement_plan": [
                {"material": "Wide Flange Beam W36x210", "supplier": "United Structural Steel Corp", "quantity": 850, "unit": "TON", "unit_price": 6200, "delivery_month": "month 6"},
                {"material": "Steel Trusses 60-ft Span", "supplier": "Commercial Steel Industries", "quantity": 48, "unit": "EA", "unit_price": 12500, "delivery_month": "month 10"},
                {"material": "HSS 12x12x1/2 Square", "supplier": "Nucor Building Components", "quantity": 420, "unit": "TON", "unit_price": 4100, "delivery_month": "month 7"},
                {"material": "Ready-Mix Concrete 5000 PSI", "supplier": "Holcim Concrete Co", "quantity": 45000, "unit": "CY", "unit_price": 165, "delivery_month": "month 4"},
                {"material": "Precast Hollow Core Slabs", "supplier": "CementMaster Supplies", "quantity": 180000, "unit": "SF", "unit_price": 45, "delivery_month": "month 12"},
                {"material": "Chiller Air-Cooled 500 Ton", "supplier": "Trane Commercial HVAC", "quantity": 8, "unit": "EA", "unit_price": 285000, "delivery_month": "month 18"},
                {"material": "Generator Diesel 2000kW", "supplier": "Eaton Electrical Systems", "quantity": 4, "unit": "EA", "unit_price": 485000, "delivery_month": "month 16"},
                {"material": "Switchgear Medium Voltage", "supplier": "Eaton Electrical Systems", "quantity": 2, "unit": "EA", "unit_price": 285000, "delivery_month": "month 14"},
                {"material": "Fire Pump Electric 1500 GPM", "supplier": "Grohe Plumbing Systems", "quantity": 2, "unit": "EA", "unit_price": 85000, "delivery_month": "month 15"},
                {"material": "Escalator 40-inch Width", "supplier": "Otis Elevator Company", "quantity": 16, "unit": "EA", "unit_price": 385000, "delivery_month": "month 20"},
                {"material": "Fire Alarm Panel 500-Point", "supplier": "Simplex Fire Protection", "quantity": 1, "unit": "EA", "unit_price": 28500, "delivery_month": "month 22"},
                {"material": "Arena Seating Fixed", "supplier": "Hussey Seating (custom)", "quantity": 22000, "unit": "EA", "unit_price": 485, "delivery_month": "month 24"},
                {"material": "LED Video Board Center-Hung", "supplier": "Daktronics (custom)", "quantity": 1, "unit": "EA", "unit_price": 8500000, "delivery_month": "month 28"},
            ],
            "supply_chain_risks": [
                {"risk": "Steel fabrication capacity constraints (regional demand)", "severity": "high", "mitigation": "Locked-in pricing with Nucor, split order between 2 fabricators"},
                {"risk": "Retractable roof system lead time (custom fabrication)", "severity": "critical", "mitigation": "Early award to specialty contractor, weekly progress updates"},
                {"risk": "Scoreboard delivery delay (specialized equipment)", "severity": "medium", "mitigation": "Phased delivery, payment tied to milestones"},
                {"risk": "Chiller equipment availability", "severity": "medium", "mitigation": "Reserve capacity with Trane 6 months ahead"},
            ],
        },
        "crewAnalysis": {
            "crew_allocations": [
                {"phase": "Earthwork", "crew": "Site Crew", "headcount": 24, "skill_type": "Laborer", "start_month": 1, "end_month": 3, "cost": 280000},
                {"phase": "Foundation", "crew": "Concrete Foundation Crew", "headcount": 40, "skill_type": "Foreman - Concrete", "start_month": 3, "end_month": 7, "cost": 950000},
                {"phase": "Steel Erection", "crew": "Ironworkers", "headcount": 65, "skill_type": "Foreman - Steel", "start_month": 7, "end_month": 18, "cost": 4800000},
                {"phase": "Roof System", "crew": "Specialty Steel Crew", "headcount": 35, "skill_type": "Welder - Certified", "start_month": 14, "end_month": 20, "cost": 1900000},
                {"phase": "MEP Installation", "crew": "MEP Trade Crews", "headcount": 85, "skill_type": "Mixed Trades", "start_month": 16, "end_month": 32, "cost": 7200000},
                {"phase": "Seating & Finishes", "crew": "Finish Crews", "headcount": 55, "skill_type": "Carpenter - Finish", "start_month": 24, "end_month": 34, "cost": 3500000},
                {"phase": "Full Project", "crew": "Project Management", "headcount": 10, "skill_type": "Project Manager", "start_month": 1, "end_month": 36, "cost": 4200000},
                {"phase": "Full Project", "crew": "Safety & QC", "headcount": 8, "skill_type": "Safety Officer", "start_month": 1, "end_month": 36, "cost": 2900000},
            ],
            "workforce_gaps": [
                {"role": "Certified Ironworkers (High-Rise/Long-Span)", "gap_count": 20, "severity": "high", "detail": "Large steel erection project - recruit from Dallas and Houston markets"},
                {"role": "Retractable Roof System Installers", "gap_count": 12, "severity": "critical", "detail": "Specialized crew required from roof system manufacturer - coordinate early"},
                {"role": "Arena Seating Installation Crews", "gap_count": 8, "severity": "medium", "detail": "Specialty trade - subcontractor provides trained crew"},
            ],
        },
    })


# ==============================================================================
# PROJECT 3: Innovation Hall - University STEM Research Facility (Boston, MA)
# ==============================================================================

def _innovation_hall_fixture() -> dict[str, Any]:
    return _attach_building_definition({
        "projectSummary": {
            "project_name": "Innovation Hall - STEM Research Complex",
            "client_name": "Massachusetts Institute of Technology",
            "location": "77 Massachusetts Avenue, Cambridge, MA 02139",
            "project_type": "University Research Facility",
            "budget": 280000000,
            "duration_months": 30,
            "scope": (
                "8-story research facility (320K GSF) with wet labs, dry labs, clean rooms, "
                "vivarium, imaging suite, high-bay research space, 300-seat lecture hall, "
                "collaborative spaces. Vibration-isolated floors, advanced HVAC with 100% outside air, "
                "high-purity water/gas distribution, lab casework with fume hoods."
            ),
            "square_footage": 320000,
            "floor_count": 8,
            "complexity_level": "High",
            "start_date": "2026-09-01",
            "target_completion_date": "2029-03-01",
            "milestones": [
                {"name": "Notice to Proceed", "date": "2026-09-01"},
                {"name": "Foundation Complete", "date": "2027-02-01"},
                {"name": "Structural Steel Topping Out", "date": "2027-10-01"},
                {"name": "Building Enclosure Complete", "date": "2028-03-01"},
                {"name": "MEP Rough-In Complete", "date": "2028-07-01"},
                {"name": "Lab Fit-Out & Equipment Installation", "date": "2028-12-01"},
                {"name": "Commissioning & Testing Complete", "date": "2029-02-01"},
                {"name": "Certificate of Occupancy", "date": "2029-03-01"},
            ],
        },
        "blueprintSummary": {
            "construction_type": "Type I-B (Non-combustible, fully sprinklered)",
            "stories_above_grade": 8,
            "stories_below_grade": 1,
            "structural_steel_tons": 3200,
            "concrete_cy": 18000,
            "curtain_wall_sf": 120000,
            "lateral_system": "Steel braced frame with concrete shear walls at cores",
            "foundation_type": "Mat foundation with vibration isolation pads",
            "mep_highlights": {
                "electrical_service_amps": 8000,
                "elevators": 4,
                "emergency_generators_kw": 3000,
                "cooling_tons": 2200,
                "fire_pump_gpm": 1500,
            },
        },
        "permitAssessment": {
            "required_permits": [
                {"name": "Cambridge Building Permit", "category": "Municipal - City of Cambridge", "status": "Approved", "estimated_days": 0},
                {"name": "State Fire Marshal Review", "category": "State - MA DFVS", "status": "Approved", "estimated_days": 0},
                {"name": "Plumbing Permit - Lab Systems", "category": "Municipal - Cambridge", "status": "In Review", "estimated_days": 25},
                {"name": "Mechanical Permit - Lab HVAC", "category": "Municipal - Cambridge", "status": "Pending", "estimated_days": 30},
                {"name": "Electrical Permit - Lab Power", "category": "Municipal - Cambridge", "status": "Pending", "estimated_days": 28},
                {"name": "Vivarium Animal Care Facility License", "category": "Institutional - IACUC", "status": "In Review", "estimated_days": 45},
                {"name": "Hazardous Materials Storage Permit", "category": "Environmental - DEP", "status": "Pending", "estimated_days": 35},
                {"name": "Clean Room Classification Certification", "category": "Industry - ISO 14644", "status": "Pending", "estimated_days": 60},
            ],
        },
        "projectPlan": {
            "phases": [
                {"phase_name": "Foundation & Below-Grade", "duration_days": 90, "progress_percentage": 0, "materials": ["Ready-mix concrete 5000 PSI", "Vibration isolation pads"], "inspections": ["Foundation inspection", "Vibration testing"]},
                {"phase_name": "Structural Steel Erection", "duration_days": 180, "progress_percentage": 0, "materials": ["Wide flange beams W24x131", "HSS bracing"], "inspections": ["Steel fabrication", "Welding inspection"]},
                {"phase_name": "Building Enclosure", "duration_days": 120, "progress_percentage": 0, "materials": ["Curtain wall system", "Lab-grade windows"], "inspections": ["Air barrier testing", "Water infiltration"]},
                {"phase_name": "MEP Infrastructure", "duration_days": 180, "progress_percentage": 0, "materials": ["Lab-grade HVAC", "High-purity piping", "Fume hoods"], "inspections": ["HVAC air changes", "Gas distribution"]},
                {"phase_name": "Lab Casework & Equipment", "duration_days": 150, "progress_percentage": 0, "materials": ["Lab benches", "Fume hoods", "Specialty equipment"], "inspections": ["Lab safety", "Equipment commissioning"]},
                {"phase_name": "Clean Room Construction", "duration_days": 90, "progress_percentage": 0, "materials": ["HEPA filters", "Clean room panels"], "inspections": ["Particle count testing", "ISO certification"]},
                {"phase_name": "Commissioning & Validation", "duration_days": 60, "progress_percentage": 0, "materials": [], "inspections": ["TAB testing", "Lab validation", "Final inspection"]},
            ],
        },
        "supplierAnalysis": {
            "procurement_plan": [
                {"material": "Wide Flange Beam W24x131", "supplier": "United Structural Steel Corp", "quantity": 320, "unit": "TON", "unit_price": 4250, "delivery_month": "month 4"},
                {"material": "Ready-Mix Concrete 5000 PSI", "supplier": "Holcim Concrete Co", "quantity": 18000, "unit": "CY", "unit_price": 165, "delivery_month": "month 2"},
                {"material": "Lab-Grade Air Handling Units", "supplier": "Trane Commercial HVAC", "quantity": 12, "unit": "EA", "unit_price": 52000, "delivery_month": "month 12"},
                {"material": "Fume Hoods Laboratory", "supplier": "Labconco (specialty)", "quantity": 180, "unit": "EA", "unit_price": 8500, "delivery_month": "month 20"},
                {"material": "Clean Room HEPA Filters", "supplier": "Camfil (specialty)", "quantity": 240, "unit": "EA", "unit_price": 1250, "delivery_month": "month 22"},
                {"material": "Generator Diesel 2000kW", "supplier": "Eaton Electrical Systems", "quantity": 2, "unit": "EA", "unit_price": 485000, "delivery_month": "month 16"},
                {"material": "UPS System 500kVA", "supplier": "Eaton Electrical Systems", "quantity": 4, "unit": "EA", "unit_price": 185000, "delivery_month": "month 18"},
                {"material": "Lab Casework Modular", "supplier": "Kewaunee (specialty)", "quantity": 85000, "unit": "SF", "unit_price": 185, "delivery_month": "month 19"},
            ],
            "supply_chain_risks": [
                {"risk": "Fume hood delivery delay (12-16 week lead time)", "severity": "high", "mitigation": "Early procurement, staged delivery by floor"},
                {"risk": "Clean room component availability", "severity": "medium", "mitigation": "Pre-order HEPA filters and panels"},
                {"risk": "Lab equipment installation coordination", "severity": "medium", "mitigation": "Dedicated equipment coordinator, phased installation"},
            ],
        },
        "crewAnalysis": {
            "crew_allocations": [
                {"phase": "Foundation", "crew": "Concrete Crew", "headcount": 25, "skill_type": "Foreman - Concrete", "start_month": 2, "end_month": 5, "cost": 580000},
                {"phase": "Steel Erection", "crew": "Ironworkers", "headcount": 35, "skill_type": "Foreman - Steel", "start_month": 5, "end_month": 11, "cost": 1800000},
                {"phase": "MEP Installation", "crew": "MEP Crews", "headcount": 55, "skill_type": "Mixed Trades", "start_month": 10, "end_month": 24, "cost": 4200000},
                {"phase": "Lab Fit-Out", "crew": "Lab Specialists", "headcount": 40, "skill_type": "Specialty Contractor", "start_month": 19, "end_month": 28, "cost": 3600000},
                {"phase": "Full Project", "crew": "Project Management", "headcount": 6, "skill_type": "Project Manager", "start_month": 1, "end_month": 30, "cost": 2400000},
            ],
            "workforce_gaps": [
                {"role": "Lab Casework Installers", "gap_count": 12, "severity": "medium", "detail": "Specialized trade - casework supplier provides certified installers"},
                {"role": "Clean Room Technicians", "gap_count": 8, "severity": "high", "detail": "Specialty clean room contractors required - limited local availability"},
            ],
        },
    })


# ==============================================================================
# PROJECT 4: Mercy Regional Medical Center - Full-Service Hospital (Phoenix, AZ)
# ==============================================================================

def _mercy_medical_center_fixture() -> dict[str, Any]:
    return _attach_building_definition({
        "projectSummary": {
            "project_name": "Mercy Regional Medical Center",
            "client_name": "Dignity Health Arizona",
            "location": "2450 E Desert Inn Road, Phoenix, AZ 85032",
            "project_type": "Acute Care Hospital",
            "budget": 1100000000,
            "duration_months": 48,
            "scope": (
                "650K GSF full-service hospital: 250 beds, 12 operating rooms, 48-bed ICU, "
                "emergency department (40 bays), imaging center (MRI, CT, cath lab), central sterile "
                "processing, pharmacy, cafeteria, helipad. Seismic design, redundant MEP systems, "
                "medical gas distribution, infection control barriers, HIPAA-compliant design."
            ),
            "square_footage": 650000,
            "floor_count": 7,
            "complexity_level": "Critical",
            "start_date": "2026-01-01",
            "target_completion_date": "2030-01-01",
            "milestones": [
                {"name": "Notice to Proceed", "date": "2026-01-01"},
                {"name": "Foundation Complete", "date": "2026-07-01"},
                {"name": "Structural Frame Complete", "date": "2027-06-01"},
                {"name": "MEP Rough-In Complete", "date": "2028-03-01"},
                {"name": "Sterile Environment Areas Complete", "date": "2029-01-01"},
                {"name": "Equipment Installation Complete", "date": "2029-08-01"},
                {"name": "Commissioning & Testing Complete", "date": "2029-11-01"},
                {"name": "Certificate of Occupancy", "date": "2030-01-01"},
            ],
        },
        "blueprintSummary": {
            "construction_type": "Type I-A (Non-combustible, fully sprinklered)",
            "stories_above_grade": 7,
            "stories_below_grade": 2,
            "structural_steel_tons": 8500,
            "concrete_cy": 52000,
            "curtain_wall_sf": 180000,
            "lateral_system": "Steel braced frame with concrete shear walls, seismic design SDC D",
            "foundation_type": "Mat foundation with isolated footings",
            "mep_highlights": {
                "electrical_service_amps": 18000,
                "elevators": 10,
                "emergency_generators_kw": 6000,
                "cooling_tons": 4500,
                "fire_pump_gpm": 2500,
            },
        },
        "permitAssessment": {
            "required_permits": [
                {"name": "Phoenix Building Permit - Healthcare Facility", "category": "Municipal - City of Phoenix", "status": "Approved", "estimated_days": 0},
                {"name": "Arizona DHS Healthcare Facility License", "category": "State - AZDHS", "status": "In Review", "estimated_days": 60},
                {"name": "Medical Gas System Permit", "category": "State - AZDHS", "status": "Pending", "estimated_days": 45},
                {"name": "Radiation Shielding Approval (Imaging)", "category": "State - ADEQ", "status": "Pending", "estimated_days": 50},
                {"name": "Emergency Department License", "category": "State - AZDHS", "status": "Pending", "estimated_days": 40},
                {"name": "Pharmacy Controlled Substance Vault", "category": "Federal - DEA", "status": "Pending", "estimated_days": 55},
                {"name": "Helipad FAA Approval", "category": "Federal - FAA", "status": "Approved", "estimated_days": 0},
                {"name": "Fire Sprinkler & Alarm System", "category": "Life Safety - Phoenix FD", "status": "In Review", "estimated_days": 30},
                {"name": "Infection Control Risk Assessment (ICRA)", "category": "Healthcare - CMS", "status": "Pending", "estimated_days": 35},
            ],
        },
        "projectPlan": {
            "phases": [
                {"phase_name": "Site Work & Foundation", "duration_days": 120, "progress_percentage": 0, "materials": ["Ready-mix concrete 5000 PSI", "Rebar #9"], "inspections": ["Soil bearing", "Foundation concrete"]},
                {"phase_name": "Structural Frame", "duration_days": 300, "progress_percentage": 0, "materials": ["Wide flange beams", "Seismic bracing"], "inspections": ["Seismic connections", "Steel inspection"]},
                {"phase_name": "Building Enclosure", "duration_days": 180, "progress_percentage": 0, "materials": ["Curtain wall", "Waterproofing"], "inspections": ["Air barrier", "Water testing"]},
                {"phase_name": "MEP Infrastructure", "duration_days": 360, "progress_percentage": 0, "materials": ["Medical gas piping", "HVAC units", "Generators"], "inspections": ["Medical gas testing", "Emergency power"]},
                {"phase_name": "Operating Rooms & Sterile Areas", "duration_days": 240, "progress_percentage": 0, "materials": ["Surgical lights", "HEPA filters", "OR doors"], "inspections": ["HEPA testing", "Positive pressure"]},
                {"phase_name": "Medical Equipment Installation", "duration_days": 180, "progress_percentage": 0, "materials": ["MRI", "CT scanner", "Patient beds"], "inspections": ["Equipment testing", "Radiation shielding"]},
                {"phase_name": "Infection Control & Final Finishes", "duration_days": 150, "progress_percentage": 0, "materials": ["Antimicrobial surfaces", "Healthcare flooring"], "inspections": ["ICRA compliance", "Environmental rounds"]},
                {"phase_name": "Commissioning & CMS Certification", "duration_days": 90, "progress_percentage": 0, "materials": [], "inspections": ["CMS survey", "State license", "Final CO"]},
            ],
        },
        "supplierAnalysis": {
            "procurement_plan": [
                {"material": "Wide Flange Beams (Various)", "supplier": "United Structural Steel Corp", "quantity": 850, "unit": "TON", "unit_price": 4500, "delivery_month": "month 6"},
                {"material": "Ready-Mix Concrete 5000 PSI", "supplier": "Holcim Concrete Co", "quantity": 52000, "unit": "CY", "unit_price": 165, "delivery_month": "month 3"},
                {"material": "Medical Gas Piping System", "supplier": "BeaconMedaes (specialty)", "quantity": 1, "unit": "LOT", "unit_price": 2500000, "delivery_month": "month 18"},
                {"material": "Operating Room HVAC Units", "supplier": "Trane Commercial HVAC", "quantity": 12, "unit": "EA", "unit_price": 95000, "delivery_month": "month 20"},
                {"material": "Generator Diesel 2000kW", "supplier": "Eaton Electrical Systems", "quantity": 3, "unit": "EA", "unit_price": 485000, "delivery_month": "month 16"},
                {"material": "MRI 3T Scanner", "supplier": "Siemens Healthineers", "quantity": 2, "unit": "EA", "unit_price": 3500000, "delivery_month": "month 38"},
                {"material": "CT Scanner 128-Slice", "supplier": "GE Healthcare", "quantity": 3, "unit": "EA", "unit_price": 1850000, "delivery_month": "month 36"},
                {"material": "Patient Beds Hospital-Grade", "supplier": "Hill-Rom", "quantity": 250, "unit": "EA", "unit_price": 12500, "delivery_month": "month 42"},
                {"material": "Fire Alarm Panel Healthcare", "supplier": "Simplex Fire Protection", "quantity": 1, "unit": "EA", "unit_price": 85000, "delivery_month": "month 28"},
            ],
            "supply_chain_risks": [
                {"risk": "Medical equipment lead times (MRI: 36-48 weeks)", "severity": "critical", "mitigation": "Order imaging equipment 24 months ahead, coordinate shielding"},
                {"risk": "Medical gas system coordination delays", "severity": "high", "mitigation": "Dedicated medical gas contractor, early shop drawings"},
                {"risk": "Operating room HVAC complexity", "severity": "high", "mitigation": "Mock-up testing, factory witness testing"},
                {"risk": "Healthcare-grade finishes availability", "severity": "medium", "mitigation": "Approved equal clauses, multiple suppliers"},
            ],
        },
        "crewAnalysis": {
            "crew_allocations": [
                {"phase": "Foundation", "crew": "Concrete Crew", "headcount": 35, "skill_type": "Foreman - Concrete", "start_month": 3, "end_month": 7, "cost": 950000},
                {"phase": "Structural", "crew": "Steel Crew", "headcount": 50, "skill_type": "Foreman - Steel", "start_month": 7, "end_month": 20, "cost": 4200000},
                {"phase": "MEP Installation", "crew": "MEP Crews", "headcount": 90, "skill_type": "Mixed Trades", "start_month": 14, "end_month": 40, "cost": 9800000},
                {"phase": "Medical Equipment", "crew": "Equipment Specialists", "headcount": 25, "skill_type": "Specialty Contractor", "start_month": 36, "end_month": 44, "cost": 2500000},
                {"phase": "Full Project", "crew": "Project Management", "headcount": 12, "skill_type": "Project Manager", "start_month": 1, "end_month": 48, "cost": 6200000},
            ],
            "workforce_gaps": [
                {"role": "Healthcare MEP Specialists", "gap_count": 18, "severity": "high", "detail": "Medical gas, OR HVAC requires specialized training"},
                {"role": "Medical Equipment Installers", "gap_count": 10, "severity": "medium", "detail": "Manufacturer-certified crews for imaging equipment"},
                {"role": "Infection Control Specialists", "gap_count": 4, "severity": "medium", "detail": "ICRA-trained personnel for barrier management"},
            ],
        },
    })


# ==============================================================================
# PROJECT 5: Riverside Commons - Mixed-Use Urban Development (Denver, CO)
# ==============================================================================

def _riverside_commons_fixture() -> dict[str, Any]:
    return _attach_building_definition({
        "projectSummary": {
            "project_name": "Riverside Commons - Mixed-Use Development",
            "client_name": "Urban Ventures Denver LLC",
            "location": "2800 Platte Street, Denver, CO 80211",
            "project_type": "Mixed-Use Residential/Retail/Office",
            "budget": 475000000,
            "duration_months": 40,
            "scope": (
                "900K GSF mixed-use development: 18-story residential tower (280 units), 8-story office "
                "building (220K SF Class A), 3-story retail podium (65K SF), shared below-grade parking "
                "(850 spaces). Pedestrian bridge to light rail station, urban plaza, rooftop amenity deck."
            ),
            "square_footage": 900000,
            "floor_count": 18,
            "complexity_level": "High",
            "start_date": "2026-05-01",
            "target_completion_date": "2029-09-01",
            "milestones": [
                {"name": "Notice to Proceed", "date": "2026-05-01"},
                {"name": "Excavation & Shoring Complete", "date": "2026-10-01"},
                {"name": "Parking Structure Complete", "date": "2027-05-01"},
                {"name": "Podium Structure Complete", "date": "2027-11-01"},
                {"name": "Residential Tower Topping Out", "date": "2028-08-01"},
                {"name": "Office Building Enclosure Complete", "date": "2028-12-01"},
                {"name": "Retail Tenant Improvement Complete", "date": "2029-05-01"},
                {"name": "Residential Move-In Ready", "date": "2029-07-01"},
                {"name": "Final Certificate of Occupancy", "date": "2029-09-01"},
            ],
        },
        "blueprintSummary": {
            "construction_type": "Type I-A/Type III-A hybrid (Podium + tower)",
            "stories_above_grade": 18,
            "stories_below_grade": 3,
            "structural_steel_tons": 5200,
            "concrete_cy": 38000,
            "curtain_wall_sf": 220000,
            "lateral_system": "Concrete core (residential), steel braced frame (office)",
            "foundation_type": "Mat foundation with tie-backs",
            "mep_highlights": {
                "electrical_service_amps": 14000,
                "elevators": 9,
                "emergency_generators_kw": 3500,
                "cooling_tons": 3200,
                "fire_pump_gpm": 2200,
            },
        },
        "permitAssessment": {
            "required_permits": [
                {"name": "Denver Building Permit - Mixed-Use", "category": "Municipal - Denver CCD", "status": "Approved", "estimated_days": 0},
                {"name": "Parking Structure Permit", "category": "Municipal - Denver CCD", "status": "Approved", "estimated_days": 0},
                {"name": "Residential Tower Permit", "category": "Municipal - Denver CCD", "status": "In Review", "estimated_days": 25},
                {"name": "Office Building Permit", "category": "Municipal - Denver CCD", "status": "Pending", "estimated_days": 30},
                {"name": "Retail Shell & Core Permit", "category": "Municipal - Denver CCD", "status": "Pending", "estimated_days": 20},
                {"name": "Pedestrian Bridge - Right of Way", "category": "Municipal - Public Works", "status": "Approved", "estimated_days": 0},
                {"name": "Urban Plaza - Public Improvement", "category": "Municipal - Parks & Rec", "status": "In Review", "estimated_days": 35},
                {"name": "Stormwater Management Plan", "category": "Environmental - Denver Wastewater", "status": "Approved", "estimated_days": 0},
            ],
        },
        "projectPlan": {
            "phases": [
                {"phase_name": "Excavation & Shoring", "duration_days": 120, "progress_percentage": 0, "materials": ["Shotcrete", "Tie-backs", "Dewatering pumps"], "inspections": ["Shoring inspection", "Groundwater monitoring"]},
                {"phase_name": "Parking Structure", "duration_days": 180, "progress_percentage": 0, "materials": ["Ready-mix concrete 4000 PSI", "PT slabs", "Precast beams"], "inspections": ["Concrete testing", "PT stressing"]},
                {"phase_name": "Podium Construction", "duration_days": 150, "progress_percentage": 0, "materials": ["Structural steel", "Composite deck", "Concrete slabs"], "inspections": ["Steel connections", "Fire proofing"]},
                {"phase_name": "Residential Tower", "duration_days": 360, "progress_percentage": 0, "materials": ["Ready-mix concrete 5000 PSI", "PT slabs", "Curtain wall"], "inspections": ["Core walls", "Slab inspections"]},
                {"phase_name": "Office Building", "duration_days": 300, "progress_percentage": 0, "materials": ["Structural steel", "Metal deck", "Curtain wall"], "inspections": ["Steel erection", "Enclosure testing"]},
                {"phase_name": "MEP Installation (All Buildings)", "duration_days": 320, "progress_percentage": 0, "materials": ["HVAC units", "Electrical panels", "Plumbing"], "inspections": ["Rough-in inspections", "Fire protection"]},
                {"phase_name": "Retail Tenant Improvements", "duration_days": 180, "progress_percentage": 0, "materials": ["Storefront", "Interior finishes", "MEP tie-ins"], "inspections": ["Tenant build-out", "Health dept"]},
                {"phase_name": "Residential Finishes", "duration_days": 240, "progress_percentage": 0, "materials": ["Drywall", "Flooring", "Appliances", "Fixtures"], "inspections": ["Unit inspections", "Final walkthrough"]},
                {"phase_name": "Pedestrian Bridge & Plaza", "duration_days": 120, "progress_percentage": 0, "materials": ["Steel bridge structure", "Paving", "Landscaping"], "inspections": ["Structural inspection", "ADA compliance"]},
            ],
        },
        "supplierAnalysis": {
            "procurement_plan": [
                {"material": "Ready-Mix Concrete 5000 PSI", "supplier": "Holcim Concrete Co", "quantity": 25000, "unit": "CY", "unit_price": 165, "delivery_month": "month 8"},
                {"material": "Ready-Mix Concrete 4000 PSI", "supplier": "Holcim Concrete Co", "quantity": 13000, "unit": "CY", "unit_price": 145, "delivery_month": "month 4"},
                {"material": "Structural Steel (Mixed Sizes)", "supplier": "United Structural Steel Corp", "quantity": 520, "unit": "TON", "unit_price": 4800, "delivery_month": "month 6"},
                {"material": "Post-Tensioning Tendons", "supplier": "Nucor Building Components", "quantity": 180000, "unit": "LF", "unit_price": 3.85, "delivery_month": "month 5"},
                {"material": "Unitized Curtain Wall", "supplier": "YKK AP Facade Systems", "quantity": 220000, "unit": "SF", "unit_price": 185, "delivery_month": "month 18"},
                {"material": "Elevator Passenger (Residential)", "supplier": "Otis Elevator Company", "quantity": 6, "unit": "EA", "unit_price": 285000, "delivery_month": "month 14"},
                {"material": "Elevator Freight/Office", "supplier": "Otis Elevator Company", "quantity": 3, "unit": "EA", "unit_price": 385000, "delivery_month": "month 16"},
                {"material": "Chiller Air-Cooled 500 Ton", "supplier": "Trane Commercial HVAC", "quantity": 4, "unit": "EA", "unit_price": 285000, "delivery_month": "month 22"},
                {"material": "Generator Diesel 2000kW", "supplier": "Eaton Electrical Systems", "quantity": 2, "unit": "EA", "unit_price": 485000, "delivery_month": "month 20"},
                {"material": "Kitchen Appliances Package", "supplier": "GE Appliances (bulk)", "quantity": 280, "unit": "EA", "unit_price": 4500, "delivery_month": "month 34"},
            ],
            "supply_chain_risks": [
                {"risk": "Phased occupancy coordination - retail before residential", "severity": "medium", "mitigation": "Separate MEP risers, phased CO strategy"},
                {"risk": "Residential appliance delivery (280 units)", "severity": "medium", "mitigation": "Bulk order 6 months ahead, phased delivery by floor"},
                {"risk": "Tenant improvement delays for retail anchors", "severity": "high", "mitigation": "Early tenant coordination, shell delivery milestones"},
            ],
        },
        "crewAnalysis": {
            "crew_allocations": [
                {"phase": "Excavation", "crew": "Site Crew", "headcount": 22, "skill_type": "Laborer", "start_month": 1, "end_month": 5, "cost": 450000},
                {"phase": "Parking Structure", "crew": "Concrete Crew", "headcount": 40, "skill_type": "Foreman - Concrete", "start_month": 4, "end_month": 10, "cost": 1200000},
                {"phase": "Residential Tower", "crew": "Tower Crew", "headcount": 50, "skill_type": "Foreman - Concrete", "start_month": 10, "end_month": 28, "cost": 4500000},
                {"phase": "Office Building", "crew": "Steel Crew", "headcount": 35, "skill_type": "Foreman - Steel", "start_month": 12, "end_month": 24, "cost": 2800000},
                {"phase": "MEP Installation", "crew": "MEP Crews", "headcount": 75, "skill_type": "Mixed Trades", "start_month": 16, "end_month": 36, "cost": 7200000},
                {"phase": "Retail Fit-Out", "crew": "Finish Crews", "headcount": 45, "skill_type": "Carpenter - Finish", "start_month": 28, "end_month": 36, "cost": 2400000},
                {"phase": "Residential Finishes", "crew": "Multi-Family Crew", "headcount": 60, "skill_type": "Mixed Trades", "start_month": 26, "end_month": 38, "cost": 4800000},
                {"phase": "Full Project", "crew": "Project Management", "headcount": 10, "skill_type": "Project Manager", "start_month": 1, "end_month": 40, "cost": 4800000},
            ],
            "workforce_gaps": [
                {"role": "Multi-Family Finishing Crews", "gap_count": 15, "severity": "medium", "detail": "High volume of units - need production-pace crews"},
                {"role": "Retail Coordination Specialists", "gap_count": 4, "severity": "medium", "detail": "Tenant coordination requires dedicated staff"},
            ],
        },
    })


def get_all_project_fixtures() -> list[dict[str, Any]]:
    """Return all 5 project fixtures."""
    return [
        _aurora_tower_fixture(),
        _thunderdome_arena_fixture(),
        _innovation_hall_fixture(),
        _mercy_medical_center_fixture(),
        _riverside_commons_fixture(),
    ]


# Export individual fixtures for testing
AURORA_TOWER_FIXTURE = _aurora_tower_fixture()
THUNDERDOME_ARENA_FIXTURE = _thunderdome_arena_fixture()
INNOVATION_HALL_FIXTURE = _innovation_hall_fixture()
MERCY_MEDICAL_CENTER_FIXTURE = _mercy_medical_center_fixture()
RIVERSIDE_COMMONS_FIXTURE = _riverside_commons_fixture()
