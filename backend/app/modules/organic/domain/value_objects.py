"""Value object cua mien huu co."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

from app.modules.organic.domain.exceptions import InvalidOrganicPayload


class Difficulty(StrEnum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class EndReason(StrEnum):
    TIMEOUT = "timeout"
    COMPLETE = "complete"


# Nguon: frontend/src/feature/organic/organic-engine.ts -> DIFFICULTIES
DIFFICULTY_SECONDS: dict[Difficulty, int] = {
    Difficulty.EASY: 30,
    Difficulty.MEDIUM: 45,
    Difficulty.HARD: 60,
}
DIFFICULTY_CARBONS: dict[Difficulty, tuple[int, ...]] = {
    Difficulty.EASY: (4, 5),
    Difficulty.MEDIUM: (6,),
    Difficulty.HARD: (7,),
}


@dataclass(frozen=True, slots=True)
class IsomerHit:
    canonical_key: str
    gained: int
    bonus: int
    at_ms: int


@dataclass(frozen=True, slots=True)
class OrganicPayload:
    difficulty: Difficulty
    carbons: int
    total_count: int
    won: bool
    end_reason: EndReason
    hits: tuple[IsomerHit, ...]

    @property
    def limit_ms(self) -> int:
        return DIFFICULTY_SECONDS[self.difficulty] * 1000

    @classmethod
    def parse(cls, raw: Mapping[str, Any]) -> OrganicPayload:
        try:
            hits_raw: Sequence[Mapping[str, Any]] = raw["isomers"]
            payload = cls(
                difficulty=Difficulty(str(raw["difficulty"])),
                carbons=int(raw["carbons"]),
                total_count=int(raw["total_count"]),
                won=bool(raw["won"]),
                end_reason=EndReason(str(raw["end_reason"])),
                hits=tuple(
                    IsomerHit(
                        canonical_key=str(hit["canonical_key"]),
                        gained=int(hit["gained"]),
                        bonus=int(hit["bonus"]),
                        at_ms=int(hit["at_ms"]),
                    )
                    for hit in hits_raw
                ),
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise InvalidOrganicPayload(f"Goi du lieu van huu co khong hop le: {exc}") from exc

        if payload.carbons < 1 or payload.total_count < 1:
            raise InvalidOrganicPayload("So cacbon hoac so dong phan vo nghia")
        if any(hit.at_ms < 0 or hit.gained < 0 or hit.bonus < 0 for hit in payload.hits):
            raise InvalidOrganicPayload("Diem hoac moc thoi gian am")
        return payload
