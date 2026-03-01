"""doctor patients mapping

Revision ID: 0005_doctor_patients
Revises: 0004_doctor_verification
Create Date: 2026-02-12 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0005_doctor_patients"
down_revision = "0004_doctor_verification"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "doctor_patients",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("doctor_id", sa.String(length=36), nullable=False),
        sa.Column("patient_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["doctor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["patient_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("doctor_id", "patient_id", name="uq_doctor_patient"),
    )
    op.create_index("ix_doctor_patients_doctor_id", "doctor_patients", ["doctor_id"])
    op.create_index("ix_doctor_patients_patient_id", "doctor_patients", ["patient_id"])


def downgrade() -> None:
    op.drop_index("ix_doctor_patients_patient_id", table_name="doctor_patients")
    op.drop_index("ix_doctor_patients_doctor_id", table_name="doctor_patients")
    op.drop_table("doctor_patients")
