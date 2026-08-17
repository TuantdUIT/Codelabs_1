"""DTO giua tang application va tang api."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from app.modules.auth.domain.entities import Player


@dataclass(frozen=True, slots=True)
class AuthTokens:
    access_token: str
    expires_in: int
    refresh_token: str
    """Token tho — chi tro ve mot lan de dat vao cookie, DB chi giu ban bam."""
    refresh_expires_at: datetime


@dataclass(frozen=True, slots=True)
class LoginResult:
    player: Player
    tokens: AuthTokens
    is_new_player: bool
