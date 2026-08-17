"""Hop dong repository cua mien vo co (phia doc)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

from app.shared.ids import PlayerId


@dataclass(frozen=True, slots=True)
class CompoundInfo:
    cation_id: str
    anion_id: str
    formula: str
    name: str
    type: str
    total: int


@dataclass(frozen=True, slots=True)
class MasteryRow:
    compound: CompoundInfo
    times_made: int
    first_made_at: datetime | None
    last_made_at: datetime | None


class CompoundCatalogRepository(Protocol):
    async def list_compounds(self) -> list[CompoundInfo]: ...

    async def mastery_for(self, player_id: PlayerId, only_made: bool) -> list[MasteryRow]: ...
