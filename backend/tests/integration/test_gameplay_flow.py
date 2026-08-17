"""Test tich hop luong 2 pha: bat dau van -> nop ket qua -> bang xep hang.

Can Postgres that: dat TEST_DATABASE_URL roi `pytest -m integration`.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import func, select

from app.core.config import settings
from app.modules.auth.application.use_cases.get_player_summaries import GetPlayerSummaries
from app.modules.auth.application.use_cases.login_with_oauth import LoginWithOAuth
from app.modules.auth.domain.value_objects import Email, OAuthProfile, Provider
from app.modules.gameplay.application.use_cases.finish_run import FinishRun
from app.modules.gameplay.application.use_cases.get_leaderboard import GetLeaderboard, Period
from app.modules.gameplay.application.use_cases.start_run import StartRun
from app.modules.gameplay.domain.exceptions import RunAlreadyFinished, RunNotOwned
from app.modules.gameplay.domain.value_objects import GameMode
from app.modules.inorganic.infrastructure.models import (
    PlayerCompoundStatModel,
    RunCompoundModel,
    RunInorganicModel,
    RunIonChoiceModel,
)
from app.modules.inorganic.public import InorganicRunVerifier
from app.modules.organic.infrastructure.models import IsomerModel, RunIsomerModel
from app.modules.organic.public import OrganicRunVerifier
from app.shared.ids import PlayerId

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(not settings.TEST_DATABASE_URL, reason="Chua dat TEST_DATABASE_URL"),
]

T0 = datetime(2026, 8, 17, 12, 0, tzinfo=UTC)
T_END = T0 + timedelta(seconds=60)

VERIFIERS = {
    GameMode.INORGANIC: InorganicRunVerifier(),
    GameMode.ORGANIC: OrganicRunVerifier(),
}

# NaCl (2 o) 25 + CaCl2 (3 o, 2 bong roi) 40+20 + Al(OH)3 (4 o) 55 = 140, don luoi 1 lan +100
INORGANIC_PAYLOAD = {
    "level_reached": 2,
    "rows_dropped": 1,
    "grids_cleared": 1,
    "cation_ids": ["Na", "Ca", "Al"],
    "anion_ids": ["Cl", "SO4", "OH"],
    "compounds": [
        {"cation_id": "Na", "anion_id": "Cl", "dropped": 0, "at_ms": 1_000},
        {"cation_id": "Ca", "anion_id": "Cl", "dropped": 2, "at_ms": 4_000},
        {"cation_id": "Al", "anion_id": "OH", "dropped": 0, "at_ms": 9_000},
    ],
}
INORGANIC_SCORE = 240


class _Directory:
    """Adapter PlayerDirectory dung trong test, giong het cai o container."""

    def __init__(self, auth_uow_factory) -> None:  # type: ignore[no-untyped-def]
        self._factory = auth_uow_factory

    async def summaries(self, player_ids):  # type: ignore[no-untyped-def]
        return await GetPlayerSummaries(self._factory).execute(player_ids)


async def _login(factories, subject: str = "sub-1", email: str = "a@example.com") -> PlayerId:
    profile = OAuthProfile(
        provider=Provider.GOOGLE,
        subject=subject,
        email=Email(email),
        email_verified=True,
        name="Nguoi Choi",
    )
    result = await LoginWithOAuth(factories.auth).execute(profile)
    return result.player.id


async def _start(factories, player_id: PlayerId, mode: GameMode = GameMode.INORGANIC):
    return await StartRun(factories.gameplay, clock=lambda: T0).execute(
        player_id=player_id, mode=mode, client_version="test"
    )


def _finish(factories) -> FinishRun:
    return FinishRun(factories.gameplay, VERIFIERS, clock=lambda: T_END)


async def test_van_vo_co_hop_le_duoc_xac_thuc(factories) -> None:
    player_id = await _login(factories)
    started = await _start(factories, player_id)
    assert started.seed > 0

    finished = await _finish(factories).execute(
        run_id=started.run.id,
        player_id=player_id,
        client_score=INORGANIC_SCORE,
        payload=INORGANIC_PAYLOAD,
    )

    assert finished.run.score == INORGANIC_SCORE
    assert finished.run.score_verified is True
    assert finished.run.duration_ms == 60_000  # do bang dong ho server, khong phai client

    async with factories.session() as session:
        detail = await session.get(RunInorganicModel, started.run.id)
        assert detail is not None and detail.compounds_made == 3
        hits = await session.scalar(
            select(func.count()).select_from(RunCompoundModel).where(
                RunCompoundModel.run_id == started.run.id
            )
        )
        choices = await session.scalar(
            select(func.count()).select_from(RunIonChoiceModel).where(
                RunIonChoiceModel.run_id == started.run.id
            )
        )
        mastery = await session.scalar(
            select(func.count()).select_from(PlayerCompoundStatModel).where(
                PlayerCompoundStatModel.player_id == player_id
            )
        )
    assert (hits, choices, mastery) == (3, 6, 3)


async def test_diem_client_bia_ra_thi_khong_duoc_xac_thuc(factories) -> None:
    player_id = await _login(factories)
    started = await _start(factories, player_id)

    finished = await _finish(factories).execute(
        run_id=started.run.id,
        player_id=player_id,
        client_score=999_999,
        payload=INORGANIC_PAYLOAD,
    )

    # Diem luu la diem server tu tinh, khong phai so client gui len.
    assert finished.run.score == INORGANIC_SCORE
    assert finished.run.score_verified is False
    assert finished.reason is not None and "999999" in finished.reason.replace(" ", "")


async def test_hop_chat_khong_ton_tai_bi_loai_khoi_diem(factories) -> None:
    player_id = await _login(factories)
    started = await _start(factories, player_id)

    payload = {
        **INORGANIC_PAYLOAD,
        "grids_cleared": 0,
        "compounds": [
            {"cation_id": "Na", "anion_id": "Cl", "dropped": 0, "at_ms": 1_000},
            {"cation_id": "Na", "anion_id": "KHONG_CO", "dropped": 0, "at_ms": 4_000},
        ],
    }
    finished = await _finish(factories).execute(
        run_id=started.run.id, player_id=player_id, client_score=25, payload=payload
    )

    assert finished.run.score == 25
    assert finished.run.score_verified is False

    async with factories.session() as session:
        rows = await session.scalar(
            select(func.count()).select_from(RunCompoundModel).where(
                RunCompoundModel.run_id == started.run.id
            )
        )
    assert rows == 1  # dong rac khong duoc luu


async def test_van_huu_co_kiem_lai_thuong_thoi_gian(factories) -> None:
    player_id = await _login(factories)
    started = await _start(factories, player_id, GameMode.ORGANIC)

    async with factories.session() as session:
        keys = list(
            (
                await session.execute(
                    select(IsomerModel.canonical_key).where(IsomerModel.carbons == 4).order_by(
                        IsomerModel.canonical_key
                    )
                )
            ).scalars()
        )
    assert len(keys) == 2  # butan co dung 2 dong phan

    payload = {
        "difficulty": "easy",
        "carbons": 4,
        "total_count": 2,
        "won": True,
        "end_reason": "complete",
        "isomers": [
            {"canonical_key": keys[0], "gained": 267, "bonus": 167, "at_ms": 5_000},
            {"canonical_key": keys[1], "gained": 253, "bonus": 153, "at_ms": 12_000},
        ],
    }
    finished = await _finish(factories).execute(
        run_id=started.run.id, player_id=player_id, client_score=520, payload=payload
    )

    assert finished.run.score == 520
    assert finished.run.score_verified is True

    async with factories.session() as session:
        rows = await session.scalar(
            select(func.count()).select_from(RunIsomerModel).where(
                RunIsomerModel.run_id == started.run.id
            )
        )
    assert rows == 2


async def test_khong_nop_ket_qua_van_cua_nguoi_khac(factories) -> None:
    owner = await _login(factories, "sub-owner", "owner@example.com")
    intruder = await _login(factories, "sub-intruder", "intruder@example.com")
    started = await _start(factories, owner)

    with pytest.raises(RunNotOwned):
        await _finish(factories).execute(
            run_id=started.run.id,
            player_id=intruder,
            client_score=INORGANIC_SCORE,
            payload=INORGANIC_PAYLOAD,
        )


async def test_khong_nop_ket_qua_hai_lan(factories) -> None:
    player_id = await _login(factories)
    started = await _start(factories, player_id)
    args = {
        "run_id": started.run.id,
        "player_id": player_id,
        "client_score": INORGANIC_SCORE,
        "payload": INORGANIC_PAYLOAD,
    }
    await _finish(factories).execute(**args)

    with pytest.raises(RunAlreadyFinished):
        await _finish(factories).execute(**args)


async def test_bang_xep_hang_chi_lay_van_da_xac_thuc(factories) -> None:
    good = await _login(factories, "sub-good", "good@example.com")
    cheater = await _login(factories, "sub-cheat", "cheat@example.com")

    honest = await _start(factories, good)
    await _finish(factories).execute(
        run_id=honest.run.id,
        player_id=good,
        client_score=INORGANIC_SCORE,
        payload=INORGANIC_PAYLOAD,
    )

    faked = await _start(factories, cheater)
    await _finish(factories).execute(
        run_id=faked.run.id, player_id=cheater, client_score=10_000, payload=INORGANIC_PAYLOAD
    )

    directory = _Directory(factories.auth)
    rows = await GetLeaderboard(factories.gameplay, directory, clock=lambda: T_END).execute(
        mode=GameMode.INORGANIC, period=Period.ALL
    )

    assert [row.player_id for row in rows] == [good]
    assert rows[0].rank == 1
    assert rows[0].best_score == INORGANIC_SCORE
    assert rows[0].display_name == "Nguoi Choi"  # ten lay qua cong sang module auth
