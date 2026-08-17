"""Chuyen doi ORM model <-> entity domain."""

from __future__ import annotations

from app.modules.auth.domain.entities import AuthSession, Identity, Player
from app.modules.auth.domain.value_objects import Email, Provider
from app.modules.auth.infrastructure.models import AuthSessionModel, IdentityModel, PlayerModel
from app.shared.ids import PlayerId, SessionId


def player_to_entity(row: PlayerModel) -> Player:
    return Player(
        id=PlayerId(row.id),
        display_name=row.display_name,
        email=Email(row.email) if row.email else None,
        email_verified=row.email_verified,
        avatar_url=row.avatar_url,
        is_guest=row.is_guest,
        created_at=row.created_at,
    )


def player_to_model(player: Player) -> PlayerModel:
    return PlayerModel(
        id=player.id,
        display_name=player.display_name,
        email=player.email.value if player.email else None,
        email_verified=player.email_verified,
        avatar_url=player.avatar_url,
        is_guest=player.is_guest,
    )


def identity_to_entity(row: IdentityModel) -> Identity:
    return Identity(
        provider=Provider(row.provider),
        provider_user_id=row.provider_user_id,
        player_id=PlayerId(row.player_id),
        email=Email(row.email) if row.email else None,
        linked_at=row.linked_at,
        last_login_at=row.last_login_at,
    )


def identity_to_model(identity: Identity) -> IdentityModel:
    return IdentityModel(
        provider=identity.provider.value,
        provider_user_id=identity.provider_user_id,
        player_id=identity.player_id,
        email=identity.email.value if identity.email else None,
        linked_at=identity.linked_at,
        last_login_at=identity.last_login_at,
    )


def session_to_entity(row: AuthSessionModel) -> AuthSession:
    return AuthSession(
        id=SessionId(row.id),
        player_id=PlayerId(row.player_id),
        refresh_token_hash=row.refresh_token_hash,
        issued_at=row.issued_at,
        expires_at=row.expires_at,
        revoked_at=row.revoked_at,
        rotated_from=SessionId(row.rotated_from) if row.rotated_from else None,
        user_agent=row.user_agent,
        ip=row.ip,
    )


def session_to_model(session: AuthSession) -> AuthSessionModel:
    return AuthSessionModel(
        id=session.id,
        player_id=session.player_id,
        refresh_token_hash=session.refresh_token_hash,
        issued_at=session.issued_at,
        expires_at=session.expires_at,
        revoked_at=session.revoked_at,
        rotated_from=session.rotated_from,
        user_agent=session.user_agent,
        ip=session.ip,
    )
