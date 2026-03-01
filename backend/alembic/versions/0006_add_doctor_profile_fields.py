"""add doctor profile fields

Revision ID: 0006_add_doctor_profile_fields
Revises: 0005_doctor_patients
Create Date: 2026-02-15
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0006_add_doctor_profile_fields"
down_revision = "0005_doctor_patients"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("clinic_address", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(length=40), nullable=True))
    op.add_column("users", sa.Column("profile_photo_url", sa.String(length=500), nullable=True))
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "bio")
    op.drop_column("users", "profile_photo_url")
    op.drop_column("users", "phone")
    op.drop_column("users", "clinic_address")
