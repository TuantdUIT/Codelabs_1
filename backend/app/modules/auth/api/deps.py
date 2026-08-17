"""Dependency dung chung. Cac module khac lay `current_player` qua auth.public."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.container import auth_uow_factory
from app.core.security import InvalidAccessToken, decode_access_token
from app.modules.auth.domain.entities import Player
from app.modules.auth.domain.exceptions import PlayerNotFound
from app.shared.ids import PlayerId

_bearer = HTTPBearer(auto_error=False)


async def current_player(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> Player:
    if credentials is None or not credentials.credentials:
        raise InvalidAccessToken("Thieu header Authorization")

    player_id = PlayerId(decode_access_token(credentials.credentials))
    async with auth_uow_factory() as uow:
        player = await uow.players.get(player_id)

    if player is None:
        raise PlayerNotFound()
    return player


CurrentPlayer = Annotated[Player, Depends(current_player)]
