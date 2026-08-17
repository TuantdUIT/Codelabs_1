"""Unit of Work chung: mot transaction cho mot request.

Module nghiep vu ke thua lop nay va gan them cac repository cua rieng no.
"""

from __future__ import annotations

from types import TracebackType

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.database import SessionFactory


class SqlAlchemyUnitOfWork:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession] | None = None) -> None:
        self._session_factory = session_factory or SessionFactory
        self._session: AsyncSession | None = None

    @property
    def session(self) -> AsyncSession:
        if self._session is None:
            raise RuntimeError("UnitOfWork chua duoc mo — dung `async with uow:`")
        return self._session

    async def __aenter__(self) -> SqlAlchemyUnitOfWork:
        self._session = self._session_factory()
        self._build_repositories()
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        try:
            if exc is not None:
                await self.session.rollback()
        finally:
            await self.session.close()
            self._session = None

    def _build_repositories(self) -> None:
        """Lop con ghi de de gan repository."""

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()
