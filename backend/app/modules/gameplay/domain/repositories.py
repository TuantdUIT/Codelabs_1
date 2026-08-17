"""Hop dong repository cua mien gameplay."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

from app.modules.gameplay.domain.entities import GameRun
from app.modules.gameplay.domain.value_objects import GameMode
from app.shared.ids import PlayerId, RunId


@dataclass(frozen=True, slots=True)
class LeaderboardEntry:
    """Ket qua thong ke thuan tu bang `game_run` — chua co ten nguoi choi.

    Ten va avatar thuoc ve module auth, duoc ghep vao o tang application qua
    cong `PlayerDirectory`. Khong JOIN xuyen module o day.
    """

    player_id: PlayerId
    best_score: int
    runs: int
    achieved_at: datetime


@dataclass(frozen=True, slots=True)
class LeaderboardRow:
    rank: int
    player_id: PlayerId
    display_name: str
    avatar_url: str | None
    best_score: int
    runs: int
    achieved_at: datetime


class GameRunRepository(Protocol):
    async def add(self, run: GameRun) -> None: ...

    async def get(self, run_id: RunId) -> GameRun | None: ...

    async def save(self, run: GameRun) -> None: ...

    async def list_for_player(self, player_id: PlayerId, limit: int) -> list[GameRun]: ...

    async def leaderboard(
        self, mode: GameMode | None, since: datetime | None, limit: int
    ) -> list[LeaderboardEntry]:
        """Chi lay van da `finished` VA `score_verified` — diem chua xac thuc khong len bang."""
        ...
