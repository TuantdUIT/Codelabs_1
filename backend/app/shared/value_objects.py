"""Value object dung chung. Cac module gameplay/inorganic/organic se dung lai."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Score:
    value: int

    def __post_init__(self) -> None:
        if self.value < 0:
            raise ValueError("Diem khong the am")

    def __add__(self, other: Score) -> Score:
        return Score(self.value + other.value)


@dataclass(frozen=True, slots=True)
class Duration:
    milliseconds: int

    def __post_init__(self) -> None:
        if self.milliseconds < 0:
            raise ValueError("Thoi luong khong the am")

    @property
    def seconds(self) -> float:
        return self.milliseconds / 1000
