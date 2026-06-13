"""add project_risks table

Revision ID: 003_add_project_risks
Revises: 002_add_core_tables
Create Date: 2026-06-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "003_add_project_risks"
down_revision: Union[str, None] = "002_add_core_tables"
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
        "project_risks",
        sa.Column(
            "risk_id", sa.BigInteger(), sa.Identity(always=False), primary_key=True
        ),
        sa.Column("project_id", sa.BigInteger(), nullable=False),
        sa.Column("source_agent", sa.String(length=50), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("title", sa.String(length=500), nullable=True),
        sa.Column("severity", sa.String(length=50), nullable=True),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        _created_at(),
        sa.ForeignKeyConstraint(["project_id"], ["projects.project_id"]),
    )
    op.create_index(
        "ix_project_risks_project_id", "project_risks", ["project_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_project_risks_project_id", table_name="project_risks")
    op.drop_table("project_risks")
