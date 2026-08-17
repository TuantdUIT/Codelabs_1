"""Adapter cham diem van vo co — cam vao cong `RunVerifier` cua gameplay.

Chay tren DUNG transaction ma gameplay dang mo, nen chi tiet van choi va ban ghi
`game_run` hoac cung duoc ghi, hoac cung khong.
"""

from __future__ import annotations

from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.gameplay.public import GameMode, VerifyResult
from app.modules.inorganic.domain.scoring import compound_points, verify_run
from app.modules.inorganic.domain.value_objects import CompoundKey, InorganicPayload
from app.modules.inorganic.infrastructure.models import (
    CompoundModel,
    PlayerCompoundStatModel,
    RunCompoundModel,
    RunInorganicModel,
    RunIonChoiceModel,
)
from app.shared.ids import PlayerId, RunId


class InorganicRunVerifier:
    mode = GameMode.INORGANIC

    async def record(
        self,
        session: Any,
        *,
        run_id: RunId,
        player_id: PlayerId,
        payload: Mapping[str, Any],
        duration_ms: int,
    ) -> VerifyResult:
        db: AsyncSession = session
        parsed = InorganicPayload.parse(payload)

        totals = await self._load_totals(db, parsed)
        report = verify_run(parsed, compound_totals=totals, duration_ms=duration_ms)

        await self._store(db, run_id, parsed, totals)
        if report.ok:
            await self._bump_mastery(db, player_id, parsed)

        return VerifyResult(
            score=report.score,
            verified=report.ok,
            reason=None if report.ok else "; ".join(report.problems[:3]),
        )

    async def _load_totals(
        self, db: AsyncSession, payload: InorganicPayload
    ) -> dict[CompoundKey, int]:
        keys = {hit.key for hit in payload.hits}
        if not keys:
            return {}
        stmt = select(CompoundModel.cation_id, CompoundModel.anion_id, CompoundModel.total).where(
            CompoundModel.cation_id.in_({k.cation_id for k in keys}),
            CompoundModel.anion_id.in_({k.anion_id for k in keys}),
        )
        rows = (await db.execute(stmt)).all()
        return {CompoundKey(row.cation_id, row.anion_id): row.total for row in rows}

    async def _store(
        self,
        db: AsyncSession,
        run_id: RunId,
        payload: InorganicPayload,
        totals: Mapping[CompoundKey, int],
    ) -> None:
        db.add(
            RunInorganicModel(
                run_id=run_id,
                level_reached=payload.level_reached,
                compounds_made=len(payload.hits),
                rows_dropped=payload.rows_dropped,
                grids_cleared=payload.grids_cleared,
            )
        )
        await db.flush()

        for slot, ion_id in enumerate([*payload.cation_ids, *payload.anion_ids]):
            db.add(RunIonChoiceModel(run_id=run_id, ion_id=ion_id, slot=slot))

        for seq, hit in enumerate(payload.hits):
            total = totals.get(hit.key)
            if total is None:
                continue  # hop chat khong ton tai: da ghi nhan o `problems`, khong luu dong rac
            db.add(
                RunCompoundModel(
                    run_id=run_id,
                    seq=seq,
                    cation_id=hit.key.cation_id,
                    anion_id=hit.key.anion_id,
                    gained=compound_points(total, hit.dropped),
                    dropped=hit.dropped,
                    at_ms=hit.at_ms,
                )
            )
        await db.flush()

    async def _bump_mastery(
        self, db: AsyncSession, player_id: PlayerId, payload: InorganicPayload
    ) -> None:
        now = datetime.now(UTC)
        counts: dict[CompoundKey, int] = {}
        for hit in payload.hits:
            counts[hit.key] = counts.get(hit.key, 0) + 1

        for key, times in counts.items():
            stmt = (
                insert(PlayerCompoundStatModel)
                .values(
                    player_id=player_id,
                    cation_id=key.cation_id,
                    anion_id=key.anion_id,
                    times_made=times,
                    first_made_at=now,
                    last_made_at=now,
                )
                .on_conflict_do_update(
                    index_elements=["player_id", "cation_id", "anion_id"],
                    set_={
                        "times_made": PlayerCompoundStatModel.times_made + times,
                        "last_made_at": now,
                    },
                )
            )
            await db.execute(stmt)
