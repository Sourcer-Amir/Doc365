"""initial schema

Revision ID: 0001_init
Revises: 
Create Date: 2026-02-05 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("specialty", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])

    op.create_table(
        "patient_profiles",
        sa.Column("user_id", sa.String(length=36), primary_key=True),
        sa.Column("blood_type", sa.String(length=8), nullable=True),
        sa.Column("allergies", sa.JSON(), nullable=False),
        sa.Column("chronic_conditions", sa.JSON(), nullable=False),
        sa.Column("current_medications", sa.JSON(), nullable=False),
        sa.Column("medical_history", sa.JSON(), nullable=False),
        sa.Column("emergency_contact", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("sender_id", sa.String(length=36), nullable=False),
        sa.Column("recipient_id", sa.String(length=36), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("chat_type", sa.String(length=20), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("sender_name", sa.String(length=255), nullable=False),
        sa.Column("is_ai", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_chat_messages_sender_id", "chat_messages", ["sender_id"])
    op.create_index("ix_chat_messages_recipient_id", "chat_messages", ["recipient_id"])
    op.create_index("ix_chat_messages_chat_type", "chat_messages", ["chat_type"])

    op.create_table(
        "recommendations",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_recommendations_user_id", "recommendations", ["user_id"])

    op.create_table(
        "documents",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("file_data", sa.Text(), nullable=False),
        sa.Column("file_type", sa.String(length=100), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_documents_user_id", "documents", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_documents_user_id", table_name="documents")
    op.drop_table("documents")

    op.drop_index("ix_recommendations_user_id", table_name="recommendations")
    op.drop_table("recommendations")

    op.drop_index("ix_chat_messages_chat_type", table_name="chat_messages")
    op.drop_index("ix_chat_messages_recipient_id", table_name="chat_messages")
    op.drop_index("ix_chat_messages_sender_id", table_name="chat_messages")
    op.drop_table("chat_messages")

    op.drop_table("patient_profiles")

    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
