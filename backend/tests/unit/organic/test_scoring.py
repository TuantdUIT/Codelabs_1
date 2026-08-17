"""Test luat tinh diem huu co — thuan, khong DB."""

from __future__ import annotations

import pytest

from app.modules.organic.domain.exceptions import InvalidOrganicPayload
from app.modules.organic.domain.scoring import time_bonus, verify_run
from app.modules.organic.domain.value_objects import OrganicPayload

KEY_A = "0|1"
KEY_B = "0|1|2"
LIMIT_MS = 30_000  # do kho 'easy'


def payload(**overrides: object) -> OrganicPayload:
    raw = {
        "difficulty": "easy",
        "carbons": 4,
        "total_count": 2,
        "won": True,
        "end_reason": "complete",
        "isomers": [
            {"canonical_key": KEY_A, "gained": 267, "bonus": 167, "at_ms": 5_000},
            {"canonical_key": KEY_B, "gained": 253, "bonus": 153, "at_ms": 12_000},
        ],
    }
    raw.update(overrides)  # type: ignore[arg-type]
    return OrganicPayload.parse(raw)


class TestTimeBonus:
    def test_giai_ngay_lap_tuc_duoc_toan_bo_thuong(self) -> None:
        assert time_bonus(LIMIT_MS, LIMIT_MS) == 200

    def test_het_gio_thi_khong_co_thuong(self) -> None:
        assert time_bonus(0, LIMIT_MS) == 0

    def test_lam_tron_nua_len_giong_javascript(self) -> None:
        # 200 * 15075 / 30000 = 100.5 -> JS Math.round cho 101, round() cua Python cho 100
        assert time_bonus(15_075, LIMIT_MS) == 101

    def test_thoi_gian_con_lai_am_bi_kep_ve_khong(self) -> None:
        assert time_bonus(-5_000, LIMIT_MS) == 0


class TestVerifyRun:
    def test_van_hop_le_tinh_dung_diem(self) -> None:
        report = verify_run(payload(), known_keys={KEY_A, KEY_B}, duration_ms=20_000)
        assert report.ok
        assert report.score == 520  # (100+167) + (100+153)

    def test_dong_phan_la_bi_tu_choi(self) -> None:
        report = verify_run(payload(), known_keys={KEY_A}, duration_ms=20_000)
        assert not report.ok
        assert report.score == 267

    def test_dong_phan_trung_khong_duoc_tinh_hai_lan(self) -> None:
        data = payload(
            isomers=[
                {"canonical_key": KEY_A, "gained": 267, "bonus": 167, "at_ms": 5_000},
                {"canonical_key": KEY_A, "gained": 267, "bonus": 167, "at_ms": 12_000},
            ]
        )
        report = verify_run(data, known_keys={KEY_A, KEY_B}, duration_ms=20_000)
        assert not report.ok
        assert report.score == 267

    def test_thuong_bia_ra_bi_bat(self) -> None:
        data = payload(
            isomers=[{"canonical_key": KEY_A, "gained": 300, "bonus": 200, "at_ms": 20_000}]
        )
        report = verify_run(data, known_keys={KEY_A}, duration_ms=25_000)
        assert not report.ok
        # Diem luu van la diem server tinh: con 10s tren 30s -> thuong 67
        assert report.score == 167

    def test_bao_thang_nhung_thieu_dong_phan(self) -> None:
        data = payload(
            total_count=5,
            isomers=[{"canonical_key": KEY_A, "gained": 267, "bonus": 167, "at_ms": 5_000}],
        )
        report = verify_run(data, known_keys={KEY_A, KEY_B}, duration_ms=20_000)
        assert not report.ok
        assert any("chua du dong phan" in p for p in report.problems)


class TestPayloadParsing:
    def test_do_kho_la_bi_tu_choi(self) -> None:
        with pytest.raises(InvalidOrganicPayload):
            payload(difficulty="impossible")

    def test_ly_do_ket_thuc_la_bi_tu_choi(self) -> None:
        with pytest.raises(InvalidOrganicPayload):
            payload(end_reason="quit")
