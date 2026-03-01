"""expand profile photo storage

Revision ID: 0009_profile_photo_mediumtext
Revises: 0008_doctor_ratings
Create Date: 2026-02-15
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision = "0009_profile_photo_mediumtext"
down_revision = "0008_doctor_ratings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "users",
        "profile_photo_data",
        existing_type=sa.Text(),
        type_=mysql.MEDIUMTEXT(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "profile_photo_data",
        existing_type=mysql.MEDIUMTEXT(),
        type_=sa.Text(),
        existing_nullable=True,
    )
