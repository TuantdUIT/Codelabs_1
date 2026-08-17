"""Test tich hop: can Postgres that.

Chay: dat TEST_DATABASE_URL trong backend/.env roi `pytest -m integration`.
Khong dat thi toan bo file nay bi skip.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import UTC, datetime

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base
from app.modules.auth.application.use_cases.login_with_oauth import LoginWithOAuth
from app.modules.auth.application.use_cases.logout import Logout
from app.modules.auth.application.use_cases.refresh_session import RefreshSession
from app.modules.auth.domain.exceptions import InvalidRefreshToken, RefreshTokenReuse
from app.modules.auth.domain.value_objects import Email, OAuthProfile, Provider
from app.modules.auth.infrastructure import models  # noqa: F401  # dang ky bang vao metadata
from app.modules.auth.infrastructure.repositories import AuthUnitOfWork

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(not settings.TEST_DATABASE_URL, reason="Chua dat TEST_DATABASE_URL"),
]


@pytest_asyncio.fixture
async def uow_factory() -> AsyncIterator[object]:
    engine = create_async_engine(settings.TEST_DATABASE_URL, future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)

    def make_uow() -> AuthUnitOfWork:
        return AuthUnitOfWork(factory)

    yield make_uow

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


def profile(subject: str = "sub-1", email: str = "a@example.com") -> OAuthProfile:
    return OAuthProfile(
        provider=Provider.GOOGLE,
        subject=subject,
        email=Email(email),
        email_verified=True,
        name="Nguoi Choi",
    )


async def test_dang_nhap_hai_lan_chi_tao_mot_player(uow_factory) -> None:  # type: ignore[no-untyped-def]
    use_case = LoginWithOAuth(uow_factory)

    first = await use_case.execute(profile())
    second = await use_case.execute(profile())

    assert first.is_new_player is True
    assert second.is_new_player is False
    assert first.player.id == second.player.id

    async with uow_factory() as uow:
        identity = await uow.identities.get(Provider.GOOGLE, "sub-1")
        assert identity is not None
        assert identity.last_login_at is not None


async def test_xoay_refresh_token_va_phat_hien_tai_su_dung(uow_factory) -> None:  # type: ignore[no-untyped-def]
    login = await LoginWithOAuth(uow_factory).execute(profile())
    old_token = login.tokens.refresh_token

    rotated = await RefreshSession(uow_factory).execute(old_token)
    assert rotated.refresh_token != old_token

    with pytest.raises(RefreshTokenReuse):
        await RefreshSession(uow_factory).execute(old_token)

    # Chuoi phien bi thu hoi => token vua xoay cung khong dung duoc nua
    with pytest.raises(InvalidRefreshToken):
        await RefreshSession(uow_factory).execute(rotated.refresh_token)


async def test_dang_xuat_thu_hoi_phien(uow_factory) -> None:  # type: ignore[no-untyped-def]
    login = await LoginWithOAuth(uow_factory).execute(profile())

    await Logout(uow_factory).execute(login.tokens.refresh_token)
    await Logout(uow_factory).execute(login.tokens.refresh_token)  # goi lai van an toan

    with pytest.raises(InvalidRefreshToken):
        await RefreshSession(uow_factory).execute(login.tokens.refresh_token)


async def test_gop_tai_khoan_khi_email_da_xac_thuc_trung_nhau(uow_factory) -> None:  # type: ignore[no-untyped-def]
    google = await LoginWithOAuth(uow_factory).execute(profile(subject="sub-google"))

    github_profile = OAuthProfile(
        provider=Provider.GITHUB,
        subject="sub-github",
        email=Email("a@example.com"),
        email_verified=True,
        name="Nguoi Choi",
    )
    linked = await LoginWithOAuth(uow_factory).execute(github_profile)

    assert linked.player.id == google.player.id
    assert linked.is_new_player is False


async def test_phien_ghi_nhan_thoi_diem_hop_le(uow_factory) -> None:  # type: ignore[no-untyped-def]
    login = await LoginWithOAuth(uow_factory).execute(profile())
    assert login.tokens.refresh_expires_at > datetime.now(UTC)
