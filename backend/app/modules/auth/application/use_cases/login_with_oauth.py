"""Use case: dang nhap/dang ky bang mot nha cung cap OAuth."""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime

from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    refresh_expires_at,
)
from app.modules.auth.application.dto import AuthTokens, LoginResult
from app.modules.auth.application.ports import AuthUnitOfWork
from app.modules.auth.domain.entities import AuthSession, Identity, Player
from app.modules.auth.domain.services import LinkDecision, decide_account_link, display_name_for
from app.modules.auth.domain.value_objects import OAuthProfile


class LoginWithOAuth:
    def __init__(
        self,
        uow_factory: Callable[[], AuthUnitOfWork],
        clock: Callable[[], datetime] = lambda: datetime.now(UTC),
    ) -> None:
        self._uow_factory = uow_factory
        self._clock = clock

    async def execute(
        self,
        profile: OAuthProfile,
        *,
        user_agent: str | None = None,
        ip: str | None = None,
    ) -> LoginResult:
        now = self._clock()

        async with self._uow_factory() as uow:
            identity = await uow.identities.get(profile.provider, profile.subject)
            is_new_player = False

            if identity is not None:
                player = await uow.players.get(identity.player_id)
                if player is None:  # FK dam bao khong xay ra, nhung khong gia dinh mu quang
                    raise RuntimeError(f"Identity {identity.id} tro toi player khong ton tai")
                identity.touch_login(now)
                await uow.identities.save(identity)
            else:
                existing = None
                if profile.email is not None:
                    existing = await uow.players.get_by_email(profile.email)

                if decide_account_link(profile, existing) is LinkDecision.LINK_EXISTING:
                    assert existing is not None  # decide_account_link da bao dam
                    player = existing
                else:
                    player = Player.register(
                        display_name=display_name_for(profile), profile=profile, now=now
                    )
                    await uow.players.add(player)
                    await uow.player_settings.create_default(player.id)
                    is_new_player = True

                await uow.identities.add(Identity.link(profile=profile, player_id=player.id, now=now))

            player.refresh_profile(profile)
            await uow.players.save(player)

            raw_refresh = generate_refresh_token()
            expires_at = refresh_expires_at(now=now)
            await uow.sessions.add(
                AuthSession.issue(
                    player_id=player.id,
                    token_hash=hash_refresh_token(raw_refresh),
                    now=now,
                    expires_at=expires_at,
                    user_agent=user_agent,
                    ip=ip,
                )
            )
            await uow.commit()

        access_token, expires_in = create_access_token(player.id, now=now)
        return LoginResult(
            player=player,
            tokens=AuthTokens(
                access_token=access_token,
                expires_in=expires_in,
                refresh_token=raw_refresh,
                refresh_expires_at=expires_at,
            ),
            is_new_player=is_new_player,
        )
