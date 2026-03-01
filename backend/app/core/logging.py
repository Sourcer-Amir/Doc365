import logging

from app.core.config import settings


def configure_logging() -> None:
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Reduce access log verbosity to avoid accidental PHI leakage
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
