from __future__ import annotations

import argparse
import asyncio
from uuid import uuid4

from sqlalchemy import select

from app.core.security import hash_password, password_meets_policy, PASSWORD_POLICY_MESSAGE
from app.db.models import User
from app.db.session import AsyncSessionLocal


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create or promote an admin user")
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--password", required=True, help="Admin password")
    parser.add_argument("--full-name", default="Admin User", help="Admin full name")
    parser.add_argument(
        "--keep-existing-password",
        action="store_true",
        help="When user already exists, keep current password hash",
    )
    return parser.parse_args()


async def create_or_promote_admin(
    *,
    email: str,
    password: str,
    full_name: str,
    keep_existing_password: bool,
) -> None:
    email = email.strip().lower()
    full_name = full_name.strip()

    if not password_meets_policy(password):
        raise ValueError(PASSWORD_POLICY_MESSAGE)
    if not email:
        raise ValueError("Email is required")
    if not full_name:
        raise ValueError("Full name is required")

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            user.role = "admin"
            user.full_name = full_name
            user.email_verified = True
            user.is_verified = True
            if not keep_existing_password:
                user.password_hash = hash_password(password)
            await session.commit()
            print(f"Updated existing user as admin: {email}")
            return

        admin = User(
            id=str(uuid4()),
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role="admin",
            specialty=None,
            clinic_address=None,
            phone=None,
            telegram_chat_id=None,
            profile_photo_url=None,
            profile_photo_data=None,
            profile_photo_type=None,
            bio=None,
            ai_consent=False,
            is_verified=True,
            email_verified=True,
        )
        session.add(admin)
        await session.commit()
        print(f"Created admin user: {email}")


async def main() -> None:
    args = parse_args()
    await create_or_promote_admin(
        email=args.email,
        password=args.password,
        full_name=args.full_name,
        keep_existing_password=bool(args.keep_existing_password),
    )


if __name__ == "__main__":
    asyncio.run(main())
