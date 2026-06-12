"""
Generate ConstructaIQ Backend Documentation PDF.

Usage:
    python scripts/generate_backend_docs_pdf.py
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fpdf import FPDF

OUTPUT = Path(__file__).resolve().parent.parent / "docs" / "ConstructaIQ-Backend-Documentation.pdf"


class BackendDocPDF(FPDF):
    def header(self) -> None:
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.set_x(self.l_margin)
        self.cell(0, 8, f"ConstructaIQ Backend API Documentation    Page {self.page_no()}", align="L", new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)
        self.ln(2)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Generated {date.today().isoformat()} | ConstructaIQ", align="C")

    def title_page(self) -> None:
        self.add_page()
        self.ln(50)
        self.set_font("Helvetica", "B", 28)
        self.cell(0, 14, "ConstructaIQ", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "B", 20)
        self.cell(0, 12, "Backend API Documentation", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(10)
        self.set_font("Helvetica", "", 12)
        self.cell(0, 8, "Multi-Agent Construction Intelligence Platform", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(8)
        self.set_font("Helvetica", "", 11)
        self.cell(0, 8, f"Version 1.0.0  |  {date.today().strftime('%B %d, %Y')}", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(30)
        self.set_font("Helvetica", "", 10)
        bullets = [
            "FastAPI + Azure AI Foundry multi-agent pipeline",
            "Azure SQL persistence (12 tables)",
            "Async project analyze jobs with status polling",
            "Document Intelligence + Blob Storage integration",
        ]
        for b in bullets:
            self.cell(0, 7, f"  -  {b}", align="C", new_x="LMARGIN", new_y="NEXT")

    def h1(self, text: str) -> None:
        self.ln(4)
        self.set_font("Helvetica", "B", 16)
        self.set_fill_color(240, 240, 245)
        self.cell(0, 10, f"  {text}", new_x="LMARGIN", new_y="NEXT", fill=True)
        self.ln(2)

    def h2(self, text: str) -> None:
        self.ln(3)
        self.set_font("Helvetica", "B", 13)
        self.cell(0, 8, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def h3(self, text: str) -> None:
        self.ln(2)
        self.set_font("Helvetica", "B", 11)
        self.cell(0, 7, text, new_x="LMARGIN", new_y="NEXT")

    def body(self, text: str) -> None:
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 10)
        self.multi_cell(self.w - self.l_margin - self.r_margin, 5.5, text)
        self.ln(1)

    def bullet(self, text: str) -> None:
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 10)
        self.multi_cell(self.w - self.l_margin - self.r_margin, 5.5, f"  -  {text}")

    def code(self, text: str) -> None:
        self.set_font("Courier", "", 9)
        self.set_fill_color(248, 248, 252)
        for line in text.splitlines():
            self.cell(0, 5, f"  {line}", new_x="LMARGIN", new_y="NEXT", fill=True)
        self.ln(2)

    def table(self, headers: list[str], rows: list[list[str]], col_widths: list[int] | None = None) -> None:
        if not rows:
            return
        n = len(headers)
        total_w = self.w - self.l_margin - self.r_margin
        widths = col_widths or [total_w // n] * n
        if sum(widths) > total_w:
            scale = total_w / sum(widths)
            widths = [int(w * scale) for w in widths]

        def _draw_header() -> None:
            self.set_x(self.l_margin)
            self.set_font("Helvetica", "B", 9)
            self.set_fill_color(220, 225, 235)
            for i, h in enumerate(headers):
                self.cell(widths[i], 7, h[:40], border=1, fill=True)
            self.ln()

        _draw_header()
        self.set_font("Helvetica", "", 8)
        fill = False
        for row in rows:
            if self.get_y() > 265:
                self.add_page()
                _draw_header()
                self.set_font("Helvetica", "", 8)
            self.set_x(self.l_margin)
            row_h = 7
            for i, cell in enumerate(row):
                txt = str(cell)
                self.cell(widths[i], row_h, txt[:80], border=1, fill=fill)
            self.ln(row_h)
            fill = not fill
        self.ln(3)


def build_pdf() -> BackendDocPDF:
    pdf = BackendDocPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.title_page()

  # TOC
    pdf.add_page()
    pdf.h1("Table of Contents")
    toc = [
        "1. Executive Summary",
        "2. System Architecture",
        "3. Technology Stack",
        "4. Project Structure",
        "5. Configuration and Environment Variables",
        "6. Database Schema",
        "7. Agent Pipeline",
        "8. Persistence Layer",
        "9. API Reference",
        "10. Async Analyze Jobs",
        "11. Azure Service Integrations",
        "12. Response Contract (Frontend)",
        "13. Testing and Scripts",
        "14. Postman Collection",
        "15. Known Limitations and Roadmap",
    ]
    for item in toc:
        pdf.bullet(item)

    # 1 Executive Summary
    pdf.add_page()
    pdf.h1("1. Executive Summary")
    pdf.body(
        "ConstructaIQ Backend is a FastAPI service that orchestrates a multi-agent AI pipeline "
        "for construction project onboarding and intelligence. It integrates with Azure AI Foundry "
        "to run specialized agents (contract extraction, blueprint analysis, permits, planning, "
        "supplier matching, crew allocation, knowledge insights, and project health diagnosis). "
        "Results can be persisted to Azure SQL Database and exposed through REST APIs designed "
        "for frontend consumption."
    )
    pdf.body(
        "The primary integration path is the project lifecycle flow: create or upload a project, "
        "enqueue an async analyze job (HTTP 202), poll for completion, then read structured "
        "intelligence data (summary, health, suppliers, crew, agent audit trail). Stateless "
        "shortcuts remain available for direct pipeline invocation without a project record."
    )

    # 2 Architecture
    pdf.h1("2. System Architecture")
    pdf.body(
        "The backend follows a layered architecture: API routers delegate to service classes, "
        "which coordinate the orchestrator, persistence, and Azure integrations. The analyze "
        "orchestrator runs agents sequentially, passing JSON context from each step to the next."
    )
    pdf.code(
        "Frontend / Postman\n"
        "       |\n"
        "  FastAPI Routers  (/api, /api/v1)\n"
        "       |\n"
        "  +-- ProjectService ---- AnalyzeJobService (async)\n"
        "  |         |                    |\n"
        "  |         v                    v\n"
        "  |   Repositories         AnalyzeOrchestrator\n"
        "  |         |                    |\n"
        "  |         v          +---------+---------+\n"
        "  +-- Azure SQL <--------+ Foundry | DI | Blob\n"
        "                         +-------------------+"
    )
    pdf.h2("Core Components")
    pdf.bullet("app/main.py - FastAPI app, CORS, lifespan (DB init/dispose), router mounting")
    pdf.bullet("app/api/projects.py - Project lifecycle and read endpoints")
    pdf.bullet("app/api/analyze.py - Stateless Mode 1 (text) and Mode 2 (documents)")
    pdf.bullet("app/api/catalogs.py - Supplier and crew master catalog CRUD")
    pdf.bullet("app/orchestrator/analyze_orchestrator.py - Multi-agent pipeline")
    pdf.bullet("app/services/agent_persistence_service.py - DB persistence after pipeline")
    pdf.bullet("app/services/analyze_job_service.py - In-memory async job queue")
    pdf.bullet("app/services/response_mapper.py - DB to frontend DTO mapping")
    pdf.bullet("app/db/ - SQLAlchemy models, async repositories, Alembic migrations")

    # 3 Tech stack
    pdf.h1("3. Technology Stack")
    pdf.table(
        ["Component", "Technology"],
        [
            ["Web framework", "FastAPI 0.111+"],
            ["Server", "Uvicorn"],
            ["ORM", "SQLAlchemy 2.0 (async)"],
            ["Database driver", "aioodbc + pyodbc (Azure SQL)"],
            ["Migrations", "Alembic"],
            ["Validation", "Pydantic v2"],
            ["AI agents", "Azure AI Foundry REST API"],
            ["Document OCR", "Azure Document Intelligence"],
            ["File storage", "Azure Blob Storage (optional)"],
            ["Testing", "pytest, pytest-asyncio, FastAPI TestClient"],
        ],
        [55, 135],
    )

    # 4 Project structure
    pdf.h1("4. Project Structure")
    pdf.code(
        "backend/\n"
        "  app/\n"
        "    main.py                 Application entry point\n"
        "    config/settings.py      Environment configuration\n"
        "    api/                    REST route handlers\n"
        "    orchestrator/           Agent pipeline\n"
        "    services/               Business logic\n"
        "    db/models/              SQLAlchemy ORM models\n"
        "    db/repositories/        Data access layer\n"
        "    schemas/                Pydantic request/response DTOs\n"
        "  alembic/                  Database migrations\n"
        "  scripts/                  Seed, E2E, and utility scripts\n"
        "  tests/                    Unit tests\n"
        "  postman/                  Postman collection and environment\n"
        "  docs/                     Generated documentation (this PDF)"
    )

    # 5 Config
    pdf.h1("5. Configuration and Environment Variables")
    pdf.body("All settings are loaded from backend/.env via pydantic-settings.")
    pdf.table(
        ["Variable", "Required", "Description"],
        [
            ["AZURE_AIFOUNDRY_ENDPOINT", "Yes", "Foundry REST endpoint URL"],
            ["AZURE_AIFOUNDRY_KEY", "Yes", "Foundry API key"],
            ["AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT", "Mode 2", "Document Intelligence endpoint"],
            ["AZURE_DOCUMENT_INTELLIGENCE_KEY", "Mode 2", "Document Intelligence key"],
            ["AZURE_STORAGE_CONNECTION_STRING", "Optional", "Blob storage connection"],
            ["AZURE_STORAGE_CONTAINER_NAME", "Optional", "Blob container name"],
            ["DATABASE_URL", "Optional", "Azure SQL async connection string"],
            ["PERMIT_AGENT_VERSION", "Optional", "Default: 3"],
            ["SKIP_RISK_RECOVERY_DEFAULT", "Optional", "Default: true"],
            ["PORT", "Optional", "Default: 8000"],
        ],
        [62, 22, 106],
    )
    pdf.h2("Setup Commands")
    pdf.code(
        "cd backend\n"
        "python -m venv .venv\n"
        ".venv\\Scripts\\activate\n"
        "pip install -r requirements.txt\n"
        "cp .env.example .env\n"
        "python -m alembic upgrade head\n"
        "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    )

    # 6 Database
    pdf.add_page()
    pdf.h1("6. Database Schema")
    pdf.body(
        "12 tables migrated via Alembic (001_baseline, 002_add_core_tables). "
        "The app runs without a database when DATABASE_URL is unset. Project APIs require DB."
    )
    pdf.table(
        ["Table", "Model", "Purpose"],
        [
            ["projects", "Project", "Root construction project"],
            ["documents", "Document", "Uploaded PDFs and blob paths"],
            ["agent_executions", "AgentExecution", "Per-agent run audit trail"],
            ["permits", "Permit", "Permit assessments"],
            ["schedules", "Schedule", "Phase breakdown and duration"],
            ["project_suppliers", "ProjectSupplier", "Procurement plan rows"],
            ["crew_plans", "CrewPlan", "Crew allocations by phase"],
            ["inspections", "Inspection", "Inspection checkpoints"],
            ["budgets", "Budget", "Cost breakdown"],
            ["supplier_master", "SupplierMaster", "Supplier directory"],
            ["supplier_materials", "SupplierMaterial", "Supplier catalog items"],
            ["crew_master", "CrewMaster", "Workforce directory"],
        ],
        [45, 40, 105],
    )
    pdf.h2("Key Project Columns (projects table)")
    pdf.bullet("project_id (PK), project_name, project_type, location, client_name, status")
    pdf.bullet("start_date, target_completion_date, contract_value, duration_months")
    pdf.bullet("scope, milestones, square_footage, floor_count, complexity_level, priority_score")

    # 7 Agent pipeline
    pdf.h1("7. Agent Pipeline")
    pdf.body(
        "The orchestrator (analyze_orchestrator.py) runs agents sequentially. Each agent "
        "receives JSON context from prior steps. All prompts append JSON_OUTPUT_SUFFIX to "
        "request valid JSON-only responses. Each _call() records started_at, completed_at, "
        "and output in an execution_log for agent_executions persistence."
    )
    pdf.h2("Active Pipeline (skip_risk_recovery=true, default)")
    pdf.code(
        "ContractAgent -> BlueprintAgent -> PermitAgent (v3)\n"
        "  -> PlanningAgent -> SupplierAgent -> CrewAgent\n"
        "  -> ConstructionKnowledgeAgent -> DoctorAgent"
    )
    pdf.h2("Skipped Agents (not deployed in Foundry)")
    pdf.bullet("RiskAgent - returns skipped payload when skip_risk_recovery=true")
    pdf.bullet("RecoveryAgent - returns skipped payload when skip_risk_recovery=true")
    pdf.h2("Pipeline Modes")
    pdf.bullet("Mode 1 (Text): project_name + description, no documents required")
    pdf.bullet("Mode 2 (Documents): PDF upload, Document Intelligence extraction, then agents")
    pdf.h2("Catalog Injection")
    pdf.body(
        "SupplierAgent and CrewAgent receive live catalogs from supplier_master, "
        "supplier_materials, and crew_master tables via master_catalog_service.py. "
        "Seed with: python scripts/seed_supplier_master.py and seed_crew_master.py"
    )
    pdf.h2("Pipeline Output Keys")
    pdf.table(
        ["Key", "Source Agent"],
        [
            ["projectSummary", "ContractAgent"],
            ["blueprintSummary", "BlueprintAgent"],
            ["permitAssessment", "PermitAgent"],
            ["projectPlan", "PlanningAgent"],
            ["supplierAnalysis", "SupplierAgent"],
            ["crewAnalysis", "CrewAgent"],
            ["knowledgeInsights", "ConstructionKnowledgeAgent"],
            ["riskAnalysis", "RiskAgent (or skipped)"],
            ["recoveryPlan", "RecoveryAgent (or skipped)"],
            ["projectHealth", "DoctorAgent"],
        ],
        [55, 135],
    )

    # 8 Persistence
    pdf.h1("8. Persistence Layer")
    pdf.body(
        "persist_analysis_outputs() in agent_persistence_service.py runs after the full pipeline "
        "when project_id and a DB session are provided. Uses replace-on-rerun for derived tables "
        "and append-only for agent_executions."
    )
    pdf.table(
        ["Table", "Strategy", "Pipeline Source"],
        [
            ["projects", "Update in place", "projectSummary fields"],
            ["permits", "Delete + insert", "permitAssessment.required_permits"],
            ["schedules", "Delete + insert", "projectPlan phases, duration"],
            ["budgets", "Delete + insert", "projectSummary.budget + cost sums"],
            ["inspections", "Delete + insert", "projectPlan.inspection_stages"],
            ["project_suppliers", "Delete + insert", "supplierAnalysis.procurement_plan"],
            ["crew_plans", "Delete + insert", "crewAnalysis.crew_allocations"],
            ["agent_executions", "Append only", "execution_log per _call()"],
        ],
        [40, 35, 115],
    )
    pdf.h2("Date Parsing")
    pdf.bullet("ISO format: 2026-08-01")
    pdf.bullet("Relative: Month N (offset from project.start_date)")
    pdf.bullet("Unparseable dates stored as NULL with warning log")

    # 9 API Reference
    pdf.add_page()
    pdf.h1("9. API Reference")
    pdf.body(
        "Routers mounted at /api and /api/v1. Project endpoints return ApiResponse wrapper: "
        '{ "data": T, "status": "success", "timestamp": "..." }. '
        "Stateless /analyze endpoints return raw camelCase JSON."
    )

    pdf.h2("9.1 Infrastructure")
    pdf.table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/healthz", "Liveness probe"],
            ["GET", "/healthz/db", "Database connectivity (503 if down)"],
        ],
        [18, 55, 117],
    )

    pdf.h2("9.2 Project Lifecycle")
    pdf.table(
        ["Method", "Path", "Status", "Description"],
        [
            ["POST", "/api/v1/projects", "201", "Create project (JSON body)"],
            ["POST", "/api/v1/projects/upload", "201", "Multipart PDF upload"],
            ["POST", "/api/v1/projects/{id}/analyze", "202", "Enqueue async analyze job"],
            ["GET", "/api/v1/projects/{id}/analyze/status", "200", "Poll job status"],
            ["GET", "/api/v1/projects/{id}/upload-session", "200", "UploadSessionResponse shape"],
        ],
        [16, 72, 14, 88],
    )

    pdf.h2("9.3 Project Read Endpoints")
    pdf.table(
        ["Method", "Path", "Description"],
        [
            ["GET", "/api/v1/projects/{id}", "Project metadata"],
            ["GET", "/api/v1/projects/{id}/summary", "Intelligence view (permits, phases, crew)"],
            ["GET", "/api/v1/projects/{id}/suppliers", "Procurement rows"],
            ["GET", "/api/v1/projects/{id}/crew", "Crew plan rows"],
            ["GET", "/api/v1/projects/{id}/health", "Latest DoctorAgent output"],
            ["GET", "/api/v1/projects/{id}/agents", "Agent execution audit trail"],
            ["GET", "/api/v1/projects/{id}/risks", "503 stub until RiskAgent deployed"],
            ["GET", "/api/v1/projects/{id}/recovery", "503 stub until RecoveryAgent deployed"],
            ["POST", "/api/v1/projects/call-agent", "Direct single-agent invocation"],
        ],
        [16, 72, 102],
    )

    pdf.h2("9.4 Analyze (Stateless)")
    pdf.table(
        ["Method", "Path", "Body", "Notes"],
        [
            ["POST", "/api/v1/analyze/text", "form-data", "Sync ~2 min; skip_risk_recovery supported"],
            ["POST", "/api/v1/analyze/documents", "multipart PDF", "Requires Document Intelligence"],
        ],
        [16, 55, 35, 84],
    )

    pdf.h2("9.5 Catalog CRUD")
    pdf.table(
        ["Method", "Path", "Description"],
        [
            ["GET/POST", "/api/v1/suppliers", "List / create suppliers"],
            ["GET/POST", "/api/v1/suppliers/{id}/materials", "List / create materials"],
            ["GET/POST", "/api/v1/crew", "List / create crew members"],
        ],
        [28, 72, 90],
    )

    pdf.h2("9.6 Example: Create Project")
    pdf.code(
        'POST /api/v1/projects\n'
        'Content-Type: application/json\n\n'
        '{\n'
        '  "project_name": "Tower A",\n'
        '  "location": "Chicago, IL",\n'
        '  "scope": "42-floor mixed-use tower...",\n'
        '  "duration_months": 28,\n'
        '  "floor_count": 42\n'
        '}'
    )

    pdf.h2("9.7 Example: Start Analyze")
    pdf.code(
        'POST /api/v1/projects/1/analyze\n'
        'Content-Type: application/json\n\n'
        '{\n'
        '  "description": "Project scope text...",\n'
        '  "agent_version": "1",\n'
        '  "skip_risk_recovery": true\n'
        '}\n\n'
        'Response (202): { "data": { "job_id": "uuid", "status": "queued" } }'
    )

    # 10 Async jobs
    pdf.h1("10. Async Analyze Jobs")
    pdf.body(
        "POST /projects/{id}/analyze returns HTTP 202 immediately. analyze_job_service.py "
        "runs the pipeline in a background asyncio task. Jobs are stored in-memory (lost on "
        "server restart). Poll GET /projects/{id}/analyze/status until status is complete or error."
    )
    pdf.table(
        ["Status", "Meaning"],
        [
            ["queued", "Job created, not yet started"],
            ["running", "Pipeline in progress; check progress_step and overall_pct"],
            ["complete", "Result available in result field"],
            ["error", "Pipeline failed; error field contains message"],
        ],
        [35, 155],
    )
    pdf.body("Progress steps: ContractAgent, BlueprintAgent, PermitAgent, PlanningAgent, SupplierAgent, CrewAgent, ConstructionKnowledgeAgent, DoctorAgent.")

    # 11 Azure
    pdf.h1("11. Azure Service Integrations")
    pdf.h2("Azure AI Foundry")
    pdf.body("foundry_service.py calls agents via REST. Each agent has a name and version. PermitAgent uses version from PERMIT_AGENT_VERSION setting (default 3).")
    pdf.h2("Document Intelligence")
    pdf.body("document_intelligence.py extracts text from PDF bytes or blob SAS URLs for Mode 2 pipeline.")
    pdf.h2("Blob Storage")
    pdf.body("blob_storage_service.py uploads PDFs to a private container, generates short-lived SAS URLs for DI, and supports download for deferred project analyze.")

    # 12 Frontend contract
    pdf.h1("12. Response Contract (Frontend)")
    pdf.body("response_mapper.py maps DB entities to frontend TypeScript shapes:")
    pdf.bullet("ProjectIntelligenceData - summary endpoint (permits, phases, crewRequirements)")
    pdf.bullet("Project health - DoctorAgent fields from latest agent_execution")
    pdf.bullet("UploadSessionResponse - job status with agentSteps and overallPct")
    pdf.bullet("RiskIntelligenceData - stub until RiskAgent deployed")

    # 13 Testing
    pdf.add_page()
    pdf.h1("13. Testing and Scripts")
    pdf.table(
        ["Script / Command", "Purpose"],
        [
            ["pytest tests/", "Unit tests (persistence, response mapper)"],
            ["scripts/e2e_project_flow_test.py", "HTTP project CRUD + read APIs"],
            ["scripts/e2e_backend_test.py", "Live Foundry pipeline (text, ~2 min)"],
            ["scripts/e2e_mode2_documents.py", "Mode 2 PDF pipeline"],
            ["scripts/test_supplier_crew_pipeline.py", "Catalog + persistence tests"],
            ["scripts/seed_supplier_master.py", "Seed 4 suppliers, 8 materials"],
            ["scripts/seed_crew_master.py", "Seed 12 crew members"],
            ["scripts/check_db.py", "Verify Azure SQL connectivity"],
            ["scripts/check_blob.py", "Verify blob storage connectivity"],
            ["verify_backend.py", "Delegates to e2e_project_flow_test.py"],
        ],
        [75, 115],
    )

    # 14 Postman
    pdf.h1("14. Postman Collection")
    pdf.body("Import from backend/postman/:")
    pdf.bullet("ConstructaIQ.postman_collection.json - 24 requests in 6 folders")
    pdf.bullet("ConstructaIQ-Local.postman_environment.json - baseUrl, projectId, jobId")
    pdf.body(
        "Select environment ConstructaIQ - Local in Postman. Variables projectId and jobId "
        "auto-capture on Create Project and Start Analyze. Recommended flow: "
        "Create Project -> Start Analyze -> Poll Status -> Get Summary."
    )

    # 15 Limitations
    pdf.h1("15. Known Limitations and Roadmap")
    pdf.table(
        ["Item", "Status"],
        [
            ["Frontend integration", "UI still uses mock data"],
            ["RiskAgent / RecoveryAgent", "Not deployed in Foundry; 503 stubs"],
            ["Authentication / RBAC", "Not implemented"],
            ["Job persistence", "In-memory only; lost on restart"],
            ["Extra requirement agents", "InspectionAgent, BudgetAgent, CommunicationAgent not built"],
        ],
        [70, 120],
    )
    pdf.h2("Recommended Next Steps")
    pdf.bullet("Wire frontend to project upload + async analyze + summary APIs")
    pdf.bullet("Deploy RiskAgent and RecoveryAgent to Azure AI Foundry")
    pdf.bullet("Add auth middleware for Bearer tokens")
    pdf.bullet("Persist analyze jobs to database for production resilience")

    return pdf


def main() -> int:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = build_pdf()
    pdf.output(str(OUTPUT))
    print(f"Generated: {OUTPUT}")
    print(f"Pages: {pdf.page_no()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
