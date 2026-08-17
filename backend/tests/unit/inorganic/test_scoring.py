"""Test luat tinh diem vo co — thuan, khong DB."""

from __future__ import annotations

import pytest

from app.modules.inorganic.domain.exceptions import InvalidInorganicPayload
from app.modules.inorganic.domain.scoring import compound_points, verify_run
from app.modules.inorganic.domain.value_objects import CompoundKey, InorganicPayload

NACL = CompoundKey("Na", "Cl")
CACL2 = CompoundKey("Ca", "Cl")
ALOH3 = CompoundKey("Al", "OH")

TOTALS = {NACL: 2, CACL2: 3, ALOH3: 4}


def payload(**overrides: object) -> InorganicPayload:
    raw = {
        "level_reached": 2,
        "rows_dropped": 1,
        "grids_cleared": 0,
        "cation_ids": ["Na", "Ca", "Al"],
        "anion_ids": ["Cl", "SO4", "OH"],
        "compounds": [
            {"cation_id": "Na", "anion_id": "Cl", "dropped": 0, "at_ms": 1000},
            {"cation_id": "Ca", "anion_id": "Cl", "dropped": 2, "at_ms": 4000},
            {"cation_id": "Al", "anion_id": "OH", "dropped": 0, "at_ms": 9000},
        ],
    }
    raw.update(overrides)  # type: ignore[arg-type]
    return InorganicPayload.parse(raw)


class TestCompoundPoints:
    def test_hop_chat_hai_o_duoc_diem_goc(self) -> None:
        assert compound_points(total=2, dropped=0) == 25

    def test_moi_o_them_cong_15(self) -> None:
        assert compound_points(total=3, dropped=0) == 40
        assert compound_points(total=5, dropped=0) == 70

    def test_moi_bong_roi_cong_10(self) -> None:
        assert compound_points(total=2, dropped=3) == 55


class TestVerifyRun:
    def test_van_hop_le_tinh_dung_tong_diem(self) -> None:
        report = verify_run(payload(), compound_totals=TOTALS, duration_ms=60_000)
        # 25 + (40 + 20) + 55
        assert report.score == 140
        assert report.ok

    def test_don_sach_luoi_cong_100_moi_lan(self) -> None:
        report = verify_run(payload(grids_cleared=2), compound_totals=TOTALS, duration_ms=60_000)
        assert report.score == 140 + 200

    def test_hop_chat_khong_ton_tai_bi_tu_choi(self) -> None:
        data = payload(compounds=[{"cation_id": "Na", "anion_id": "PO4", "dropped": 0, "at_ms": 900}])
        report = verify_run(data, compound_totals=TOTALS, duration_ms=60_000)
        assert not report.ok
        assert report.score == 0
        assert "khong ton tai" in report.problems[0]

    def test_ion_ngoai_bo_da_chon_bi_tu_choi(self) -> None:
        data = payload(cation_ids=["Na"], anion_ids=["Cl"])
        report = verify_run(data, compound_totals=TOTALS, duration_ms=60_000)
        assert not report.ok
        assert report.score == 25  # chi con NaCl hop le

    def test_moc_thoi_gian_khong_tang_dan_bi_bat(self) -> None:
        data = payload(
            compounds=[
                {"cation_id": "Na", "anion_id": "Cl", "dropped": 0, "at_ms": 5000},
                {"cation_id": "Na", "anion_id": "Cl", "dropped": 0, "at_ms": 4000},
            ]
        )
        report = verify_run(data, compound_totals=TOTALS, duration_ms=60_000)
        assert not report.ok

    def test_ban_qua_nhanh_bi_bat(self) -> None:
        data = payload(
            compounds=[
                {"cation_id": "Na", "anion_id": "Cl", "dropped": 0, "at_ms": 1000},
                {"cation_id": "Na", "anion_id": "Cl", "dropped": 0, "at_ms": 1050},
            ]
        )
        report = verify_run(data, compound_totals=TOTALS, duration_ms=60_000)
        assert not report.ok
        assert "qua ngan" in report.problems[0]

    def test_hop_chat_sau_khi_van_ket_thuc_bi_bat(self) -> None:
        report = verify_run(payload(), compound_totals=TOTALS, duration_ms=5_000)
        assert not report.ok
        assert any("sau khi van da ket thuc" in p for p in report.problems)


class TestPayloadParsing:
    def test_thieu_truong_thi_400(self) -> None:
        with pytest.raises(InvalidInorganicPayload):
            InorganicPayload.parse({"level_reached": 1})

    def test_chi_so_am_bi_tu_choi(self) -> None:
        with pytest.raises(InvalidInorganicPayload):
            payload(grids_cleared=-1)
