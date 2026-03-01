from __future__ import annotations

import asyncio
import ssl
from logging.config import fileConfig
import os
import sys

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.asyncio import async_engine_from_config

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.core.config import settings
from app.db.base import Base
from app.db import models  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Override with env settings.
# Alembic uses ConfigParser interpolation, so percent-encoded passwords
# (e.g. %21) must be escaped as %% before setting the option.
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL.replace("%", "%%"))

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    db_url = make_url(settings.DATABASE_URL)
    db_host = (db_url.host or "").strip().lower()
    is_local_db = db_host in {"localhost", "127.0.0.1"}

    engine_kwargs: dict = {
        "poolclass": pool.NullPool,
    }

    if settings.DATABASE_SSL and not is_local_db:
        ssl_context = ssl.create_default_context(cafile=settings.DATABASE_SSL_CA)
        if not settings.DATABASE_SSL_VERIFY:
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
        engine_kwargs["connect_args"] = {"ssl": ssl_context}

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        **engine_kwargs,
    )

    async def run_async_migrations() -> None:
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
        await connectable.dispose()

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
