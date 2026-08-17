"""Value object cua mien gameplay."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class GameMode(StrEnum):
    INORGANIC = "inorganic"
    ORGANIC = "organic"


class RunStatus(StrEnum):
    PLAYING = "playing"
    FINISHED = "finished"
    ABANDONED = "abandoned"


@dataclass(frozen=True, slots=True)
class VerifyResult:
    """Ket qua cham diem do module chuyen biet tra ve.

    `score` LUON la diem server tu tinh — diem client gui len chi dung de doi chieu.
    """

    score: int
    verified: bool
    reason: str | None = None

    def __post_init__(self) -> None:
        if self.score < 0:
            raise ValueError("Diem khong the am")
        if self.verified and self.reason is not None:
            raise ValueError("Da verified thi khong con ly do that bai")
