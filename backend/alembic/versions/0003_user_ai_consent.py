"""add ai_consent to users

Revision ID: 0003_user_ai_consent
Revises: 0002_documents_longtext
Create Date: 2026-02-12 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0003_user_ai_consent"
down_revision = "0002_documents_longtext"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("ai_consent", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("users", "ai_consent")
