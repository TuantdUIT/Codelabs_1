"""Nap danh muc dong phan tu shared/chemistry.json."""

from __future__ import annotations

from pathlib import Path

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.chemistry_file import load_chemistry
from app.modules.organic.infrastructure.models import IsomerModel


async def seed_isomers(session: AsyncSession, path: Path | None = None) -> int:
    data = load_chemistry(path)
    isomers = data["isomers"]
    if not isomers:
        return 0

    await session.execute(
        insert(IsomerModel)
        .values(isomers)
        .on_conflict_do_update(
            index_elements=["canonical_key"],
            set_={
                "carbons": insert(IsomerModel).excluded.carbons,
                "formula": insert(IsomerModel).excluded.formula,
                "iupac_name": insert(IsomerModel).excluded.iupac_name,
            },
        )
    )
    return len(isomers)
