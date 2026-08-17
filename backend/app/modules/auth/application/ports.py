"""Cong ra ben ngoai cua tang application.

Tham so `request` de kieu `Any` co chu dich: tang nay khong duoc biet Starlette.
Adapter o infrastructure/ moi biet do la starlette.requests.Request.
"""

from __future__ import annotations

from types import TracebackType
from typing import Any, Protocol

from app.modules.auth.domain.repositories import (
    AuthSessionRepository,
    IdentityRepository,
    PlayerRepository,
    PlayerSettingsRepository,
)
from app.modules.auth.domain.value_objects import OAuthProfile, Provider


class OAuthProvider(Protocol):
    """Mot nha cung cap dang nhap. Them Facebook = them mot adapter, khong sua use case."""

    provider: Provider

    async def authorize_redirect(self, request: Any, redirect_uri: str) -> Any:
        """Tra ve response chuyen huong toi trang dong y cua nha cung cap."""
        ...

    async def fetch_profile(self, request: Any) -> OAuthProfile:
        """Doi authorization code lay token roi chuan hoa thanh OAuthProfile."""
        ...


class AuthUnitOfWork(Protocol):
    players: PlayerRepository
    identities: IdentityRepository
    sessions: AuthSessionRepository
    player_settings: PlayerSettingsRepository

    async def __aenter__(self) -> AuthUnitOfWork: ...

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None: ...

    async def commit(self) -> None: ...
