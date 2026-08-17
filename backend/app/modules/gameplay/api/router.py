"""HTTP cua module gameplay."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Query

from app.container import gameplay_uow_factory, player_directory, run_verifiers
from app.modules.auth.public import CurrentPlayer
from app.modules.gameplay.api.schemas import (
    FinishRunIn,
    FinishRunOut,
    LeaderboardRowOut,
    RunOut,
    StartRunIn,
    StartRunOut,
)
from app.modules.gameplay.application.use_cases.finish_run import FinishRun
from app.modules.gameplay.application.use_cases.get_leaderboard import (
    GetLeaderboard,
    ListMyRuns,
    Period,
)
from app.modules.gameplay.application.use_cases.start_run import StartRun
from app.modules.gameplay.domain.value_objects import GameMode
from app.shared.ids import PlayerId, RunId

router = APIRouter(prefix="/runs", tags=["gameplay"])
leaderboard_router = APIRouter(prefix="/leaderboard", tags=["gameplay"])


@router.post("", response_model=StartRunOut, status_code=201)
async def start_run(body: StartRunIn, player: CurrentPlayer) -> StartRunOut:
    started = await StartRun(gameplay_uow_factory).execute(
        player_id=PlayerId(player.id), mode=body.mode, client_version=body.client_version
    )
    return StartRunOut(
        run_id=started.run.id, seed=started.seed, started_at=started.run.started_at
    )


@router.post("/{run_id}/finish", response_model=FinishRunOut)
async def finish_run(run_id: UUID, body: FinishRunIn, player: CurrentPlayer) -> FinishRunOut:
    finished = await FinishRun(gameplay_uow_factory, run_verifiers()).execute(
        run_id=RunId(run_id),
        player_id=PlayerId(player.id),
        client_score=body.score,
        payload=body.payload,
    )
    return FinishRunOut(
        run=RunOut.from_entity(finished.run),
        score=finished.run.score,
        score_verified=finished.run.score_verified,
        reason=finished.reason,
    )


@router.get("/me", response_model=list[RunOut])
async def my_runs(player: CurrentPlayer, limit: int = Query(20, ge=1, le=100)) -> list[RunOut]:
    runs = await ListMyRuns(gameplay_uow_factory).execute(player_id=PlayerId(player.id), limit=limit)
    return [RunOut.from_entity(run) for run in runs]


@leaderboard_router.get("", response_model=list[LeaderboardRowOut])
async def leaderboard(
    mode: GameMode | None = None,
    period: Period = Period.ALL,
    limit: int = Query(20, ge=1, le=100),
) -> list[LeaderboardRowOut]:
    """Cong khai — khong can dang nhap moi xem duoc bang xep hang."""
    rows = await GetLeaderboard(gameplay_uow_factory, player_directory()).execute(
        mode=mode, period=period, limit=limit
    )
    return [LeaderboardRowOut.from_row(row) for row in rows]
