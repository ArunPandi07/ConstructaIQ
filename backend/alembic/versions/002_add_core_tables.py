"""add core tables

Revision ID: 002_add_core_tables
Revises: 001_baseline
Create Date: 2026-06-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002_add_core_tables"
down_revision: Union[str, None] = "001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def _created_at() -> sa.Column:
    return sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("SYSUTCDATETIME()"),
        nullable=False,
    )


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("project_id", sa.BigInteger(), sa.Identity(always=False), primary_key=True),
        sa.Column("project_name", sa.String(length=255), nullable=False),
        sa.Column("project_type", sa.String(length=100), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("client_name", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("target_completion_date", sa.Date(), nullable=True),
        sa.Column("contract_value", sa.Numeric(18, 2), nullable=True),
        sa.Column("duration_months", sa.Integer(), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column("milestones", sa.Text(), nullable=True),
        sa.Column("square_footage", sa.Numeric(18, 4), nullable=True),
        sa.Column("floor_count", sa.Integer(), nullable=True),
        sa.Column("complexity_level", sa.String(length=50), nullable=True),
        sa.Column("priority_score", sa.Integer(), nullable=True),
    )

    op.create_table(
        "supplier_master",
        sa.Column("supplier_id", sa.BigInteger(), sa.Identity(always=False), primary_key=True),
        sa.Column("supplier_code", sa.String(length=50), nullable=False),
        sa.Column("supplier_name", sa.String(length=255), nullable=True),
        sa.Column("supplier_category", sa.String(length=100), nullable=True),
        sa.Column("contact_person", sa.String(length=255), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("lead_time_days", sa.Integer(), nullable=True),
        sa.Column("reliability_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("preferred_supplier", sa.Boolean(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        _created_at(),
    )
    op.create_index("ix_supplier_master_supplier_code", "supplier_master", ["supplier_code"], unique=True)

    op.create_table(
        "crew_master",
        sa.Column("crew_id", sa.BigInteger(), sa.Identity(always=False), primary_key=True),
        sa.Column("employee_code", sa.String(length=50), nullable=False),
        sa.Column("employee_name", sa.String(length=255), nullable=True),
        sa.Column("skill_type", sa.String(length=100), nullable=True),
        sa.Column("experience_years", sa.Integer(), nullable=True),
        sa.Column("daily_rate", sa.Numeric(18, 2), nullable=True),
        sa.Column("availability_status", sa.String(length=50), nullable=True),
        sa.Column("certification", sa.String(length=255), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        _created_at(),
    )
    op.create_index("ix_crew_master_employee_code", "crew_master", ["employee_code"], unique=True)

    op.create_table(
        "documents",
        sa.Column("document_id", sa.BigInteger(), sa.Identity(always=False), primary_key=True),
        sa.Column("project_id", sa.BigInteger(), nullable=False),
        sa.Column("document_type", sa.String(length=100), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=True),
        sa.Column("blob_url", sa.String(length=2048), nullable=True),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("uploaded_by", sa.String(length=255), nullable=True),
        _created_at(),
        sa.ForeignKeyConstraint(["project_id"], ["projects.project_id"]),
    )
    op.create_index("ix_documents_project_id", "documents", ["project_id"])

    op.create_table(
        "agent_executions",
        sa.Column("execution_id", sa.BigInteger(), sa.Identity(always=False), primary_key=True),
        sa.Column("project_id", sa.BigInteger(), nullable=False),
        sa.Column("agent_name", sa.String(length=100), nullable=True),
        sa.Column("agent_version", sa.String(length=50), nullable=True),
        sa.Column("run_id", sa.String(length=255), nullable=True),
        sa.Column("thread_id", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("tokens_used", sa.Integer(), nullable=True),
        sa.Column("output_json", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        _created_at(),
        sa.ForeignKeyConstraint(["project_id"], ["projects.project_id"]),
    )
    op.create_index("ix_agent_executions_project_id", "agent_executions", ["project_id"])

    op.create_table(
        "permits",
        sa.Column("permit_id", sa.BigInteger(), sa.Identity(always=False), primary_key=True),
        sa.Column("project_id", sa.BigInteger(), nullable=False),
        sa.Column("permit_name", sa.String(length=255), nullable=True),
        sa.Column("permit_category", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("estimated_approval_days", sa.Integer(), nullable=True),
        sa.Column("application_reference", sa.String(length=255), nullable=True),
        sa.Column("required_documents", sa.Text(), nullable=True),
        sa.Column("critical_path_impact", sa.Boolean(), nullable=True),
        _created_at(),
        sa.ForeignKeyConstraint(["project_id"], ["projects.project_id"]),
    )
    op.create_index("ix_permits_project_id", "permits", ["project_id"])

    op.create_table(
        "schedules",
        sa.Column("schedule_id", sa.BigInteger(), sa.Identity(always=False), primary_key=True),
        sa.Column("project_id", sa.BigInteger(), nullable=False),
        sa.Column("total_duration_days", sa.Integer(), nullable=True),
        sa.Column("phase_breakdown", sa.Text(), nullable=True),
        sa.Column("work_packages", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.project_id"]),
    )
    op.create_index("ix_schedules_project_id", "schedules", ["project_id"])

    op.create_table(
        "project_suppliers",
        sa.Column("supplier_record_id", sa.BigInteger(), sa.Identity(always=False), primary_key=True),
        sa.Column("project_id", sa.BigInteger(), nullable=False),
        sa.Column("material_name", sa.String(length=255), nullable=True),
        sa.Column("supplier_name", sa.String(length=255), nullable=True),
        sa.Column("quantity", sa.Numeric(18, 4), nullable=True),
        sa.Column("unit_price", sa.Numeric(18, 2), nullable=True),
        sa.Column("delivery_date", sa.Date(), nullable=True),
        sa.Column("total_cost", sa.Numeric(18, 2), nullable=True),
        _created_at(),
        sa.ForeignKeyConstraint(["project_id"], ["projects.project_id"]),
    )
    op.create_index("ix_project_suppliers_project_id", "project_suppliers", ["project_id"])

    op.create_table(
        "crew_plans",
        sa.Column("crew_plan_id", sa.BigInteger(), sa.Identity(always=False), primary_key=True),
        sa.Column("project_id", sa.BigInteger(), nullable=False),
        sa.Column("phase_name", sa.String(length=255), nullable=True),
        sa.Column("crew_name", sa.String(length=255), nullable=True),
        sa.Column("labor_cost", sa.Numeric(18, 2), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        _created_at(),
        sa.ForeignKeyConstraint(["project_id"], ["projects.project_id"]),
    )
    op.create_index("ix_crew_plans_project_id", "crew_plans", ["project_id"])

    op.create_table(
        "inspections",
        sa.Column("inspection_id", sa.BigInteger(), sa.Identity(always=False), primary_key=True),
        sa.Column("project_id", sa.BigInteger(), nullable=False),
        sa.Column("inspection_name", sa.String(length=255), nullable=True),
        sa.Column("inspection_phase", sa.String(length=100), nullable=True),
        sa.Column("inspection_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        _created_at(),
        sa.ForeignKeyConstraint(["project_id"], ["projects.project_id"]),
    )
    op.create_index("ix_inspections_project_id", "inspections", ["project_id"])

    op.create_table(
        "budgets",
        sa.Column("budget_id", sa.BigInteger(), sa.Identity(always=False), primary_key=True),
        sa.Column("project_id", sa.BigInteger(), nullable=False),
        sa.Column("total_budget", sa.Numeric(18, 2), nullable=True),
        sa.Column("material_cost", sa.Numeric(18, 2), nullable=True),
        sa.Column("labor_cost", sa.Numeric(18, 2), nullable=True),
        sa.Column("equipment_cost", sa.Numeric(18, 2), nullable=True),
        sa.Column("contingency_cost", sa.Numeric(18, 2), nullable=True),
        _created_at(),
        sa.ForeignKeyConstraint(["project_id"], ["projects.project_id"]),
    )
    op.create_index("ix_budgets_project_id", "budgets", ["project_id"])

    op.create_table(
        "supplier_materials",
        sa.Column("supplier_material_id", sa.BigInteger(), sa.Identity(always=False), primary_key=True),
        sa.Column("supplier_id", sa.BigInteger(), nullable=False),
        sa.Column("material_name", sa.String(length=255), nullable=True),
        sa.Column("material_category", sa.String(length=100), nullable=True),
        sa.Column("unit_price", sa.Numeric(18, 2), nullable=True),
        sa.Column("currency_code", sa.String(length=10), nullable=True),
        sa.Column("moq", sa.Integer(), nullable=True),
        sa.Column("lead_time_days", sa.Integer(), nullable=True),
        _created_at(),
        sa.ForeignKeyConstraint(["supplier_id"], ["supplier_master.supplier_id"]),
    )
    op.create_index("ix_supplier_materials_supplier_id", "supplier_materials", ["supplier_id"])


def downgrade() -> None:
    op.drop_table("supplier_materials")
    op.drop_table("budgets")
    op.drop_table("inspections")
    op.drop_table("crew_plans")
    op.drop_table("project_suppliers")
    op.drop_table("schedules")
    op.drop_table("permits")
    op.drop_table("agent_executions")
    op.drop_table("documents")
    op.drop_table("crew_master")
    op.drop_table("supplier_master")
    op.drop_table("projects")
