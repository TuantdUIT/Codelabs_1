"""Aggregate root cua mien gameplay: mot van choi."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from app.modules.gameplay.domain.events import RunFinished, RunStarted
from app.modules.gameplay.domain.exceptions import RunAlreadyFinished
from app.modules.gameplay.domain.value_objects import GameMode, RunStatus
from app.shared.entity import AggregateRoot
from app.shared.ids import PlayerId, RunId


@dataclass(eq=False, kw_only=True)
class GameRun(AggregateRoot):
    id: RunId
    player_id: PlayerId
    mode: GameMode
    status: RunStatus
    seed: int
    score: int
    score_verified: bool
    started_at: datetime
    ended_at: datetime | None = None
    duration_ms: int | None = None
    client_version: str

    @classmethod
    def start(
        cls,
        *,
        run_id: RunId,
        player_id: PlayerId,
        mode: GameMode,
        seed: int,
        now: datetime,
        client_version: str,
    ) -> GameRun:
        run = cls(
            id=run_id,
            player_id=player_id,
            mode=mode,
            status=RunStatus.PLAYING,
            seed=seed,
            score=0,
            score_verified=False,
            started_at=now,
            client_version=client_version,
        )
        run.record(RunStarted(run_id=run_id, player_id=player_id, mode=mode))
        return run

    def elapsed_ms(self, now: datetime) -> int:
        """Thoi luong do BANG DONG HO SERVER, khong lay so client gui len."""
        return max(0, int((now - self.started_at).total_seconds() * 1000))

    def finish(self, *, score: int, verified: bool, now: datetime) -> None:
        if self.status is not RunStatus.PLAYING:
            raise RunAlreadyFinished(f"Van choi da o trang thai {self.status}")
        self.status = RunStatus.FINISHED
        self.score = score
        self.score_verified = verified
        self.ended_at = now
        self.duration_ms = self.elapsed_ms(now)
        self.record(
            RunFinished(run_id=self.id, player_id=self.player_id, score=score, verified=verified)
        )

    def abandon(self, now: datetime) -> None:
        if self.status is not RunStatus.PLAYING:
            return
        self.status = RunStatus.ABANDONED
        self.ended_at = now
        self.duration_ms = self.elapsed_ms(now)
