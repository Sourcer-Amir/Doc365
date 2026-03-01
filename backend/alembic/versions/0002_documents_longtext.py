"""use LONGTEXT for documents file_data

Revision ID: 0002_documents_longtext
Revises: 0001_init
Create Date: 2026-02-12 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision = "0002_documents_longtext"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "documents",
        "file_data",
        existing_type=sa.Text(),
        type_=mysql.LONGTEXT(),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "documents",
        "file_data",
        existing_type=mysql.LONGTEXT(),
        type_=sa.Text(),
        existing_nullable=False,
    )
