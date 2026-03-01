from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.middleware import PublicRateLimitMiddleware, SecurityHeadersMiddleware


configure_logging()

app = FastAPI(title=settings.APP_NAME)

app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/", include_in_schema=False)
async def root():
    return {"status": "ok", "service": settings.APP_NAME}


@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "healthy"}

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(PublicRateLimitMiddleware, max_requests=120, window_seconds=60)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
