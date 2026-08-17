"""Noi ghep port voi adapter. Day la file duy nhat biet ca hai phia.

Khong duoc import tang api o day — se thanh vong import.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from functools import lru_cache

from app.modules.auth.application.ports import AuthUnitOfWork as AuthUnitOfWorkPort
from app.modules.auth.application.ports import OAuthProvider
from app.modules.auth.application.use_cases.get_player_summaries import (
    GetPlayerSummaries,
    PlayerSummary,
)
from app.modules.auth.domain.exceptions import UnknownProvider
from app.modules.auth.domain.value_objects import Provider
from app.modules.auth.infrastructure.oauth.google import GoogleOAuthProvider
from app.modules.auth.infrastructure.repositories import AuthUnitOfWork
from app.modules.gameplay.application.ports import GameplayUnitOfWork as GameplayUnitOfWorkPort
from app.modules.gameplay.application.ports import RunVerifier
from app.modules.gameplay.domain.value_objects import GameMode
from app.modules.gameplay.infrastructure.repositories import GameplayUnitOfWork
from app.modules.inorganic.infrastructure.repositories import InorganicUnitOfWork
from app.modules.inorganic.public import InorganicRunVerifier
from app.modules.organic.public import OrganicRunVerifier
from app.shared.ids import PlayerId


def auth_uow_factory() -> AuthUnitOfWorkPort:
    return AuthUnitOfWork()


def gameplay_uow_factory() -> GameplayUnitOfWorkPort:
    return GameplayUnitOfWork()


def inorganic_uow_factory() -> InorganicUnitOfWork:
    return InorganicUnitOfWork()


@lru_cache
def _oauth_providers() -> dict[Provider, OAuthProvider]:
    # Them Facebook sau: chi can them mot dong o day.
    return {Provider.GOOGLE: GoogleOAuthProvider()}


def get_oauth_provider(name: str) -> OAuthProvider:
    try:
        provider = Provider(name)
    except ValueError as exc:
        raise UnknownProvider(f"Khong ho tro dang nhap qua '{name}'") from exc

    client = _oauth_providers().get(provider)
    if client is None:
        raise UnknownProvider(f"Provider '{name}' chua duoc cau hinh")
    return client


class _AuthPlayerDirectory:
    """Adapter cho cong `PlayerDirectory` cua gameplay -> use case cua auth.

    Nho lop nay ma gameplay khong he import module auth.
    """

    async def summaries(self, player_ids: Sequence[PlayerId]) -> Mapping[PlayerId, PlayerSummary]:
        return await GetPlayerSummaries(auth_uow_factory).execute(player_ids)


@lru_cache
def player_directory() -> _AuthPlayerDirectory:
    return _AuthPlayerDirectory()


@lru_cache
def run_verifiers() -> dict[GameMode, RunVerifier]:
    """Che do choi moi = them mot module + mot dong o day, khong sua gameplay."""
    return {
        GameMode.INORGANIC: InorganicRunVerifier(),
        GameMode.ORGANIC: OrganicRunVerifier(),
    }
