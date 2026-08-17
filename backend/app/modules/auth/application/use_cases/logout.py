"""Use case: dang xuat — thu hoi phien hien tai. Goi nhieu lan van an toan."""

from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime

from app.core.security import hash_refresh_token
from app.modules.auth.application.ports import AuthUnitOfWork


class Logout:
    def __init__(
        self,
        uow_factory: Callable[[], AuthUnitOfWork],
        clock: Callable[[], datetime] = lambda: datetime.now(UTC),
    ) -> None:
        self._uow_factory = uow_factory
        self._clock = clock

    async def execute(self, raw_token: str | None) -> None:
        if not raw_token:
            return
        now = self._clock()
        async with self._uow_factory() as uow:
            session = await uow.sessions.get_by_token_hash(hash_refresh_token(raw_token))
            if session is None:
                return
            await uow.sessions.revoke(session.id, now)
            await uow.commit()
