"""Use case: danh muc hop chat va muc do thanh thao cua nguoi choi."""

from __future__ import annotations

from collections.abc import Callable
from types import TracebackType
from typing import Protocol

from app.modules.inorganic.domain.repositories import (
    CompoundCatalogRepository,
    CompoundInfo,
    MasteryRow,
)
from app.shared.ids import PlayerId


class InorganicUnitOfWork(Protocol):
    catalog: CompoundCatalogRepository

    async def __aenter__(self) -> InorganicUnitOfWork: ...

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None: ...


class ListCompounds:
    def __init__(self, uow_factory: Callable[[], InorganicUnitOfWork]) -> None:
        self._uow_factory = uow_factory

    async def execute(self) -> list[CompoundInfo]:
        async with self._uow_factory() as uow:
            return await uow.catalog.list_compounds()


class GetCompoundMastery:
    def __init__(self, uow_factory: Callable[[], InorganicUnitOfWork]) -> None:
        self._uow_factory = uow_factory

    async def execute(self, *, player_id: PlayerId, only_made: bool = False) -> list[MasteryRow]:
        async with self._uow_factory() as uow:
            return await uow.catalog.mastery_for(player_id, only_made)
