# ConstructaIQ - AI-Powered Construction Intelligence Platform

> **Azure AI Fest Hackathon Entry** | Team Technorucs

ConstructaIQ transforms construction project management by leveraging a 6-agent AI pipeline to extract, analyze, and visualize project intelligence from contract and blueprint documents. Upload your construction documents, and within minutes receive comprehensive permit assessments, schedule plans, supplier recommendations, crew allocations, risk analysis, and an interactive 3D building model.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Architecture](#architecture)
- [6-Agent AI Pipeline](#6-agent-ai-pipeline)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Azure Services Integration](#azure-services-integration)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Team](#team)

---

## Problem Statement

Construction project planning is a complex, time-consuming process involving multiple stakeholders, extensive documentation review, and cross-functional coordination. Project managers spend weeks manually extracting information from contracts and blueprints to:

- Identify required permits and estimate approval timelines
- Create construction schedules with material dependencies
- Source suppliers and assess supply chain risks
- Plan crew allocations across project phases
- Assess workforce gaps and compliance requirements

**ConstructaIQ automates this entire workflow** using Azure AI services, reducing weeks of planning to minutes of intelligent analysis.

---

## Solution Overview

ConstructaIQ provides an end-to-end construction intelligence platform that:

1. **Ingests** construction contract PDFs and architectural blueprint PDFs
2. **Extracts** text and structural data using Azure Document Intelligence
3. **Analyzes** documents through a 6-agent AI pipeline powered by Azure AI Foundry
4. **Persists** structured intelligence to Azure SQL Database
5. **Visualizes** results through an interactive React dashboard with 3D building models
6. **Reports** consolidated findings via email using Azure Communication Services

---

## Architecture

```
                                    +---------------------------+
                                    |    React Frontend (SPA)   |
                                    |  Three.js 3D | Gantt      |
                                    |  framer-motion animations |
                                    +-------------+-------------+
                                                  |
                                          REST API (HTTPS)
                                                  |
                                    +-------------v-------------+
                                    |   FastAPI Backend (Async)  |
                                    |   JWT Auth | CORS          |
                                    +-------------+-------------+
                                                  |
                    +-----------------------------+-----------------------------+
                    |                             |                             |
      +-------------v---------+    +-------------v---------+    +--------------v--------+
      | Azure Document        |    | Azure AI Foundry      |    | Azure SQL Database    |
      | Intelligence          |    | (6-Agent Pipeline)    |    | (13 Tables)           |
      | PDF Text Extraction   |    | GPT-4o Agents         |    | Async SQLAlchemy      |
      +-------------+---------+    +-------------+---------+    +--------------+--------+
                    |                             |                             |
      +-------------v---------+    +-------------v---------+    +--------------v--------+
      | Azure Blob Storage    |    | Agent Orchestrator    |    | Azure Communication   |
      | Document Persistence  |    | Parallel Execution    |    | Services (Email)      |
      | SAS Token Access      |    | Field Normalization   |    | Report Delivery       |
      +---+-------------------+    +---+-------------------+    +---+-------------------+
```

---

## 6-Agent AI Pipeline

The core intelligence engine consists of 6 specialized Azure AI Foundry agents that execute in a staged pipeline:

### Stage 1 - Document Analysis (Parallel)

| Agent | Version | Input | Output |
|-------|---------|-------|--------|
| **ContractAgent** | v4 | Contract PDF text | Project scope, budget, client, milestones, duration, location |
| **BlueprintAgent** | v5 | Blueprint PDF text | Construction type, structural system, MEP specs, material quantities, 3D building definition |

### Stage 2 - Regulatory & Planning (Sequential)

| Agent | Version | Input | Output |
|-------|---------|-------|--------|
| **PermitAgent** | v3 | Contract + Blueprint data | Required permits, categories, approval timelines, critical path impact |
| **ScheduleAgent** | v2 | Contract + Blueprint + Permits | Project phases, durations, materials, inspection stages, dependencies |

### Stage 3 - Procurement & Workforce (Parallel)

| Agent | Version | Input | Output |
|-------|---------|-------|--------|
| **SupplierAgent** | v3 | Schedule + Supplier catalog | Procurement plan, delivery dates, supply chain risks, recommended suppliers |
| **CrewAgent** | v2 | Schedule + Crew catalog | Crew allocations by phase, workforce gaps, labor cost estimates |

### Pipeline Output Structure

```json
{
  "projectSummary": {
    "project_name": "Aurora Tower",
    "client_name": "Lakefront Development Partners",
    "budget": 186500000,
    "duration_months": 28,
    "floor_count": 42,
    "square_footage": 1250000
  },
  "blueprintSummary": {
    "construction_type": "Type I-A",
    "stories_above_grade": 42,
    "structural_steel_tons": 14200,
    "building_definition": { /* 3D model JSON */ }
  },
  "permitAssessment": {
    "required_permits": [
      { "name": "Building Permit", "category": "Municipal", "estimated_approval_days": 45 }
    ]
  },
  "projectPlan": {
    "phases": [...],
    "materials": [...],
    "inspection_stages": [...],
    "dependencies": [...]
  },
  "supplierAnalysis": {
    "procurement_plan": [...],
    "supply_chain_risks": [...]
  },
  "crewAnalysis": {
    "crew_allocations": [...],
    "workforce_gaps": [...]
  }
}
```

---

## Key Features

### Intelligent Document Processing
- Upload construction contracts and architectural blueprints (PDF)
- Azure Document Intelligence extracts structured text
- Automatic field normalization handles varied LLM output formats

### Interactive Dashboard
- Real-time KPIs: active projects, total budget, open risks, AI token usage
- Risk distribution visualization
- Recent activity feed with agent execution history
- Stagger-animated cards with loading skeletons

### Project Intelligence Views
- **Budget Breakdown** - Material, labor, equipment, contingency cost analysis
- **Schedule & Gantt** - Phase timeline with crew allocation overlay
- **Materials Procurement** - Quantities, suppliers, delivery dates, unit costs
- **Inspection Checklist** - Phase-by-phase compliance tracking
- **Risk Analysis** - Supply chain and workforce gap identification
- **Permit Tracker** - Approval timelines with critical path flagging
- **AI Recommendations** - Prioritized action items from all agents

### 3D Building Visualization
- Interactive Three.js rendering from `building_definition` JSON
- Multi-level floor rendering with rooms, walls, doors, windows
- Curtain wall and facade systems
- Stair cores and elevator shafts
- Multi-angle snapshot capture for preview carousel
- Camera controls with orbit, pan, zoom

### Agent Execution Insights
- Pipeline execution timeline with per-agent status
- Token usage tracking and cost visibility
- Execution audit trail (started_at, completed_at, errors)
- Agent version history

### Email Intelligence Reports
- Consolidated HTML reports with project intelligence summary
- Delivery via Azure Communication Services
- User opt-in control from profile settings
- Rate limiting and delivery tracking (queued/sent/failed)

### Authentication & User Management
- JWT-based authentication with bcrypt password hashing
- User registration and profile management
- Role-based access (created_by project ownership)
- Email preference controls

---

## Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| React 19 + TypeScript | UI framework |
| Vite 8 | Build tooling & HMR |
| Tailwind CSS 4 | Utility-first styling |
| Three.js + React Three Fiber | 3D building visualization |
| Framer Motion | Page transitions & animations |
| gantt-task-react | Gantt chart scheduling |
| Zustand | State management |
| Lucide React | Icon system |
| Vitest + Testing Library | Unit testing |

### Backend

| Technology | Purpose |
|-----------|---------|
| FastAPI | Async REST API framework |
| Python 3.11 | Runtime |
| SQLAlchemy 2.0 (async) | ORM with async support |
| Pydantic v2 | Request/response validation |
| Alembic | Database migrations |
| python-jose + passlib | JWT authentication |
| aioodbc + pyodbc | MSSQL async ODBC driver |
| httpx (async) | Agent API calls |
| uvicorn | ASGI server |

### Azure Services

| Service | Purpose |
|---------|---------|
| Azure AI Foundry | 6-agent GPT-4o pipeline |
| Azure Document Intelligence | PDF text extraction |
| Azure SQL Database | Persistent storage (13 tables) |
| Azure Blob Storage | Document file storage with SAS |
| Azure Communication Services | Email report delivery |

---

## Azure Services Integration

### Azure AI Foundry (Core Intelligence)

The 6-agent pipeline runs on Azure AI Foundry with GPT-4o model endpoints. Each agent receives structured prompts with context from previous stages and returns JSON-only responses.

```
AZURE_AIFOUNDRY_ENDPOINT=https://<resource>.services.ai.azure.com
AZURE_AIFOUNDRY_KEY=<api-key>
```

### Azure Document Intelligence

Extracts text from uploaded PDF documents using the prebuilt-read model, enabling the agents to analyze contract and blueprint content.

```
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://<resource>.cognitiveservices.azure.com
AZURE_DOCUMENT_INTELLIGENCE_KEY=<api-key>
```

### Azure SQL Database

Stores all project intelligence, agent executions, user data, and catalog information across 13 normalized tables with async ODBC connectivity.

```
DATABASE_URL=mssql+aioodbc://user:pass@server.database.windows.net:1433/db?driver=ODBC+Driver+18+for+SQL+Server&encrypt=yes
```

### Azure Blob Storage

Persists uploaded PDF documents with time-limited SAS token access for secure Document Intelligence processing.

```
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER_NAME=constructaiq-documents
```

### Azure Communication Services

Delivers consolidated intelligence reports via email after pipeline completion.

```
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://<resource>.communication.azure.com/;accesskey=...
AZURE_COMMUNICATION_EMAIL_FROM=DoNotReply@<verified-domain>
```

---

## Database Schema

13 tables organized across 4 domains:

### Core Entities
| Table | Purpose |
|-------|---------|
| `users` | User accounts with auth and email preferences |
| `projects` | Project metadata, scope, dates, financials |
| `documents` | Uploaded PDFs with blob URLs and extracted text |

### Agent Intelligence
| Table | Purpose |
|-------|---------|
| `agent_executions` | Audit trail of all agent runs (timing, tokens, output) |
| `permits` | Extracted permit requirements with approval timelines |
| `schedules` | Phase breakdowns, work packages, dependencies |
| `budgets` | Cost breakdowns (material, labor, equipment, contingency) |
| `inspections` | Phase-by-phase inspection checklist items |
| `project_risks` | Supply chain and workforce risks with severity |
| `project_suppliers` | Procurement plan rows (material, supplier, cost, date) |
| `crew_plans` | Crew allocations by phase (headcount, skill, dates, cost) |

### Reference Catalogs
| Table | Purpose |
|-------|---------|
| `supplier_master` | Supplier directory (codes, categories, reliability scores) |
| `crew_master` | Workforce directory (skills, certifications, daily rates) |

### Reporting
| Table | Purpose |
|-------|---------|
| `report_deliveries` | Email report tracking (status, timestamps, recipient) |

---

## API Endpoints

### Authentication
```
POST   /api/auth/register          Create user account
POST   /api/auth/login             Get JWT token
GET    /api/auth/me                Current user profile
PUT    /api/auth/me                Update profile
```

### Projects & Analysis
```
GET    /api/projects               List projects
POST   /api/projects               Create project (JSON)
POST   /api/projects/upload        Upload with PDFs (multipart)
POST   /api/projects/{id}/analyze  Start 6-agent pipeline (async)
GET    /api/projects/{id}/analyze/status   Poll job progress
GET    /api/projects/{id}/summary  Full intelligence view
GET    /api/projects/{id}/suppliers  Procurement data
GET    /api/projects/{id}/crew     Crew allocation data
GET    /api/projects/{id}/agents   Agent execution history
```

### Reporting
```
POST   /api/projects/{id}/report/email      Send email report
GET    /api/projects/{id}/report/deliveries  Delivery history
```

### Dashboard
```
GET    /api/dashboard              KPIs, risks, activities
```

### Catalogs
```
GET    /api/suppliers              Supplier master list
GET    /api/crew                   Crew master list
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- ODBC Driver 18 for SQL Server
- Azure subscription with:
  - AI Foundry resource (GPT-4o deployment)
  - Document Intelligence resource
  - SQL Database instance
  - Storage Account (optional)
  - Communication Services (optional)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Azure credentials

# Run database migrations
alembic upgrade head

# Seed reference data (optional)
python -m scripts.seed_fresh_database --confirm
python -m scripts.seed_admin_user

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL
echo "VITE_API_BASE_URL=http://localhost:8000" > .env

# Start dev server
npm run dev
```

### Environment Variables

```env
# Azure AI Foundry (Required)
AZURE_AIFOUNDRY_ENDPOINT=https://<resource>.services.ai.azure.com
AZURE_AIFOUNDRY_KEY=<key>

# Azure Document Intelligence (Required for PDF mode)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://<resource>.cognitiveservices.azure.com
AZURE_DOCUMENT_INTELLIGENCE_KEY=<key>

# Azure SQL Database (Required for persistence)
DATABASE_URL=mssql+aioodbc://<user>:<password>@<server>.database.windows.net:1433/<db>?driver=ODBC+Driver+18+for+SQL+Server&encrypt=yes&TrustServerCertificate=no

# Azure Blob Storage (Optional)
AZURE_STORAGE_CONNECTION_STRING=<connection-string>
AZURE_STORAGE_CONTAINER_NAME=constructaiq-documents

# Azure Communication Services (Optional - for email reports)
AZURE_COMMUNICATION_CONNECTION_STRING=<connection-string>
AZURE_COMMUNICATION_EMAIL_FROM=DoNotReply@<verified-domain>
REPORT_EMAIL_ENABLED=true

# Authentication
JWT_SECRET_KEY=<random-secret>
```

---

## Project Structure

```
ConstructaIQ/
├── backend/
│   ├── app/
│   │   ├── api/                    # Route handlers
│   │   │   ├── auth.py             # Authentication endpoints
│   │   │   ├── projects.py         # Project CRUD & analysis
│   │   │   ├── dashboard.py        # KPI aggregation
│   │   │   └── catalogs.py         # Supplier/crew catalogs
│   │   ├── orchestrator/
│   │   │   └── analyze_orchestrator.py  # 6-agent pipeline
│   │   ├── services/
│   │   │   ├── foundry_service.py       # Azure AI Foundry client
│   │   │   ├── document_intelligence.py # PDF extraction
│   │   │   ├── blob_storage_service.py  # Azure Blob operations
│   │   │   ├── agent_persistence_service.py  # Save agent outputs
│   │   │   ├── agent_field_mapper.py    # Output normalization
│   │   │   ├── project_service.py       # Business logic
│   │   │   ├── building_templates.py    # 3D model generation
│   │   │   ├── report_builder_service.py    # Report generation
│   │   │   ├── report_delivery_service.py   # Email orchestration
│   │   │   └── acs_email_service.py     # ACS email client
│   │   ├── db/
│   │   │   ├── models/             # SQLAlchemy ORM (13 models)
│   │   │   ├── repositories/       # Async data access layer
│   │   │   └── engine.py           # Connection management
│   │   ├── schemas/                # Pydantic DTOs
│   │   ├── config/settings.py      # Environment config
│   │   └── main.py                 # FastAPI app setup
│   ├── alembic/                    # Database migrations
│   ├── scripts/                    # Seed & utility scripts
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/                  # Route pages
│   │   │   ├── Dashboard.tsx       # KPI overview
│   │   │   ├── Projects.tsx        # Project listing
│   │   │   ├── ProjectDetails.tsx  # Multi-tab intelligence
│   │   │   ├── AIInsights.tsx      # Agent execution viewer
│   │   │   └── Login.tsx           # Authentication
│   │   ├── components/
│   │   │   ├── building3d/         # Three.js 3D rendering
│   │   │   ├── agentInsights/      # Agent execution UI
│   │   │   ├── Blueprint3DTab.tsx  # 3D visualization tab
│   │   │   ├── CrewPlanGantt.tsx   # Gantt scheduling
│   │   │   ├── MaterialsPanel.tsx  # Procurement view
│   │   │   └── ...                 # Other domain panels
│   │   ├── context/                # React contexts
│   │   ├── hooks/                  # Custom hooks
│   │   ├── services/               # API client layer
│   │   └── types/                  # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
├── render.yaml                     # Render.com deployment
└── README.md
```

---

## Deployment

### Docker

```bash
docker build -t constructaiq-backend ./backend
docker run -p 8000:8000 --env-file backend/.env constructaiq-backend
```

### Render.com

The project includes `render.yaml` for one-click deployment:

- **Backend**: Docker web service (Python + ODBC Driver 18)
- **Frontend**: Static site (Vite build output)
- **Region**: Singapore
- **Health Check**: `/healthz`

### Production Considerations

- Set `JWT_SECRET_KEY` to a strong random value
- Enable HTTPS-only in production
- Configure CORS origins to your frontend domain
- Set `REPORT_EMAIL_ENABLED=true` only with verified ACS sender domain
- Use Azure SQL firewall rules to restrict access
- Enable Blob Storage access logging

---

## Demo Credentials

After running seed scripts:

```
Email:    admin@constructaiq.com
Password: admin123
```

---

## Team

**Team Technorucs** - Azure AI Fest Hackathon 2026

---

## License

This project was built for the Azure AI Fest Hackathon. All rights reserved.
