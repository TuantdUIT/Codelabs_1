"""DTO cua tang application (gameplay)."""

from __future__ import annotations

from dataclasses import dataclass

from app.modules.gameplay.domain.entities import GameRun


@dataclass(frozen=True, slots=True)
class StartedRun:
    run: GameRun
    """Hat giong RNG server cap — client phai dung dung so nay de van choi phat lai duoc."""
    seed: int


@dataclass(frozen=True, slots=True)
class FinishedRun:
    run: GameRun
    """Diem client tu tinh, giu lai de doi chieu/gay loi khi lech."""
    client_score: int
    reason: str | None
