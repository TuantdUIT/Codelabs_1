"""Phia doc cua module vo co: danh muc hop chat va muc do thanh thao."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.unit_of_work import SqlAlchemyUnitOfWork
from app.modules.inorganic.domain.repositories import CompoundInfo, MasteryRow
from app.modules.inorganic.infrastructure.models import CompoundModel, PlayerCompoundStatModel
from app.shared.ids import PlayerId


def _info(row: CompoundModel) -> CompoundInfo:
    return CompoundInfo(
        cation_id=row.cation_id,
        anion_id=row.anion_id,
        formula=row.formula,
        name=row.name,
        type=row.type,
        total=row.total,
    )


class SqlAlchemyCompoundCatalogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_compounds(self) -> list[CompoundInfo]:
        stmt = select(CompoundModel).order_by(CompoundModel.total, CompoundModel.formula)
        return [_info(row) for row in (await self._session.execute(stmt)).scalars()]

    async def mastery_for(self, player_id: PlayerId, only_made: bool) -> list[MasteryRow]:
        join = (
            (PlayerCompoundStatModel.cation_id == CompoundModel.cation_id)
            & (PlayerCompoundStatModel.anion_id == CompoundModel.anion_id)
            & (PlayerCompoundStatModel.player_id == player_id)
        )
        stmt = (
            select(CompoundModel, PlayerCompoundStatModel)
            .join(PlayerCompoundStatModel, join, isouter=not only_made)
            .order_by(CompoundModel.total, CompoundModel.formula)
        )
        rows = (await self._session.execute(stmt)).all()
        return [
            MasteryRow(
                compound=_info(compound),
                times_made=stat.times_made if stat else 0,
                first_made_at=stat.first_made_at if stat else None,
                last_made_at=stat.last_made_at if stat else None,
            )
            for compound, stat in rows
        ]


class InorganicUnitOfWork(SqlAlchemyUnitOfWork):
    catalog: SqlAlchemyCompoundCatalogRepository

    def _build_repositories(self) -> None:
        self.catalog = SqlAlchemyCompoundCatalogRepository(self.session)
