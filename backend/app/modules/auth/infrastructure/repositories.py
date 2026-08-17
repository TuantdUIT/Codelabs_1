"""Hien thuc repository bang SQLAlchemy + Unit of Work cua module auth."""

from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.unit_of_work import SqlAlchemyUnitOfWork
from app.modules.auth.domain.entities import AuthSession, Identity, Player
from app.modules.auth.domain.value_objects import Email, Provider
from app.modules.auth.infrastructure import mappers
from app.modules.auth.infrastructure.models import (
    AuthSessionModel,
    IdentityModel,
    PlayerModel,
    PlayerSettingsModel,
)
from app.shared.ids import PlayerId, SessionId


class SqlAlchemyPlayerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, player: Player) -> None:
        self._session.add(mappers.player_to_model(player))
        await self._session.flush()

    async def get(self, player_id: PlayerId) -> Player | None:
        row = await self._session.get(PlayerModel, player_id)
        return mappers.player_to_entity(row) if row else None

    async def get_many(self, player_ids: Sequence[PlayerId]) -> dict[PlayerId, Player]:
        if not player_ids:
            return {}
        stmt = select(PlayerModel).where(PlayerModel.id.in_(list(player_ids)))
        rows = (await self._session.execute(stmt)).scalars()
        return {PlayerId(row.id): mappers.player_to_entity(row) for row in rows}

    async def get_by_email(self, email: Email) -> Player | None:
        stmt = select(PlayerModel).where(PlayerModel.email == email.value)
        row = (await self._session.execute(stmt)).scalar_one_or_none()
        return mappers.player_to_entity(row) if row else None

    async def save(self, player: Player) -> None:
        stmt = (
            update(PlayerModel)
            .where(PlayerModel.id == player.id)
            .values(
                display_name=player.display_name,
                email=player.email.value if player.email else None,
                email_verified=player.email_verified,
                avatar_url=player.avatar_url,
            )
        )
        await self._session.execute(stmt)


class SqlAlchemyIdentityRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, provider: Provider, provider_user_id: str) -> Identity | None:
        row = await self._session.get(IdentityModel, (provider.value, provider_user_id))
        return mappers.identity_to_entity(row) if row else None

    async def add(self, identity: Identity) -> None:
        self._session.add(mappers.identity_to_model(identity))
        await self._session.flush()

    async def save(self, identity: Identity) -> None:
        stmt = (
            update(IdentityModel)
            .where(
                IdentityModel.provider == identity.provider.value,
                IdentityModel.provider_user_id == identity.provider_user_id,
            )
            .values(
                last_login_at=identity.last_login_at,
                email=identity.email.value if identity.email else None,
            )
        )
        await self._session.execute(stmt)


class SqlAlchemyAuthSessionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, session: AuthSession) -> None:
        self._session.add(mappers.session_to_model(session))
        await self._session.flush()

    async def get_by_token_hash(self, token_hash: str) -> AuthSession | None:
        stmt = select(AuthSessionModel).where(AuthSessionModel.refresh_token_hash == token_hash)
        row = (await self._session.execute(stmt)).scalar_one_or_none()
        return mappers.session_to_entity(row) if row else None

    async def get_child_of(self, session_id: SessionId) -> AuthSession | None:
        stmt = select(AuthSessionModel).where(AuthSessionModel.rotated_from == session_id).limit(1)
        row = (await self._session.execute(stmt)).scalar_one_or_none()
        return mappers.session_to_entity(row) if row else None

    async def revoke(self, session_id: SessionId, now: datetime) -> None:
        stmt = (
            update(AuthSessionModel)
            .where(AuthSessionModel.id == session_id, AuthSessionModel.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        await self._session.execute(stmt)

    async def revoke_all_for_player(self, player_id: PlayerId, now: datetime) -> int:
        stmt = (
            update(AuthSessionModel)
            .where(AuthSessionModel.player_id == player_id, AuthSessionModel.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        result = await self._session.execute(stmt)
        return result.rowcount or 0


class SqlAlchemyPlayerSettingsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_default(self, player_id: PlayerId) -> None:
        self._session.add(PlayerSettingsModel(player_id=player_id))
        await self._session.flush()


class AuthUnitOfWork(SqlAlchemyUnitOfWork):
    """Gom cac repository cua auth vao mot transaction."""

    players: SqlAlchemyPlayerRepository
    identities: SqlAlchemyIdentityRepository
    sessions: SqlAlchemyAuthSessionRepository
    player_settings: SqlAlchemyPlayerSettingsRepository

    def _build_repositories(self) -> None:
        self.players = SqlAlchemyPlayerRepository(self.session)
        self.identities = SqlAlchemyIdentityRepository(self.session)
        self.sessions = SqlAlchemyAuthSessionRepository(self.session)
        self.player_settings = SqlAlchemyPlayerSettingsRepository(self.session)
