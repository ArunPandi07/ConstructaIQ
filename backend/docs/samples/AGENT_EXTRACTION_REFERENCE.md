# ConstructaIQ — Agent Extraction Sample Pack

This folder contains **realistic sample inputs** and a **field-by-field extraction reference** for the current ConstructaIQ backend pipeline.

## Files in this pack

| File | Purpose |
|------|---------|
| `sample_contract.txt` | Mode 2 contract PDF content (save/print as PDF) |
| `sample_blueprint_spec.txt` | Mode 2 blueprint PDF content |
| `sample_mode1_description.txt` | Mode 1 text-only project description |
| `expected_pipeline_output.example.json` | Illustrative JSON output shape |
| `AGENT_EXTRACTION_REFERENCE.md` | This guide |

---

## Sample project scenario

**Project:** Lakefront Mixed-Use Tower — Phase 1  
**Location:** Chicago, IL  
**Client:** Lakefront Development Partners, LLC  
**GC:** Meridian Build Group, Inc.  
**Value:** $186.5M | **Duration:** 28 months | **Floors:** 42 | **GSF:** 1,250,000

All three input files describe the **same project** so agents receive consistent context in Mode 1 (text) or Mode 2 (contract + blueprint PDFs).

---

## Pipeline overview

```
INPUT
  Mode 1: project_name + description (text)
  Mode 2: contract PDF + blueprint PDF (Document Intelligence → text)

AGENTS (fixed Foundry versions in analyze_orchestrator.py)
  ContractAgent (v4) → BlueprintAgent (v3) → PermitAgent (v3)
    → ScheduleAgent (v2) → SupplierAgent (v3) → CrewAgent (v2)

OUTPUT
  camelCase JSON blob + optional persistenceSummary

PERSISTENCE (when project_id + DATABASE_URL)
  projects, permits, schedules, budgets, inspections,
  project_suppliers, crew_plans, project_risks, agent_executions
```

---

## Per-agent extraction reference

### 1. ContractAgent

**Input:** Project description or contract document text  
**Prompt goal:** Extract project parameters from contract/description  

**Foundry output keys (Azure AI Foundry ContractAgent):**

The deployed agent may return mixed-case keys. The backend normalizes these automatically via `agent_field_mapper.normalize_contract_agent()`:

| Foundry key | Canonical key | Example |
|-------------|---------------|---------|
| `project_name` | `project_name` | Chennai Business Tower |
| `client_name`, `client` | `client_name` | Lakefront Development Partners |
| `budget`, `budget_usd` | `budget` | ₹85 Crores or `186500000` |
| `Projecttype`, `building_type`, `type` | `project_type` | Commercial Office Building |
| `location` | `location` | OMR, Chennai, Tamil Nadu, India |
| `startdate` | `start_date` | 01 January 2027 |
| `completiondate` | `target_completion_date` | 30 June 2028 |
| `duration_months`, `schedule_months` | `duration_months` | 18 or 28 |
| `scope` | `scope` | Design, construct, and deliver... |
| `Milestones` | `milestones` | `[{Milestone, Duration}, ...]` |
| `gross_square_feet`, `gross_square_footage` | `square_footage` | 1250000 |
| `number_of_floors`, `floors` | `floor_count` | 42 |

Milestone items are normalized to `{name, duration}` while preserving original keys in the stored JSON.

**Parsing on persist:**

| Value type | Parser | Example |
|------------|--------|---------|
| Indian budget | `_parse_decimal` | ₹85 Crores → 850000000 |
| Prose date | `_parse_date` | 01 January 2027 → 2027-01-01 |
| String months | `_parse_int` | "18" → 18 |

**DB column mapping (`projects`):**

| Canonical field | DB column |
|-----------------|-----------|
| `project_name` | `project_name` |
| `client_name` | `client_name` |
| `location` | `location` |
| `project_type` | `project_type` |
| `budget` | `contract_value` |
| `duration_months` | `duration_months` |
| `start_date` | `start_date` |
| `target_completion_date` | `target_completion_date` |
| `scope` | `scope` |
| `milestones` | `milestones` (JSON text) |
| `square_footage` | `square_footage` |
| `floor_count` | `floor_count` |
| `complexity_level` | `complexity_level` |

**Orchestrator key:** `projectSummary` (built via `build_project_summary()` — contract fields win; BlueprintAgent fills gaps)

---

### 2. BlueprintAgent

**Input:** Blueprint document text or inferred from description (Mode 1)  
**Prompt goal:** Infer building and structural details  

**Live Foundry keys (also mapped via `normalize_blueprint_agent()` for projectSummary fallback):**

| Foundry key | Canonical key | Example |
|-------------|---------------|---------|
| `client` | `client_name` | Lakefront Development Partners |
| `budget_usd` | `budget` | 186500000 |
| `schedule_months` | `duration_months` | 28 |
| `floors` | `floor_count` | 42 |
| `type` | `project_type` | Mixed-use commercial tower |
| `gross_square_footage` | `square_footage` | 1250000 |
| `likely_structural_details` | (API only) | core, floor_system, lateral_load_system |
| `building_features` | (API only) | string list |

**Orchestrator key:** `blueprintSummary`  
**DB:** Contributes to `projects` only when ContractAgent omits a field (merge in `build_project_summary`)

---

### 3. PermitAgent (version 3)

**Input:** Contract JSON + Blueprint JSON  
**Prompt goal:** Assess permit and regulatory requirements  

**Live Foundry output (normalized by `normalize_permit_agent()`):**

| Field | Live shape | Persisted as |
|-------|------------|--------------|
| `required_permits` | **string array** or object array | `permits.permit_name` |
| `approval_days` | int (top-level) | `permits.estimated_approval_days` on each row |
| `compliance_risks` | string array | API response only |
| `required_documents` | string array | `permits.required_documents` JSON when coerced |

