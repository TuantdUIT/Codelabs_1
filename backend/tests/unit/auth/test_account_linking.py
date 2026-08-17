"""Test tang domain — chay duoc ma KHONG can Postgres."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from app.modules.auth.domain.entities import AuthSession, Identity, Player
from app.modules.auth.domain.services import LinkDecision, decide_account_link, display_name_for
from app.modules.auth.domain.value_objects import Email, OAuthProfile, Provider
from app.shared.ids import PlayerId

NOW = datetime(2026, 8, 17, 10, 0, tzinfo=UTC)


def make_profile(
    *,
    subject: str = "google-sub-1",
    email: str | None = "hoc.sinh@example.com",
    verified: bool = True,
    name: str | None = "Hoc Sinh",
) -> OAuthProfile:
    return OAuthProfile(
        provider=Provider.GOOGLE,
        subject=subject,
        email=Email(email) if email else None,
        email_verified=verified and email is not None,
        name=name,
    )


def make_player(*, email: str | None, verified: bool) -> Player:
    return Player(
        id=PlayerId(uuid4()),
        display_name="Nguoi choi",
        email=Email(email) if email else None,
        email_verified=verified,
    )


class TestDecideAccountLink:
    def test_khong_co_player_trung_email_thi_tao_moi(self) -> None:
        assert decide_account_link(make_profile(), None) is LinkDecision.CREATE_NEW

    def test_ca_hai_phia_email_da_xac_thuc_va_trung_thi_gop(self) -> None:
        existing = make_player(email="hoc.sinh@example.com", verified=True)
        assert decide_account_link(make_profile(), existing) is LinkDecision.LINK_EXISTING

    def test_provider_khong_xac_thuc_email_thi_khong_gop(self) -> None:
        existing = make_player(email="hoc.sinh@example.com", verified=True)
        profile = make_profile(verified=False)
        assert decide_account_link(profile, existing) is LinkDecision.CREATE_NEW

    def test_player_cu_chua_xac_thuc_email_thi_khong_gop(self) -> None:
        existing = make_player(email="hoc.sinh@example.com", verified=False)
        assert decide_account_link(make_profile(), existing) is LinkDecision.CREATE_NEW

    def test_email_khac_nhau_thi_khong_gop(self) -> None:
        existing = make_player(email="nguoi.khac@example.com", verified=True)
        assert decide_account_link(make_profile(), existing) is LinkDecision.CREATE_NEW

    def test_email_khac_hoa_thuong_van_coi_la_trung(self) -> None:
        existing = make_player(email="Hoc.Sinh@Example.com", verified=True)
        assert decide_account_link(make_profile(), existing) is LinkDecision.LINK_EXISTING


class TestDisplayName:
    def test_uu_tien_ten_tu_provider(self) -> None:
        assert display_name_for(make_profile()) == "Hoc Sinh"

    def test_thieu_ten_thi_lay_phan_truoc_cong(self) -> None:
        assert display_name_for(make_profile(name=None)) == "hoc.sinh"

    def test_thieu_ca_ten_lan_email(self) -> None:
        assert display_name_for(make_profile(name=" ", email=None)) == "Nguoi choi moi"


class TestOAuthProfile:
    def test_thieu_subject_thi_bao_loi(self) -> None:
        with pytest.raises(ValueError):
            OAuthProfile(provider=Provider.GOOGLE, subject="")

    def test_khong_the_xac_thuc_email_khi_khong_co_email(self) -> None:
        with pytest.raises(ValueError):
            OAuthProfile(provider=Provider.GOOGLE, subject="x", email=None, email_verified=True)


class TestAuthSession:
    def _session(self, *, expires_in_days: int = 30) -> AuthSession:
        return AuthSession.issue(
            player_id=PlayerId(uuid4()),
            token_hash="hash",
            now=NOW,
            expires_at=NOW + timedelta(days=expires_in_days),
        )

    def test_phien_moi_la_dang_hoat_dong(self) -> None:
        assert self._session().is_active(NOW) is True

    def test_het_han_thi_khong_con_hoat_dong(self) -> None:
        session = self._session(expires_in_days=1)
        assert session.is_active(NOW + timedelta(days=2)) is False

    def test_thu_hoi_hai_lan_khong_doi_moc_thoi_gian(self) -> None:
        session = self._session()
        session.revoke(NOW)
        session.revoke(NOW + timedelta(hours=1))
        assert session.revoked_at == NOW
        assert session.is_active(NOW) is False


class TestIdentity:
    def test_id_la_cap_provider_va_subject(self) -> None:
        profile = make_profile()
        identity = Identity.link(profile=profile, player_id=PlayerId(uuid4()), now=NOW)
        assert identity.id == (Provider.GOOGLE, "google-sub-1")

    def test_touch_login_cap_nhat_thoi_diem(self) -> None:
        identity = Identity.link(
            profile=make_profile(), player_id=PlayerId(uuid4()), now=NOW
        )
        later = NOW + timedelta(days=3)
        identity.touch_login(later)
        assert identity.last_login_at == later


class TestPlayerRegistration:
    def test_dang_ky_sinh_su_kien_va_giu_email(self) -> None:
        profile = make_profile()
        player = Player.register(display_name=display_name_for(profile), profile=profile, now=NOW)
        events = player.pull_events()
        assert [type(e).__name__ for e in events] == ["PlayerRegistered"]
        assert player.email is not None and player.email.value == "hoc.sinh@example.com"
        assert player.email_verified is True

    def test_khong_ghi_de_avatar_bang_gia_tri_rong(self) -> None:
        profile = make_profile()
        player = Player.register(display_name="X", profile=profile, now=NOW)
        player.avatar_url = "https://cu.example/a.png"
        player.refresh_profile(make_profile())  # profile moi khong co avatar
        assert player.avatar_url == "https://cu.example/a.png"
