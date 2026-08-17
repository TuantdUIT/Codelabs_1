"""Entity cua mien auth: Player, Identity, AuthSession."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4

from app.modules.auth.domain.events import IdentityLinked, PlayerLoggedIn, PlayerRegistered
from app.modules.auth.domain.value_objects import Email, OAuthProfile, Provider
from app.shared.entity import AggregateRoot, Entity
from app.shared.ids import PlayerId, SessionId


@dataclass(eq=False, kw_only=True)
class Player(AggregateRoot):
    id: PlayerId
    display_name: str
    email: Email | None = None
    email_verified: bool = False
    avatar_url: str | None = None
    is_guest: bool = False
    created_at: datetime | None = None

    @classmethod
    def register(cls, *, display_name: str, profile: OAuthProfile, now: datetime) -> Player:
        player = cls(
            id=PlayerId(uuid4()),
            display_name=display_name,
            email=profile.email,
            email_verified=profile.email_verified,
            avatar_url=profile.avatar_url,
            created_at=now,
        )
        player.record(PlayerRegistered(player_id=player.id, provider=profile.provider))
        return player

    def refresh_profile(self, profile: OAuthProfile) -> None:
        """Cap nhat thong tin hien thi moi lan dang nhap, khong ghi de bang gia tri rong."""
        if profile.avatar_url:
            self.avatar_url = profile.avatar_url
        if profile.email is not None and self.email is None:
            self.email = profile.email
            self.email_verified = profile.email_verified
        self.record(PlayerLoggedIn(player_id=self.id, provider=profile.provider))


@dataclass(eq=False, kw_only=True)
class Identity(Entity):
    """Mot tai khoan ben ngoai da lien ket voi mot Player."""

    provider: Provider
    provider_user_id: str
    player_id: PlayerId
    email: Email | None = None
    linked_at: datetime | None = None
    last_login_at: datetime | None = None
    id: tuple[Provider, str] = field(init=False)

    def __post_init__(self) -> None:
        self.id = (self.provider, self.provider_user_id)

    @classmethod
    def link(cls, *, profile: OAuthProfile, player_id: PlayerId, now: datetime) -> Identity:
        return cls(
            provider=profile.provider,
            provider_user_id=profile.subject,
            player_id=player_id,
            email=profile.email,
            linked_at=now,
            last_login_at=now,
        )

    def touch_login(self, now: datetime) -> IdentityLinked:
        self.last_login_at = now
        return IdentityLinked(player_id=self.player_id, provider=self.provider)


@dataclass(eq=False, kw_only=True)
class AuthSession(AggregateRoot):
    """Mot phien refresh token. Chi luu ban bam cua token."""

    id: SessionId
    player_id: PlayerId
    refresh_token_hash: str
    issued_at: datetime
    expires_at: datetime
    revoked_at: datetime | None = None
    rotated_from: SessionId | None = None
    user_agent: str | None = None
    ip: str | None = None

    @classmethod
    def issue(
        cls,
        *,
        player_id: PlayerId,
        token_hash: str,
        now: datetime,
        expires_at: datetime,
        rotated_from: SessionId | None = None,
        user_agent: str | None = None,
        ip: str | None = None,
    ) -> AuthSession:
        return cls(
            id=SessionId(uuid4()),
            player_id=player_id,
            refresh_token_hash=token_hash,
            issued_at=now,
            expires_at=expires_at,
            rotated_from=rotated_from,
            user_agent=user_agent,
            ip=ip,
        )

    def is_expired(self, now: datetime) -> bool:
        return self.expires_at <= now

    def is_active(self, now: datetime) -> bool:
        return self.revoked_at is None and not self.is_expired(now)

    def revoke(self, now: datetime) -> None:
        if self.revoked_at is None:
            self.revoked_at = now


__all__ = ["AuthSession", "Identity", "Player", "PlayerId", "UUID"]
