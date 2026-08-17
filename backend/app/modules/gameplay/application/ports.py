"""Cong ra ben ngoai cua tang application (gameplay)."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from types import TracebackType
from typing import Any, Protocol

from app.modules.gameplay.domain.repositories import GameRunRepository
from app.modules.gameplay.domain.value_objects import GameMode, VerifyResult
from app.shared.ids import PlayerId, RunId


class RunVerifier(Protocol):
    """Module chuyen biet (inorganic/organic) cam vao day de cham diem van choi.

    `session` la doi tuong transaction do gameplay dang mo, chuyen tiep nguyen ven
    sang adapter. Tang application coi no la mot the mo (`Any`) va KHONG duoc
    dung truc tiep — nho vay chi tiet van choi va ban ghi `game_run` cung nam
    trong MOT transaction, hong o giua thi ca hai cung khong duoc ghi.
    """

    mode: GameMode

    async def record(
        self,
        session: Any,
        *,
        run_id: RunId,
        player_id: PlayerId,
        payload: Mapping[str, Any],
        duration_ms: int,
    ) -> VerifyResult: ...


class PlayerName(Protocol):
    """Phan thong tin nguoi choi ma gameplay can — vua du de hien bang xep hang."""

    display_name: str
    avatar_url: str | None


class PlayerDirectory(Protocol):
    """Cong tra ten nguoi choi. Adapter thuc te nam o container, goi sang module auth."""

    async def summaries(self, player_ids: Sequence[PlayerId]) -> Mapping[PlayerId, PlayerName]: ...


class GameplayUnitOfWork(Protocol):
    runs: GameRunRepository

    @property
    def session(self) -> Any:
        """The transaction, chi de chuyen tiep cho RunVerifier."""
        ...

    async def __aenter__(self) -> GameplayUnitOfWork: ...

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None: ...

    async def commit(self) -> None: ...
