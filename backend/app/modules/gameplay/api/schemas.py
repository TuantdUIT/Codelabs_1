"""Schema HTTP cua module gameplay."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.gameplay.domain.entities import GameRun
from app.modules.gameplay.domain.repositories import LeaderboardRow
from app.modules.gameplay.domain.value_objects import GameMode


class StartRunIn(BaseModel):
    mode: GameMode
    client_version: str = Field(default="dev", max_length=40)


class StartRunOut(BaseModel):
    run_id: UUID
    seed: int
    started_at: datetime


class FinishRunIn(BaseModel):
    """`payload` do module chuyen biet dinh nghia — gameplay khong doc noi dung."""

    score: int = Field(ge=0, description="Diem client tu tinh, chi de doi chieu")
    payload: dict[str, Any]


class RunOut(BaseModel):
    id: UUID
    mode: GameMode
    status: str
    score: int
    score_verified: bool
    started_at: datetime
    ended_at: datetime | None
    duration_ms: int | None

    @classmethod
    def from_entity(cls, run: GameRun) -> RunOut:
        return cls(
            id=run.id,
            mode=run.mode,
            status=run.status.value,
            score=run.score,
            score_verified=run.score_verified,
            started_at=run.started_at,
            ended_at=run.ended_at,
            duration_ms=run.duration_ms,
        )


class FinishRunOut(BaseModel):
    run: RunOut
    """Diem server tu tinh — day moi la diem duoc luu."""
    score: int
    score_verified: bool
    reason: str | None = None


class LeaderboardRowOut(BaseModel):
    rank: int
    player_id: UUID
    display_name: str
    avatar_url: str | None
    best_score: int
    runs: int
    achieved_at: datetime

    @classmethod
    def from_row(cls, row: LeaderboardRow) -> LeaderboardRowOut:
        return cls(
            rank=row.rank,
            player_id=row.player_id,
            display_name=row.display_name,
            avatar_url=row.avatar_url,
            best_score=row.best_score,
            runs=row.runs,
            achieved_at=row.achieved_at,
        )
