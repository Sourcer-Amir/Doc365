"""doctor verification documents and user is_verified

Revision ID: 0004_doctor_verification
Revises: 0003_user_ai_consent
Create Date: 2026-02-12 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision = "0004_doctor_verification"
down_revision = "0003_user_ai_consent"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.create_table(
        "doctor_verification_documents",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("doctor_id", sa.String(length=36), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("file_data", mysql.LONGTEXT(), nullable=False),
        sa.Column("file_type", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["doctor_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_doctor_verification_documents_doctor_id",
        "doctor_verification_documents",
        ["doctor_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_doctor_verification_documents_doctor_id", table_name="doctor_verification_documents")
    op.drop_table("doctor_verification_documents")
    op.drop_column("users", "is_verified")
