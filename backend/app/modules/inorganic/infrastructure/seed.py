"""Nap danh muc ion/hop chat tu shared/chemistry.json.

File JSON do `npm run export:chemistry` ben frontend sinh ra tu chinh ions.ts va
chemistry.ts. Khong bao gio go tay cong thuc hoa hoc o phia Python.
"""

from __future__ import annotations

from pathlib import Path

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.chemistry_file import load_chemistry
from app.modules.inorganic.infrastructure.models import CompoundModel, IonModel


async def seed_chemistry(session: AsyncSession, path: Path | None = None) -> tuple[int, int]:
    """Nap (idempotent) bang `ion` va `compound`. Tra ve (so ion, so hop chat)."""
    data = load_chemistry(path)

    ions = data["ions"]
    if ions:
        await session.execute(
            insert(IonModel)
            .values(ions)
            .on_conflict_do_update(
                index_elements=["id"],
                set_={
                    "type": insert(IonModel).excluded.type,
                    "symbol": insert(IonModel).excluded.symbol,
                    "charge": insert(IonModel).excluded.charge,
                    "name": insert(IonModel).excluded.name,
                    "polyatomic": insert(IonModel).excluded.polyatomic,
                    "acid_name": insert(IonModel).excluded.acid_name,
                },
            )
        )

    compounds = data["compounds"]
    if compounds:
        await session.execute(
            insert(CompoundModel)
            .values(compounds)
            .on_conflict_do_update(
                index_elements=["cation_id", "anion_id"],
                set_={
                    "formula": insert(CompoundModel).excluded.formula,
                    "name": insert(CompoundModel).excluded.name,
                    "type": insert(CompoundModel).excluded.type,
                    "cat_sub": insert(CompoundModel).excluded.cat_sub,
                    "an_sub": insert(CompoundModel).excluded.an_sub,
                    "total": insert(CompoundModel).excluded.total,
                },
            )
        )

    return len(ions), len(compounds)
