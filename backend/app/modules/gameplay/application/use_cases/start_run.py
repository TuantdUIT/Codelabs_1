"""Use case: bat dau mot van choi.

Pha 1 cua luong 2 pha. Server tu ghi `started_at` va tu sinh `seed` — client khong
duoc quyet dinh hai gia tri nay, neu khong thoi luong va tinh phat lai deu vo nghia.
"""

from __future__ import annotations

import secrets
from collections.abc import Callable
from datetime import UTC, datetime
from uuid import uuid4

from app.modules.gameplay.application.dto import StartedRun
from app.modules.gameplay.application.ports import GameplayUnitOfWork
from app.modules.gameplay.domain.entities import GameRun
from app.modules.gameplay.domain.value_objects import GameMode
from app.shared.ids import PlayerId, RunId

MAX_SEED = 2**63 - 1


class StartRun:
    def __init__(
        self,
        uow_factory: Callable[[], GameplayUnitOfWork],
        clock: Callable[[], datetime] = lambda: datetime.now(UTC),
    ) -> None:
        self._uow_factory = uow_factory
        self._clock = clock

    async def execute(
        self,
        *,
        player_id: PlayerId,
        mode: GameMode,
        client_version: str,
    ) -> StartedRun:
        run = GameRun.start(
            run_id=RunId(uuid4()),
            player_id=player_id,
            mode=mode,
            seed=secrets.randbelow(MAX_SEED),
            now=self._clock(),
            client_version=client_version,
        )
        async with self._uow_factory() as uow:
            await uow.runs.add(run)
            await uow.commit()
        return StartedRun(run=run, seed=run.seed)
