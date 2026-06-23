# ConstructaIQ Backend

FastAPI service for multi-agent construction risk analysis via Azure AI Foundry.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env            # then fill in values
```

## MySQL Database (optional)

The app runs without a database when `DATABASE_URL` is unset. Production and local dev use **MySQL** via the `asyncmy` async driver.

### Prerequisites

1. **MySQL 8.x** server reachable from the app host (port 3306).
2. **Database** — create with utf8mb4:

```sql
CREATE DATABASE constructaiq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL ON constructaiq.* TO 'backenduser'@'%';
```

3. **Python driver** — `asyncmy` is installed from `requirements.txt`.

### Connection string

Set in `.env` (URL-encode special characters in the password, e.g. `~` → `%7E`):

```
DATABASE_URL=mysql+asyncmy://backenduser:<password>@<host>:3306/constructaiq?charset=utf8mb4
```

### Migrations

```bash
cd backend
python -m alembic upgrade head
```

Current Alembic revisions (MySQL):

- `001_mysql_initial` — full schema (squashed from legacy SQL Server migrations)
- `002_longtext_columns` — `LONGTEXT` for large agent JSON / document text

Legacy SQL Server migrations (`001_baseline` … `007_report_deliveries`) are archived under `alembic/versions/archive/` for history only.

### One-time SQL Server → MySQL data migration

If you have existing data in SQL Server (LocalDB or Azure SQL), copy it once:

```bash
# .env — keep SQL Server as source until ETL is verified
SOURCE_DATABASE_URL=mssql+aioodbc://@localhost/hackathon?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes&Trusted_Connection=yes&Server=(localdb)%5CMSSQLLocalDB
DATABASE_URL=mysql+asyncmy://backenduser:<password>@<host>:3306/constructaiq?charset=utf8mb4

cd backend
python -m alembic upgrade head
python scripts/migrate_mssql_to_mysql.py --fresh
```

Requires **ODBC Driver 18** and `aioodbc`/`pyodbc` (included in `requirements.txt` for the ETL script). The script copies tables in FK-safe order, preserves primary keys, and resets `AUTO_INCREMENT`. Remove `SOURCE_DATABASE_URL` after verification.

### Legacy SQL Server local dev (optional)

For one-time ETL source only. See `scripts/ensure_localdb.py` and archived Alembic migrations. The runtime app no longer targets SQL Server by default.

### Bootstrap catalogs (before first analyze)

```bash
cd backend
python scripts/bootstrap.py
```

Runs idempotent seeds for `supplier_master` / `crew_master` catalogs used by SupplierAgent and CrewAgent.

### Demo data (5 test projects)

Wipes all **project-scoped** tables (projects, permits, schedules, budgets, risks, etc.) while preserving `supplier_master`, `supplier_materials`, and `crew_master`. Then seeds 5 fully-populated demo projects for dashboard and project UI testing.

```bash
cd backend
python scripts/bootstrap.py                        # once, if catalogs are empty
python scripts/seed_demo_projects.py --confirm     # destructive reset + seed
python scripts/seed_demo_projects.py --confirm --skip-reset   # seed only (empty tables)
```

Create new migrations after changing SQLAlchemy models:

```bash
python -m alembic revision --autogenerate -m "describe change"
python -m alembic upgrade head
```

### Schema overview

| Table | Model | Description |
|-------|-------|-------------|
| `projects` | `Project` | Root construction project |
| `documents` | `Document` | Uploaded PDFs and extracted text |
| `agent_executions` | `AgentExecution` | Per-agent pipeline run records |
| `permits` | `Permit` | Permit assessments |
| `schedules` | `Schedule` | Project schedule and phases |
| `project_suppliers` | `ProjectSupplier` | Project material procurement rows |
| `crew_plans` | `CrewPlan` | Crew allocation by phase |
| `inspections` | `Inspection` | Inspection records |
| `budgets` | `Budget` | Cost breakdown |
| `project_risks` | `ProjectRisk` | Supply-chain and workforce risks from agents |
| `supplier_master` | `SupplierMaster` | Supplier directory |
| `supplier_materials` | `SupplierMaterial` | Supplier catalog items |
| `crew_master` | `CrewMaster` | Crew/employee directory |
| `report_deliveries` | `ReportDelivery` | Intelligence report email delivery audit |
| `users` | `User` | Auth and report email preferences |

Models live in `app/db/models/`. Pydantic DTOs in `app/schemas/`. Async repositories in `app/db/repositories/`.

Example repository usage:

```python
from app.db.session import get_db
from app.db.repositories import ProjectRepository
from app.schemas import ProjectCreate

async def example(session):
    repo = ProjectRepository(session)
    project = await repo.create(ProjectCreate(project_name="Tower A"))
    await session.commit()
