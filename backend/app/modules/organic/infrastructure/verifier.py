"""Adapter cham diem van huu co."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.gameplay.public import GameMode, VerifyResult
from app.modules.organic.domain.scoring import verify_run
from app.modules.organic.domain.value_objects import OrganicPayload
from app.modules.organic.infrastructure.models import IsomerModel, RunIsomerModel, RunOrganicModel
from app.shared.ids import PlayerId, RunId


class OrganicRunVerifier:
    mode = GameMode.ORGANIC

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
        parsed = OrganicPayload.parse(payload)

        known = await self._known_keys(db, parsed.carbons)
        report = verify_run(parsed, known_keys=known, duration_ms=duration_ms)
        await self._store(db, run_id, parsed, known)

        return VerifyResult(
            score=report.score,
            verified=report.ok,
            reason=None if report.ok else "; ".join(report.problems[:3]),
        )

    async def _known_keys(self, db: AsyncSession, carbons: int) -> set[str]:
        stmt = select(IsomerModel.canonical_key).where(IsomerModel.carbons == carbons)
        return set((await db.execute(stmt)).scalars())

    async def _store(
        self, db: AsyncSession, run_id: RunId, payload: OrganicPayload, known: set[str]
    ) -> None:
        accepted = [hit for hit in payload.hits if hit.canonical_key in known]
        # Loai trung: rang buoc uq_run_isomer_key khong cho mot dong phan hai dong
        unique: dict[str, Any] = {}
        for hit in accepted:
            unique.setdefault(hit.canonical_key, hit)

        db.add(
            RunOrganicModel(
                run_id=run_id,
                difficulty=payload.difficulty.value,
                carbons=payload.carbons,
                found_count=len(unique),
                total_count=payload.total_count,
                won=payload.won,
                end_reason=payload.end_reason.value,
            )
        )
        await db.flush()

        for seq, hit in enumerate(unique.values()):
            db.add(
                RunIsomerModel(
                    run_id=run_id,
                    seq=seq,
                    canonical_key=hit.canonical_key,
                    gained=hit.gained,
                    bonus=hit.bonus,
                    at_ms=hit.at_ms,
                )
            )
        await db.flush()
