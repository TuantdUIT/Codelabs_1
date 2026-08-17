"""Use case: bang xep hang va lich su van choi."""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from enum import StrEnum

from app.modules.gameplay.application.ports import GameplayUnitOfWork, PlayerDirectory
from app.modules.gameplay.domain.entities import GameRun
from app.modules.gameplay.domain.repositories import LeaderboardRow
from app.modules.gameplay.domain.value_objects import GameMode
from app.shared.ids import PlayerId


class Period(StrEnum):
    DAY = "day"
    WEEK = "week"
    ALL = "all"


WINDOW: dict[Period, timedelta | None] = {
    Period.DAY: timedelta(days=1),
    Period.WEEK: timedelta(days=7),
    Period.ALL: None,
}


class GetLeaderboard:
    def __init__(
        self,
        uow_factory: Callable[[], GameplayUnitOfWork],
        directory: PlayerDirectory,
        clock: Callable[[], datetime] = lambda: datetime.now(UTC),
    ) -> None:
        self._uow_factory = uow_factory
        self._directory = directory
        self._clock = clock

    async def execute(
        self,
        *,
        mode: GameMode | None = None,
        period: Period = Period.ALL,
        limit: int = 20,
    ) -> list[LeaderboardRow]:
        window = WINDOW[period]
        since = self._clock() - window if window else None

        async with self._uow_factory() as uow:
            entries = await uow.runs.leaderboard(mode, since, min(limit, 100))

        # Ten nguoi choi lay tu module auth qua cong, khong JOIN xuyen module.
        names = await self._directory.summaries([entry.player_id for entry in entries])
        rows: list[LeaderboardRow] = []
        for rank, entry in enumerate(entries, start=1):
            summary = names.get(entry.player_id)
            rows.append(
                LeaderboardRow(
                    rank=rank,
                    player_id=entry.player_id,
                    display_name=summary.display_name if summary else "Nguoi choi an danh",
                    avatar_url=summary.avatar_url if summary else None,
                    best_score=entry.best_score,
                    runs=entry.runs,
                    achieved_at=entry.achieved_at,
                )
            )
        return rows


class ListMyRuns:
    def __init__(self, uow_factory: Callable[[], GameplayUnitOfWork]) -> None:
        self._uow_factory = uow_factory

    async def execute(self, *, player_id: PlayerId, limit: int = 20) -> list[GameRun]:
        async with self._uow_factory() as uow:
            return await uow.runs.list_for_player(player_id, min(limit, 100))
