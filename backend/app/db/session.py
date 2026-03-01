from __future__ import annotations

import ssl

from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession

from app.core.config import settings

db_url = make_url(settings.DATABASE_URL)
db_host = (db_url.host or "").strip().lower()
is_local_db = db_host in {"localhost", "127.0.0.1"}

engine_kwargs: dict = {
    "pool_pre_ping": True,
    "future": True,
}

if settings.DATABASE_SSL and not is_local_db:
    ssl_context = ssl.create_default_context(cafile=settings.DATABASE_SSL_CA)
    if not settings.DATABASE_SSL_VERIFY:
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
    engine_kwargs["connect_args"] = {"ssl": ssl_context}

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