```

### Verify connectivity

```bash
python scripts/check_db.py
```

Run repository smoke test (requires migrated schema):

```bash
python scripts/seed_smoke_test.py
```

Or start the API and call `GET /healthz/db` (returns `503` when DB is unavailable).

## Azure Blob Storage (optional)

When blob settings are configured, Mode 2 document uploads (`POST /api/analyze/documents`) are persisted to a private Azure Blob container before Document Intelligence extraction. Omit these variables to keep the existing in-memory bytes flow.

### Prerequisites

1. **Storage account** — create in Azure Portal (HTTPS-only, disable public blob access).
2. **Blob container** — e.g. `constructaiq-documents` with private access.
3. **Connection string** — copy from the storage account **Access keys** blade.

### Environment variables

Set in `.env`:

```
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=constructaiq-documents
AZURE_STORAGE_SAS_EXPIRY_MINUTES=60
```

Document Intelligence reads uploaded PDFs via short-lived read-only SAS URLs generated by the backend. Public container access is not required.

### Verify connectivity

```bash
python scripts/check_blob.py
```

Successful uploads appear under `connectivity-check/<uuid>/` in the container. Mode 2 responses include a `stored_documents` field with blob paths when blob storage is enabled.

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health endpoints:

- `GET /healthz` — process liveness
- `GET /healthz/db` — database connectivity (requires `DATABASE_URL`)

## Project lifecycle APIs

Routers are mounted at `/api` and `/api/v1` (frontend alias). Responses use the wrapper:

```json
{ "data": { ... }, "status": "success", "timestamp": "..." }
```

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/projects` | Create project (JSON body) |
| `POST` | `/api/projects/upload` | Multipart upload (`project_name`, optional `contract`/`blueprint` PDFs) |
| `POST` | `/api/projects/{id}/analyze` | Enqueue analyze job (`202`, poll status) |
| `GET` | `/api/projects/{id}/analyze/status` | Job status (`queued` / `running` / `complete` / `error`) |
| `GET` | `/api/projects/{id}` | Project metadata |
| `GET` | `/api/projects/{id}/summary` | Intelligence view (permits, phases, crew) |
| `GET` | `/api/projects/{id}/suppliers` | Persisted procurement rows |
| `GET` | `/api/projects/{id}/crew` | Persisted crew plans |
| `GET` | `/api/projects/{id}/agents` | Agent execution audit trail |

Stateless shortcuts (no project record required):

- `POST /api/analyze/text` — Mode 1 text pipeline
- `POST /api/analyze/documents` — Mode 2 PDF pipeline

### Pipeline agents (fixed versions in code)

| Agent | Foundry version |
|-------|-----------------|
| ContractAgent | 4 |
| BlueprintAgent | 3 |
| PermitAgent | 3 |
| ScheduleAgent | 2 |
| SupplierAgent | 3 |
| CrewAgent | 2 |

### Master catalog CRUD

| Method | Path |
|--------|------|
| `GET/POST` | `/api/suppliers` |
| `GET/POST` | `/api/suppliers/{id}/materials` |
| `GET/POST` | `/api/crew` |

Seed catalogs:

```bash
python scripts/seed_supplier_master.py
python scripts/seed_crew_master.py
```

## Agent extraction samples

Realistic test inputs and field-by-field extraction reference:

```
backend/docs/samples/
  sample_contract.txt / .pdf      Mode 2 contract
  sample_blueprint_spec.txt / .pdf Mode 2 blueprint
  sample_mode1_description.txt      Mode 1 text paste
  expected_pipeline_output.example.json
  AGENT_EXTRACTION_REFERENCE.md   Full extraction guide
```

Build PDFs from text samples:

```bash
python scripts/build_sample_pdfs.py
```

## Documentation (PDF)

Detailed backend documentation is available at:

`backend/docs/ConstructaIQ-Backend-Documentation.pdf`

Regenerate after major changes:

```bash
python scripts/generate_backend_docs_pdf.py
```

## Postman

Import both files from `backend/postman/`:

- `ConstructaIQ.postman_collection.json` — all API requests
- `ConstructaIQ-Local.postman_environment.json` — `baseUrl`, `projectId`, `jobId` variables

`projectId` and `jobId` are auto-captured when you run Create Project, Upload, or Start Analyze.

Recommended test flow: **Create Project** → **Start Analyze** → **Poll Analyze Status** → **Get Summary**.

For synchronous analyze requests, set Postman request timeout to **180 seconds** or more.

## Testing

Unit tests:

```bash
pytest tests/
```

Project API flow (DB required, no live Foundry):

```bash
python scripts/e2e_project_flow_test.py
# or
python verify_backend.py
```

Full Foundry pipeline (live agents, ~2 min):

```bash
python scripts/e2e_backend_test.py
```

Mode 2 document pipeline (Document Intelligence + Foundry):

```bash
python scripts/e2e_mode2_documents.py
```

Optional live analyze in project flow:

```bash
set RUN_LIVE_ANALYZE=1
python scripts/e2e_project_flow_test.py
```
