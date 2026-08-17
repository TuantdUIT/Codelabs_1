"""Hop dong repository. Hien thuc nam o infrastructure/, domain khong biet SQL."""

from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime
from typing import Protocol

from app.modules.auth.domain.entities import AuthSession, Identity, Player
from app.modules.auth.domain.value_objects import Email, Provider
from app.shared.ids import PlayerId, SessionId


class PlayerRepository(Protocol):
    async def add(self, player: Player) -> None: ...

    async def get(self, player_id: PlayerId) -> Player | None: ...

    async def get_many(self, player_ids: Sequence[PlayerId]) -> dict[PlayerId, Player]: ...

    async def get_by_email(self, email: Email) -> Player | None: ...

    async def save(self, player: Player) -> None: ...


class IdentityRepository(Protocol):
    async def get(self, provider: Provider, provider_user_id: str) -> Identity | None: ...

    async def add(self, identity: Identity) -> None: ...

    async def save(self, identity: Identity) -> None: ...


class AuthSessionRepository(Protocol):
    async def add(self, session: AuthSession) -> None: ...

    async def get_by_token_hash(self, token_hash: str) -> AuthSession | None: ...

    async def get_child_of(self, session_id: SessionId) -> AuthSession | None:
        """Phien duoc xoay ra tu phien nay, neu co. Dung de phat hien tai su dung."""
        ...

    async def revoke(self, session_id: SessionId, now: datetime) -> None: ...

    async def revoke_all_for_player(self, player_id: PlayerId, now: datetime) -> int: ...


class PlayerSettingsRepository(Protocol):
    async def create_default(self, player_id: PlayerId) -> None: ...
