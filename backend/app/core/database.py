"""Engine + session factory dung chung cho moi module."""

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """Base khai bao chung. Alembic gom metadata tu day."""


def create_engine(url: str | None = None) -> AsyncEngine:
    return create_async_engine(url or settings.DATABASE_URL, pool_pre_ping=True, future=True)


engine: AsyncEngine = create_engine()

SessionFactory: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine,
    expire_on_commit=False,
    autoflush=False,
)
