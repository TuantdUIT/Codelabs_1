"""Domain event cua mien auth.

`kw_only=True` de cac truong bat buoc dat sau `occurred_at` (co gia tri mac dinh)
ma khong vi pham thu tu tham so cua dataclass.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.modules.auth.domain.value_objects import Provider
from app.shared.entity import DomainEvent
from app.shared.ids import PlayerId, SessionId


@dataclass(frozen=True, slots=True, kw_only=True)
class PlayerRegistered(DomainEvent):
    player_id: PlayerId
    provider: Provider


@dataclass(frozen=True, slots=True, kw_only=True)
class PlayerLoggedIn(DomainEvent):
    player_id: PlayerId
    provider: Provider


@dataclass(frozen=True, slots=True, kw_only=True)
class IdentityLinked(DomainEvent):
    player_id: PlayerId
    provider: Provider


@dataclass(frozen=True, slots=True, kw_only=True)
class RefreshTokenReuseDetected(DomainEvent):
    """Dau hieu token bi danh cap: mot refresh token da xoay lai duoc dung lai."""

    player_id: PlayerId
    session_id: SessionId
