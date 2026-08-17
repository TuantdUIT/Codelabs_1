"""Value object cua mien vo co, ke ca goi du lieu client nop len."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any

from app.modules.inorganic.domain.exceptions import InvalidInorganicPayload


@dataclass(frozen=True, slots=True)
class CompoundKey:
    cation_id: str
    anion_id: str

    def __str__(self) -> str:
        return f"{self.cation_id}+{self.anion_id}"


@dataclass(frozen=True, slots=True)
class CompoundHit:
    """Mot lan ghep thanh cong hop chat trong van choi."""

    key: CompoundKey
    dropped: int
    at_ms: int


@dataclass(frozen=True, slots=True)
class InorganicPayload:
    level_reached: int
    rows_dropped: int
    grids_cleared: int
    cation_ids: tuple[str, ...]
    anion_ids: tuple[str, ...]
    hits: tuple[CompoundHit, ...]

    @property
    def chosen_ions(self) -> frozenset[str]:
        return frozenset(self.cation_ids) | frozenset(self.anion_ids)

    @classmethod
    def parse(cls, raw: Mapping[str, Any]) -> InorganicPayload:
        """Doc goi JSON tho. Sai cau truc thi 400 luon, khong co doan mo y client."""
        try:
            hits_raw: Sequence[Mapping[str, Any]] = raw["compounds"]
            payload = cls(
                level_reached=int(raw["level_reached"]),
                rows_dropped=int(raw["rows_dropped"]),
                grids_cleared=int(raw["grids_cleared"]),
                cation_ids=tuple(str(i) for i in raw["cation_ids"]),
                anion_ids=tuple(str(i) for i in raw["anion_ids"]),
                hits=tuple(
                    CompoundHit(
                        key=CompoundKey(str(hit["cation_id"]), str(hit["anion_id"])),
                        dropped=int(hit["dropped"]),
                        at_ms=int(hit["at_ms"]),
                    )
                    for hit in hits_raw
                ),
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise InvalidInorganicPayload(f"Goi du lieu van vo co khong hop le: {exc}") from exc

        if payload.level_reached < 1 or payload.rows_dropped < 0 or payload.grids_cleared < 0:
            raise InvalidInorganicPayload("Chi so van choi am hoac vo nghia")
        if any(hit.dropped < 0 or hit.at_ms < 0 for hit in payload.hits):
            raise InvalidInorganicPayload("Moc thoi gian hoac so bong roi am")
        return payload
