"""account verification and admin review metadata

Revision ID: 0010_account_admin_verif
Revises: 0009_profile_photo_mediumtext
Create Date: 2026-02-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "0010_account_admin_verif"
down_revision = "0009_profile_photo_mediumtext"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    user_columns = {col["name"] for col in inspector.get_columns("users")}
    if "telegram_chat_id" not in user_columns:
        op.add_column("users", sa.Column("telegram_chat_id", sa.String(length=64), nullable=True))
    if "email_verified" not in user_columns:
        op.add_column(
            "users",
            sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        )

    verification_columns = {
        col["name"] for col in inspector.get_columns("doctor_verification_documents")
    }
    if "rejection_reason" not in verification_columns:
        op.add_column(
            "doctor_verification_documents",
            sa.Column("rejection_reason", sa.String(length=500), nullable=True),
        )
    if "reviewed_by" not in verification_columns:
        op.add_column(
            "doctor_verification_documents",
            sa.Column("reviewed_by", sa.String(length=36), nullable=True),
        )
    if "reviewed_at" not in verification_columns:
        op.add_column(
            "doctor_verification_documents",
            sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        )

    if "account_verification_codes" not in inspector.get_table_names():
        op.create_table(
            "account_verification_codes",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("user_id", sa.String(length=36), nullable=False),
            sa.Column("code_hash", sa.String(length=255), nullable=False),
            sa.Column("attempts", sa.Integer(), nullable=False, server_default=sa.text("0")),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("CURRENT_TIMESTAMP"),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        )
        op.create_index(
            "ix_account_verification_codes_user_id",
            "account_verification_codes",
            ["user_id"],
            unique=False,
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "account_verification_codes" in inspector.get_table_names():
        op.drop_index("ix_account_verification_codes_user_id", table_name="account_verification_codes")
        op.drop_table("account_verification_codes")

    verification_columns = {
        col["name"] for col in inspector.get_columns("doctor_verification_documents")
    }
    if "reviewed_at" in verification_columns:
        op.drop_column("doctor_verification_documents", "reviewed_at")
    if "reviewed_by" in verification_columns:
        op.drop_column("doctor_verification_documents", "reviewed_by")
    if "rejection_reason" in verification_columns:
        op.drop_column("doctor_verification_documents", "rejection_reason")

    user_columns = {col["name"] for col in inspector.get_columns("users")}
    if "email_verified" in user_columns:
        op.drop_column("users", "email_verified")
    if "telegram_chat_id" in user_columns:
        op.drop_column("users", "telegram_chat_id")
