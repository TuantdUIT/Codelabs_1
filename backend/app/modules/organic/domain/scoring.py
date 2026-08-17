"""Luat tinh diem che do huu co — ban sao cua engine TypeScript.

Nguon: frontend/src/feature/organic/organic-engine.ts (checkStructure)
    bonus  = Math.round(200 * remaining / limitMs)
    gained = 100 + bonus
    giai duoc thi dong ho reset ve limitMs

Vi dong ho reset sau moi lan giai, server tinh lai duoc `remaining` tu cac moc
`at_ms`: remaining_i = limitMs - (at_ms_i - at_ms_{i-1}). Nho vay diem huu co
kiem chung duoc chinh xac chu khong chi chan bien.
"""

from __future__ import annotations

import math
from collections.abc import Iterable
from dataclasses import dataclass

from app.modules.organic.domain.value_objects import OrganicPayload

SOLVE_BASE = 100
MAX_TIME_BONUS = 200

# Do lech cho phep giua diem client va diem server tinh lai: dong ho client chay
# theo khung hinh nen moc thoi gian xe dich vai chuc ms.
BONUS_TOLERANCE = 4


def _round_half_up(value: float) -> int:
    """Math.round cua JS lam tron 0.5 LEN, con round() cua Python lam tron chan."""
    return math.floor(value + 0.5)


def time_bonus(remaining_ms: int, limit_ms: int) -> int:
    if limit_ms <= 0:
        return 0
    clamped = min(max(remaining_ms, 0), limit_ms)
    return _round_half_up(MAX_TIME_BONUS * clamped / limit_ms)


@dataclass(frozen=True, slots=True)
class ScoreReport:
    score: int
    problems: tuple[str, ...]

    @property
    def ok(self) -> bool:
        return not self.problems


def verify_run(payload: OrganicPayload, *, known_keys: Iterable[str], duration_ms: int) -> ScoreReport:
    """Tinh lai diem va soat cac bat thuong.

    `known_keys` la tap khoa dang cau hop le cua so cacbon nay, doc tu bang `isomer`.
    """
    problems: list[str] = []
    valid_keys = set(known_keys)
    limit_ms = payload.limit_ms

    score = 0
    previous_at = 0
    seen: set[str] = set()

    for index, hit in enumerate(payload.hits):
        if hit.canonical_key not in valid_keys:
            problems.append(f"Dong phan khong thuoc C{payload.carbons}: {hit.canonical_key}")
            continue
        if hit.canonical_key in seen:
            problems.append(f"Dong phan bi tinh diem hai lan: {hit.canonical_key}")
            continue
        seen.add(hit.canonical_key)

        if hit.at_ms <= previous_at and index > 0:
            problems.append(f"Moc thoi gian khong tang dan tai dong phan #{index}")
        if duration_ms and hit.at_ms > duration_ms:
            problems.append(f"Dong phan #{index} xay ra sau khi van da ket thuc")

        expected_bonus = time_bonus(limit_ms - (hit.at_ms - previous_at), limit_ms)
        if abs(expected_bonus - hit.bonus) > BONUS_TOLERANCE:
            problems.append(
                f"Thuong thoi gian #{index} lech: client {hit.bonus}, server {expected_bonus}"
            )
        if hit.gained != SOLVE_BASE + hit.bonus:
            problems.append(f"Diem #{index} khong bang 100 + thuong")

        previous_at = hit.at_ms
        score += SOLVE_BASE + expected_bonus

    if len(seen) > payload.total_count:
        problems.append("So dong phan tim duoc vuot qua tong so dong phan cua de bai")
    if payload.won and len(seen) != payload.total_count:
        problems.append("Bao thang nhung chua du dong phan")

    return ScoreReport(score=score, problems=tuple(problems))
