"""doctor languages, patient languages, and consultation modes

Revision ID: 0011_doctor_langs
Revises: 0010_account_admin_verif
Create Date: 2026-02-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "0011_doctor_langs"
down_revision = "0010_account_admin_verif"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    user_columns = {col["name"] for col in inspector.get_columns("users")}
    if "doctor_languages" not in user_columns:
        op.add_column("users", sa.Column("doctor_languages", sa.JSON(), nullable=True))
    if "expected_salary_range" not in user_columns:
        op.add_column("users", sa.Column("expected_salary_range", sa.String(length=120), nullable=True))
    if "offers_online" not in user_columns:
        op.add_column(
            "users",
            sa.Column("offers_online", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        )
    if "offers_in_person" not in user_columns:
        op.add_column(
            "users",
            sa.Column("offers_in_person", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        )

    profile_columns = {col["name"] for col in inspector.get_columns("patient_profiles")}
    if "languages" not in profile_columns:
        op.add_column("patient_profiles", sa.Column("languages", sa.JSON(), nullable=True))
        op.execute("UPDATE patient_profiles SET languages='[]' WHERE languages IS NULL")
        op.alter_column("patient_profiles", "languages", existing_type=sa.JSON(), nullable=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    profile_columns = {col["name"] for col in inspector.get_columns("patient_profiles")}
    if "languages" in profile_columns:
        op.drop_column("patient_profiles", "languages")

    user_columns = {col["name"] for col in inspector.get_columns("users")}
    if "offers_in_person" in user_columns:
        op.drop_column("users", "offers_in_person")
    if "offers_online" in user_columns:
        op.drop_column("users", "offers_online")
    if "expected_salary_range" in user_columns:
        op.drop_column("users", "expected_salary_range")
    if "doctor_languages" in user_columns:
        op.drop_column("users", "doctor_languages")
