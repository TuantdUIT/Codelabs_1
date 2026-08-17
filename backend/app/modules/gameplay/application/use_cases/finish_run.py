"""Use case: nop ket qua van choi.

Pha 2. Diem luu vao DB LUON la diem server tu tinh lai; diem client gui len chi
dung de doi chieu. Lech nhau thi van luu nhung `score_verified = False`, va van
do khong duoc len bang xep hang.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from datetime import UTC, datetime
from typing import Any

from app.modules.gameplay.application.dto import FinishedRun
from app.modules.gameplay.application.ports import GameplayUnitOfWork, RunVerifier
from app.modules.gameplay.domain.exceptions import (
    NoVerifierForMode,
    RunAlreadyFinished,
    RunNotFound,
    RunNotOwned,
)
from app.modules.gameplay.domain.value_objects import GameMode, RunStatus
from app.shared.ids import PlayerId, RunId


class FinishRun:
    def __init__(
        self,
        uow_factory: Callable[[], GameplayUnitOfWork],
        verifiers: Mapping[GameMode, RunVerifier],
        clock: Callable[[], datetime] = lambda: datetime.now(UTC),
    ) -> None:
        self._uow_factory = uow_factory
        self._verifiers = verifiers
        self._clock = clock

    async def execute(
        self,
        *,
        run_id: RunId,
        player_id: PlayerId,
        client_score: int,
        payload: Mapping[str, Any],
    ) -> FinishedRun:
        now = self._clock()

        async with self._uow_factory() as uow:
            run = await uow.runs.get(run_id)
            if run is None:
                raise RunNotFound()
            if run.player_id != player_id:
                # Khong tiet lo van choi co ton tai hay khong cho nguoi khong so huu.
                raise RunNotOwned()
            if run.status is not RunStatus.PLAYING:
                # Chan TRUOC khi goi verifier: neu de verifier ghi truoc roi moi phat
                # hien, ta se nhan IntegrityError cua DB thay vi mot loi nghiep vu ro rang.
                raise RunAlreadyFinished(f"Van choi da o trang thai {run.status}")

            verifier = self._verifiers.get(run.mode)
            if verifier is None:
                raise NoVerifierForMode(f"Che do '{run.mode}' chua co bo cham diem")

            duration_ms = run.elapsed_ms(now)
            result = await verifier.record(
                uow.session,
                run_id=run.id,
                player_id=run.player_id,
                payload=payload,
                duration_ms=duration_ms,
            )

            verified = result.verified and result.score == client_score
            reason = result.reason
            if result.verified and not verified:
                reason = f"Diem client ({client_score}) khac diem server ({result.score})"

            run.finish(score=result.score, verified=verified, now=now)
            await uow.runs.save(run)
            await uow.commit()

        return FinishedRun(run=run, client_score=client_score, reason=reason)
