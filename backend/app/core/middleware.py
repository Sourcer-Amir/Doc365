from __future__ import annotations

from collections import deque
from time import monotonic

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)

        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

        if request.url.scheme == "https":
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

        return response


class PublicRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        *,
        max_requests: int = 60,
        window_seconds: int = 60,
        path_prefix: str = "/api/public/",
    ):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.path_prefix = path_prefix
        self._requests: dict[str, deque[float]] = {}

    def _is_limited(self, key: str) -> bool:
        now = monotonic()
        window_start = now - self.window_seconds
        queue = self._requests.get(key)
        if queue is None:
            queue = deque()
            self._requests[key] = queue

        while queue and queue[0] < window_start:
            queue.popleft()

        if len(queue) >= self.max_requests:
            return True

        queue.append(now)
        return False

    async def dispatch(self, request, call_next):
        if request.url.path.startswith(self.path_prefix):
            client = request.client.host if request.client else "unknown"
            if self._is_limited(client):
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests"},
                )

        return await call_next(request)
