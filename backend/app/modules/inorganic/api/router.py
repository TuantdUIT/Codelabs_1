"""HTTP cua module vo co."""

from __future__ import annotations

from fastapi import APIRouter

from app.container import inorganic_uow_factory
from app.modules.auth.public import CurrentPlayer
from app.modules.inorganic.api.schemas import CompoundOut, MasteryOut
from app.modules.inorganic.application.use_cases.get_compound_mastery import (
    GetCompoundMastery,
    ListCompounds,
)
from app.shared.ids import PlayerId

router = APIRouter(prefix="/inorganic", tags=["inorganic"])


@router.get("/compounds", response_model=list[CompoundOut])
async def list_compounds() -> list[CompoundOut]:
    """Danh muc moi hop chat game co the tao — cong khai, dung cho man hinh tra cuu."""
    infos = await ListCompounds(inorganic_uow_factory).execute()
    return [CompoundOut.from_info(info) for info in infos]


@router.get("/mastery", response_model=list[MasteryOut])
async def mastery(player: CurrentPlayer, only_made: bool = False) -> list[MasteryOut]:
    rows = await GetCompoundMastery(inorganic_uow_factory).execute(
        player_id=PlayerId(player.id), only_made=only_made
    )
    return [MasteryOut.from_row(row) for row in rows]
