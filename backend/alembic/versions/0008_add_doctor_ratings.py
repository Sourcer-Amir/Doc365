"""add doctor ratings

Revision ID: 0008_doctor_ratings
Revises: 0007_profile_photo
Create Date: 2026-02-15
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "0008_doctor_ratings"
down_revision = "0007_profile_photo"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "doctor_ratings" in inspector.get_table_names():
        return

    op.create_table(
        "doctor_ratings",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("doctor_id", sa.String(length=36), nullable=False, index=True),
        sa.Column("patient_id", sa.String(length=36), nullable=False, index=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.UniqueConstraint("doctor_id", "patient_id", name="uq_doctor_patient_rating"),
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "doctor_ratings" in inspector.get_table_names():
        op.drop_table("doctor_ratings")
