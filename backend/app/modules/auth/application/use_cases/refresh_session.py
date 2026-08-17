"""Use case: xoay refresh token, kem phat hien tai su dung."""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime

from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_expires_at,
)
from app.modules.auth.application.dto import AuthTokens
from app.modules.auth.application.ports import AuthUnitOfWork
from app.modules.auth.domain.entities import AuthSession
from app.modules.auth.domain.exceptions import (
    InvalidRefreshToken,
    RefreshTokenExpired,
    RefreshTokenReuse,
)


class RefreshSession:
    def __init__(
        self,
        uow_factory: Callable[[], AuthUnitOfWork],
        clock: Callable[[], datetime] = lambda: datetime.now(UTC),
    ) -> None:
        self._uow_factory = uow_factory
        self._clock = clock

    async def execute(
        self,
        raw_token: str,
        *,
        user_agent: str | None = None,
        ip: str | None = None,
    ) -> AuthTokens:
        now = self._clock()
        token_hash = hash_refresh_token(raw_token)

        async with self._uow_factory() as uow:
            session = await uow.sessions.get_by_token_hash(token_hash)
            if session is None:
                raise InvalidRefreshToken()

            # Da co phien con sinh ra tu phien nay => token cu bi dung lai.
            # Coi nhu token bi danh cap: thu hoi toan bo chuoi cua nguoi choi.
            if await uow.sessions.get_child_of(session.id) is not None:
                await uow.sessions.revoke_all_for_player(session.player_id, now)
                await uow.commit()
                raise RefreshTokenReuse()

            if session.revoked_at is not None:
                raise InvalidRefreshToken()
            if session.is_expired(now):
                raise RefreshTokenExpired()

            raw_refresh = generate_refresh_token()
            expires_at = refresh_expires_at(now=now)
            await uow.sessions.add(
                AuthSession.issue(
                    player_id=session.player_id,
                    token_hash=hash_refresh_token(raw_refresh),
                    now=now,
                    expires_at=expires_at,
                    rotated_from=session.id,
                    user_agent=user_agent,
                    ip=ip,
                )
            )
            await uow.sessions.revoke(session.id, now)
            await uow.commit()
            player_id = session.player_id

        access_token, expires_in = create_access_token(player_id, now=now)
        return AuthTokens(
            access_token=access_token,
            expires_in=expires_in,
            refresh_token=raw_refresh,
            refresh_expires_at=expires_at,
        )
