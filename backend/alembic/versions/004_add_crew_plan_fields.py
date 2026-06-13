"""add crew_plans headcount and skill_type

Revision ID: 004_add_crew_plan_fields
Revises: 003_add_project_risks
Create Date: 2026-06-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "004_add_crew_plan_fields"
down_revision: Union[str, None] = "003_add_project_risks"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("crew_plans", sa.Column("headcount", sa.Integer(), nullable=True))
    op.add_column(
        "crew_plans", sa.Column("skill_type", sa.String(length=255), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("crew_plans", "skill_type")
    op.drop_column("crew_plans", "headcount")
