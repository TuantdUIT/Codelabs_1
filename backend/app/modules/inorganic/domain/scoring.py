"""Luat tinh diem che do vo co — ban sao chinh xac cua engine TypeScript.

Nguon: frontend/src/feature/in-organic/engine.ts
    gained = 25 + (compound.total - 2) * 15 + dropped * 10
    don sach luoi: +100

File nay thuan, khong DB, khong framework — test duoc truc tiep.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

from app.modules.inorganic.domain.rules import MIN_MS_BETWEEN_HITS
from app.modules.inorganic.domain.value_objects import CompoundKey, InorganicPayload

COMPOUND_BASE = 25
POINTS_PER_EXTRA_CELL = 15
POINTS_PER_DROPPED = 10
CLEAR_GRID_BONUS = 100


def compound_points(total: int, dropped: int) -> int:
    """`total` = so o bong bong hop chat chiem (catSub + anSub)."""
    return COMPOUND_BASE + (total - 2) * POINTS_PER_EXTRA_CELL + dropped * POINTS_PER_DROPPED


@dataclass(frozen=True, slots=True)
class ScoreReport:
    score: int
    problems: tuple[str, ...]

    @property
    def ok(self) -> bool:
        return not self.problems


def verify_run(
    payload: InorganicPayload,
    *,
    compound_totals: Mapping[CompoundKey, int],
    duration_ms: int,
) -> ScoreReport:
    """Tinh lai diem tu du lieu server tu tra ra, kem cac diem bat thuong.

    `compound_totals` doc tu bang `compound` — KHONG lay `total` do client gui.
    """
    problems: list[str] = []
    score = 0
    previous_at = -1

    for index, hit in enumerate(payload.hits):
        total = compound_totals.get(hit.key)
        if total is None:
            problems.append(f"Hop chat khong ton tai: {hit.key}")
            continue

        if hit.key.cation_id not in payload.chosen_ions or hit.key.anion_id not in payload.chosen_ions:
            problems.append(f"Ion khong nam trong bo da chon: {hit.key}")
            continue

        if hit.at_ms <= previous_at:
            problems.append(f"Moc thoi gian khong tang dan tai hop chat #{index}")
        elif hit.at_ms - previous_at < MIN_MS_BETWEEN_HITS and previous_at >= 0:
            problems.append(f"Hai hop chat cach nhau qua ngan tai #{index}")
        previous_at = hit.at_ms

        if duration_ms and hit.at_ms > duration_ms:
            problems.append(f"Hop chat #{index} xay ra sau khi van da ket thuc")

        score += compound_points(total, hit.dropped)

    score += payload.grids_cleared * CLEAR_GRID_BONUS
    return ScoreReport(score=score, problems=tuple(problems))
