"""Use case: tra ten hien thi cua nhieu nguoi choi cung luc.

Module khac (vi du bang xep hang cua gameplay) can hien ten nguoi choi nhung
KHONG duoc JOIN thang vao bang `player`. Chung goi qua day.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass

from app.modules.auth.application.ports import AuthUnitOfWork
from app.shared.ids import PlayerId


@dataclass(frozen=True, slots=True)
class PlayerSummary:
    player_id: PlayerId
    display_name: str
    avatar_url: str | None


class GetPlayerSummaries:
    def __init__(self, uow_factory: Callable[[], AuthUnitOfWork]) -> None:
        self._uow_factory = uow_factory

    async def execute(self, player_ids: Sequence[PlayerId]) -> dict[PlayerId, PlayerSummary]:
        if not player_ids:
            return {}
        async with self._uow_factory() as uow:
            players = await uow.players.get_many(player_ids)
        return {
            player_id: PlayerSummary(
                player_id=player_id,
                display_name=player.display_name,
                avatar_url=player.avatar_url,
            )
            for player_id, player in players.items()
        }
