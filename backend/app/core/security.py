"""Nguyen thuy bao mat: ky/verify access token, sinh va bam refresh token."""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import jwt

from app.core.config import settings
from app.core.errors import AuthenticationError

ALGORITHM = "HS256"


class InvalidAccessToken(AuthenticationError):
    """Access token khong hop le hoac da het han."""

    code = "invalid_access_token"


def create_access_token(player_id: UUID, *, now: datetime | None = None) -> tuple[str, int]:
    """Tra ve (token, so giay con hieu luc)."""
    issued_at = now or datetime.now(UTC)
    expires_at = issued_at + timedelta(minutes=settings.ACCESS_TOKEN_MINUTES)
    payload = {
        "sub": str(player_id),
        "jti": str(uuid4()),
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)
    return token, settings.ACCESS_TOKEN_MINUTES * 60


def decode_access_token(token: str) -> UUID:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        return UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError) as exc:
        raise InvalidAccessToken() from exc


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    """DB chi luu ban bam — lo DB cung khong mao danh duoc phien."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def refresh_expires_at(*, now: datetime | None = None) -> datetime:
    return (now or datetime.now(UTC)) + timedelta(days=settings.REFRESH_TOKEN_DAYS)
