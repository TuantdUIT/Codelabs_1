"""Schema HTTP cua module vo co."""

from __future__ import annotations

from dataclasses import asdict
from datetime import datetime

from pydantic import BaseModel

from app.modules.inorganic.domain.repositories import CompoundInfo, MasteryRow


class CompoundOut(BaseModel):
    cation_id: str
    anion_id: str
    formula: str
    name: str
    type: str
    total: int

    @classmethod
    def from_info(cls, info: CompoundInfo) -> CompoundOut:
        # `asdict` chu khong phai `vars`: CompoundInfo la dataclass slots=True nen
        # khong co __dict__.
        return cls(**asdict(info))


class MasteryOut(BaseModel):
    compound: CompoundOut
    times_made: int
    first_made_at: datetime | None
    last_made_at: datetime | None

    @classmethod
    def from_row(cls, row: MasteryRow) -> MasteryOut:
        return cls(
            compound=CompoundOut.from_info(row.compound),
            times_made=row.times_made,
            first_made_at=row.first_made_at,
            last_made_at=row.last_made_at,
        )
