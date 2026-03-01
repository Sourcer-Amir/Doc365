"""add doctor profile photo data

Revision ID: 0007_profile_photo
Revises: 0006_add_doctor_profile_fields
Create Date: 2026-02-15
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "0007_profile_photo"
down_revision = "0006_add_doctor_profile_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("users")}
    if "profile_photo_data" not in columns:
        op.add_column("users", sa.Column("profile_photo_data", sa.Text(), nullable=True))
    if "profile_photo_type" not in columns:
        op.add_column("users", sa.Column("profile_photo_type", sa.String(length=100), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {col["name"] for col in inspector.get_columns("users")}
    if "profile_photo_type" in columns:
        op.drop_column("users", "profile_photo_type")
    if "profile_photo_data" in columns:
        op.drop_column("users", "profile_photo_data")
