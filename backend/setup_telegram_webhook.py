from __future__ import annotations

import argparse
import asyncio

import httpx

from app.core.config import settings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Configure Telegram webhook for Sanarios backend")
    parser.add_argument(
        "--base-url",
        required=True,
        help="Public HTTPS base URL where backend is reachable (e.g. https://api.example.com)",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()

    if not settings.TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN is not configured")

    webhook_url = f"{args.base_url.rstrip('/')}/api/telegram/webhook"
    endpoint = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/setWebhook"
    payload: dict[str, str] = {"url": webhook_url}
    if settings.TELEGRAM_WEBHOOK_SECRET:
        payload["secret_token"] = settings.TELEGRAM_WEBHOOK_SECRET

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(endpoint, json=payload)
        response.raise_for_status()
        data = response.json()

    if not data.get("ok"):
        raise RuntimeError(f"Telegram setWebhook failed: {data}")

    print(f"Telegram webhook configured: {webhook_url}")


if __name__ == "__main__":
    asyncio.run(main())
