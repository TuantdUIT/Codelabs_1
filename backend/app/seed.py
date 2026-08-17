"""Nap du lieu danh muc vao DB.

Chay: python -m app.seed
Idempotent — chay lai bao nhieu lan cung duoc, chi cap nhat chu khong nhan doi.
"""

from __future__ import annotations

import asyncio

from app.core.database import SessionFactory
from app.modules.gameplay.infrastructure.models import MusicTrackModel
from app.modules.inorganic.infrastructure.seed import seed_chemistry
from app.modules.organic.infrastructure.seed import seed_isomers

# Nguon: frontend/src/feature/music.ts (TRACKS)
MUSIC_TRACKS = [
    {"id": "neon-drop", "name": "Neon Drop"},
    {"id": "hyper-lab", "name": "Hyper Lab"},
    {"id": "arcade-rush", "name": "Arcade Rush"},
    {"id": "ion-storm", "name": "Ion Storm"},
    {"id": "lofi-reaction", "name": "Lo-fi Reaction"},
    {"id": "off", "name": "Tat nhac"},
]


async def main() -> None:
    from sqlalchemy.dialects.postgresql import insert

    async with SessionFactory() as session:
        ions, compounds = await seed_chemistry(session)
        isomers = await seed_isomers(session)
        await session.execute(
            insert(MusicTrackModel)
            .values(MUSIC_TRACKS)
            .on_conflict_do_update(
                index_elements=["id"], set_={"name": insert(MusicTrackModel).excluded.name}
            )
        )
        await session.commit()

    print(f"Da nap: {ions} ion, {compounds} hop chat, {isomers} dong phan, {len(MUSIC_TRACKS)} bai nhac")


if __name__ == "__main__":
    asyncio.run(main())
