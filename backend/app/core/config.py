from __future__ import annotations

from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AliasChoices


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    APP_NAME: str = "Doctor365 API"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = Field(
        "mysql+aiomysql://dbpgf27793600:ZZpwwk0vMgYoHQHW%21Pt3kMO@serverless-us-west1.sysp0000.db2.skysql.com:4048/sana",
        description="Async SQLAlchemy URL, e.g. mysql+aiomysql://user:pass@localhost:3306/sana",
    )
    DATABASE_SSL: bool = True
    DATABASE_SSL_VERIFY: bool = True
    DATABASE_SSL_CA: Optional[str] = None

    JWT_SECRET: str = Field("demo_sanarios_jwt_secret_2026_min_32_chars", min_length=32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,https://sanarios.com,https://www.sanarios.com,https://sanarios.vercel.app"

    AI_PROVIDER: str = "groq"  # litellm | groq
    AI_MODEL: str = "llama-3.3-70b-versatile"
    AI_API_KEY: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("AI_API_KEY", "GROQ_API_KEY"),
    )

    LOG_LEVEL: str = "INFO"

    EMAIL_VERIFY_CODE_TTL_MINUTES: int = 15
    EMAIL_VERIFY_MAX_ATTEMPTS: int = 5

    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    SMTP_USE_TLS: bool = True

    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_BOT_USERNAME: Optional[str] = None
    TELEGRAM_ADMIN_CHAT_ID: Optional[str] = None
    TELEGRAM_WEBHOOK_SECRET: Optional[str] = None
    TELEGRAM_LINK_TOKEN_TTL_MINUTES: int = 15
    APP_BASE_URL: Optional[str] = "http://localhost:3000"

    AGORA_APP_ID: Optional[str] = None
    AGORA_APP_CERTIFICATE: Optional[str] = None
    AGORA_TEMP_TOKEN: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("AGORA_TEMP_TOKEN", "AGORA_TOKEN"),
    )
    AGORA_TOKEN_EXPIRY_SECONDS: int = 3600

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if not isinstance(value, str):
            return value

        normalized = value.strip()
        if (
            len(normalized) >= 2
            and normalized[0] == normalized[-1]
            and normalized[0] in {"'", '"'}
        ):
            normalized = normalized[1:-1].strip()
        return normalized

    @property
    def cors_origins(self) -> List[str]:
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