String permits are coerced to `{name, status: "required", estimated_approval_days}` before DB insert.

**Orchestrator key:** `permitAssessment`  
**DB table:** `permits` (replace-on-rerun per project)

---

### 4. ScheduleAgent (Foundry version 2)

**Input:** Contract + Blueprint + Permit JSON  
**Prompt goal:** Generate execution plan  

**Required output keys:**

| Key | Purpose | DB mapping |
|-----|---------|------------|
| `project_phases[]` | Named phases with timelines | `schedules.phase_breakdown` |
| `estimated_duration_days` | Total duration | `schedules.total_duration_days` |
| `materials[]` | Material takeoff list | `schedules.work_packages.materials` |
| `crew_requirements[]` | Workforce by trade | Feeds CrewAgent |
| `inspection_stages[]` | Mandatory inspections | `inspections` rows |
| `dependencies[]` | Phase/task dependencies | `schedules.work_packages.dependencies` |

`work_packages` is stored as JSON: `{"dependencies": [...], "materials": [...]}`. Legacy rows may be a flat array (dependencies or materials only).

**Orchestrator key:** `projectPlan`  
**DB tables:** `schedules`, `inspections`  
**Summary API:** `GET /projects/{id}/summary` → `intelligence.phases`, `dependencies`, `materials`, `criticalPathPhases`, `inspections`

---

### 5. SupplierAgent

**Input:** Schedule JSON + **supplier_master / supplier_materials catalog from DB**  
**Prompt goal:** Match materials to catalog; produce procurement plan  

**Required output keys:**

| Key | Fields per row | DB table |
|-----|----------------|----------|
| `procurement_plan[]` | `material_name`, `supplier_name`, `quantity`, `unit_price`, `delivery_date`, `total_cost` | `project_suppliers` |
| `supply_chain_risks[]` | risk, severity, mitigation | `project_risks` (`category=supply_chain`) |
| `recommended_suppliers[]` | supplier, rationale | (not persisted) |

**Orchestrator key:** `supplierAnalysis`  
**Note:** Run `python scripts/bootstrap.py` (or individual seed scripts) for catalog data.

---

### 6. CrewAgent

**Input:** Schedule JSON + **crew_master catalog from DB**  
**Prompt goal:** Allocate crew to phases  

**Required output keys:**

| Key | Fields per row | DB table |
|-----|----------------|----------|
| `crew_allocations[]` | `phase_name`, `crew_name`, `skill_type`, `labor_cost`, `start_date`, `end_date` | `crew_plans` |
| `workforce_gaps[]` | role, shortage | `project_risks` (`category=workforce`) |
| `recommendations[]` | text | (not persisted) |

**Date formats supported in persistence:**
- ISO: `2026-08-01`
- Relative: `Month 4` (offset from `projects.start_date`)

**Orchestrator key:** `crewAnalysis`  
**Note:** Run `python scripts/seed_crew_master.py` for catalog data.

---

## How to test with samples

### Mode 1 — Text only (fastest)

```bash
# Postman or curl — form-data
POST http://localhost:8000/api/v1/analyze/text

project_name = Lakefront Mixed-Use Tower — Phase 1
description  = <paste from sample_mode1_description.txt>
project_id   = <optional, for DB persistence>
```

### Mode 2 — Documents

1. Open `sample_contract.txt` and `sample_blueprint_spec.txt`
2. Print or export each as **PDF** (Word → Save as PDF, or any PDF printer)
3. Postman → **Upload Project PDFs** or **Analyze Documents (Mode 2)**

```bash
POST http://localhost:8000/api/v1/projects/upload
  project_name = Lakefront Mixed-Use Tower — Phase 1
  contract     = <sample_contract.pdf>
  blueprint    = <sample_blueprint_spec.pdf>

POST http://localhost:8000/api/v1/projects/{id}/analyze
  { "description": "..." }
```

### Full project lifecycle

```
1. POST /api/v1/projects          (or /upload with PDFs)
2. POST /api/v1/projects/{id}/analyze   → 202 + job_id
3. GET  /api/v1/projects/{id}/analyze/status   (poll until complete)
4. GET  /api/v1/projects/{id}/summary
5. Query DB: projects, permits, schedules, project_suppliers, crew_plans
```

---

## What fills the `projects` table

| When | Fields populated |
|------|------------------|
| `POST /projects` | Only fields you send in JSON body |
| `POST /projects/upload` | `project_name`, `status=uploaded`, documents linked |
| **After analyze completes** | `client_name`, `contract_value`, `duration_months`, `scope`, `location`, `floor_count`, etc. from `projectSummary` |

A row with only `project_name` + `scope` means **create ran but analyze did not finish** (or was never started).

---

## Budget persistence logic

| Column | Source |
|--------|--------|
| `total_budget` | `projectSummary.budget` |
| `material_cost` | Sum of `procurement_plan[].total_cost` |
| `labor_cost` | Sum of `crew_allocations[].labor_cost` |

---

## Tips for reliable extraction

1. **Include explicit numbers** in input (budget, months, floors, SF, tons, CY).
2. **Name parties clearly** (Owner/Client, GC, location with city/state).
3. **List permits and inspections** in contract/blueprint — PermitAgent and ScheduleAgent use them.
4. **Seed catalogs** before testing Supplier/Crew agents.
5. **Use `project_id` + DATABASE_URL** to verify persistence, not just raw JSON response.

---

## Related documentation

- API PDF: `backend/docs/ConstructaIQ-Backend-Documentation.pdf`
- Postman: `backend/postman/ConstructaIQ.postman_collection.json`
- Regenerate API PDF: `python scripts/generate_backend_docs_pdf.py`
