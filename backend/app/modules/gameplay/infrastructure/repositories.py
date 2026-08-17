"""Hien thuc repository + Unit of Work cua module gameplay."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Select, desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.unit_of_work import SqlAlchemyUnitOfWork
from app.modules.gameplay.domain.entities import GameRun
from app.modules.gameplay.domain.repositories import LeaderboardEntry
from app.modules.gameplay.domain.value_objects import GameMode, RunStatus
from app.modules.gameplay.infrastructure.models import GameRunModel
from app.shared.ids import PlayerId, RunId


def _to_entity(row: GameRunModel) -> GameRun:
    return GameRun(
        id=RunId(row.id),
        player_id=PlayerId(row.player_id),
        mode=GameMode(row.mode),
        status=RunStatus(row.status),
        seed=row.seed,
        score=row.score,
        score_verified=row.score_verified,
        started_at=row.started_at,
        ended_at=row.ended_at,
        duration_ms=row.duration_ms,
        client_version=row.client_version,
    )


class SqlAlchemyGameRunRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, run: GameRun) -> None:
        self._session.add(
            GameRunModel(
                id=run.id,
                player_id=run.player_id,
                mode=run.mode.value,
                status=run.status.value,
                seed=run.seed,
                score=run.score,
                score_verified=run.score_verified,
                started_at=run.started_at,
                client_version=run.client_version,
            )
        )
        await self._session.flush()

    async def get(self, run_id: RunId) -> GameRun | None:
        row = await self._session.get(GameRunModel, run_id)
        return _to_entity(row) if row else None

    async def save(self, run: GameRun) -> None:
        await self._session.execute(
            update(GameRunModel)
            .where(GameRunModel.id == run.id)
            .values(
                status=run.status.value,
                score=run.score,
                score_verified=run.score_verified,
                ended_at=run.ended_at,
                duration_ms=run.duration_ms,
            )
        )

    async def list_for_player(self, player_id: PlayerId, limit: int) -> list[GameRun]:
        stmt = (
            select(GameRunModel)
            .where(GameRunModel.player_id == player_id)
            .order_by(desc(GameRunModel.started_at))
            .limit(limit)
        )
        return [_to_entity(row) for row in (await self._session.execute(stmt)).scalars()]

    async def leaderboard(
        self, mode: GameMode | None, since: datetime | None, limit: int
    ) -> list[LeaderboardEntry]:
        best = (
            select(
                GameRunModel.player_id.label("player_id"),
                func.max(GameRunModel.score).label("best_score"),
                func.count().label("runs"),
                func.max(GameRunModel.ended_at).label("achieved_at"),
            )
            .where(
                GameRunModel.status == RunStatus.FINISHED.value,
                GameRunModel.score_verified.is_(True),
            )
            .group_by(GameRunModel.player_id)
        )
        if mode is not None:
            best = best.where(GameRunModel.mode == mode.value)
        if since is not None:
            best = best.where(GameRunModel.ended_at >= since)

        sub = best.subquery()
        stmt: Select = (
            select(sub.c.player_id, sub.c.best_score, sub.c.runs, sub.c.achieved_at)
            .order_by(desc(sub.c.best_score), sub.c.achieved_at)
            .limit(limit)
        )

        rows = (await self._session.execute(stmt)).all()
        return [
            LeaderboardEntry(
                player_id=PlayerId(row.player_id),
                best_score=row.best_score,
                runs=row.runs,
                achieved_at=row.achieved_at,
            )
            for row in rows
        ]


class GameplayUnitOfWork(SqlAlchemyUnitOfWork):
    runs: SqlAlchemyGameRunRepository

    def _build_repositories(self) -> None:
        self.runs = SqlAlchemyGameRunRepository(self.session)
