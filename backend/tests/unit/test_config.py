"""Test cau hinh suy dien — quan trong khi chay sau reverse proxy."""

from __future__ import annotations

import pytest

from app.core.config import Settings


@pytest.mark.parametrize(
    ("backend_url", "expected"),
    [
        ("http://localhost:8001", "/auth"),
        ("https://game.example.com", "/auth"),
        # Production sau reverse proxy: backend nam duoi tien to /api
        ("https://game.example.com/api", "/api/auth"),
        ("https://game.example.com/api/", "/api/auth"),
    ],
)
def test_cookie_path_theo_tien_to_cua_backend_url(backend_url: str, expected: str) -> None:
    settings = Settings(BACKEND_URL=backend_url)
    assert settings.refresh_cookie_path == expected


def test_redirect_uri_giu_nguyen_tien_to() -> None:
    settings = Settings(BACKEND_URL="https://game.example.com/api")
    assert f"{settings.BACKEND_URL}/auth/google/callback" == (
        "https://game.example.com/api/auth/google/callback"
    )
