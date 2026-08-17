"""Fixture dung chung cho test tich hop (can Postgres that)."""

from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass

import pytest_asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base

# Import het models cua moi module de Base.metadata day du bang.
import app.modules.auth.infrastructure.models  # noqa: F401
import app.modules.gameplay.infrastructure.models  # noqa: F401
import app.modules.inorganic.infrastructure.models  # noqa: F401
import app.modules.organic.infrastructure.models  # noqa: F401
from app.modules.auth.infrastructure.repositories import AuthUnitOfWork
from app.modules.gameplay.infrastructure.repositories import GameplayUnitOfWork
from app.modules.inorganic.infrastructure.repositories import InorganicUnitOfWork
from app.modules.inorganic.infrastructure.seed import seed_chemistry
from app.modules.organic.infrastructure.seed import seed_isomers


@dataclass(frozen=True)
class Factories:
    session: async_sessionmaker
    auth: object
    gameplay: object
    inorganic: object


@pytest_asyncio.fixture
async def factories() -> AsyncIterator[Factories]:
    engine = create_async_engine(settings.TEST_DATABASE_URL, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)

    # Danh muc ion/hop chat/dong phan lay tu shared/chemistry.json, dung nguon
    # ma engine TypeScript dang dung.
    async with session_factory() as session:
        await seed_chemistry(session)
        await seed_isomers(session)
        await session.commit()

    yield Factories(
        session=session_factory,
        auth=lambda: AuthUnitOfWork(session_factory),
        gameplay=lambda: GameplayUnitOfWork(session_factory),
        inorganic=lambda: InorganicUnitOfWork(session_factory),
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
