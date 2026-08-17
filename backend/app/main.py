"""Diem vao cua backend — composition root, noi duy nhat gan router cua cac module."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import settings
from app.core.errors import DomainError
from app.modules.auth.api.router import router as auth_router
from app.modules.gameplay.api.router import leaderboard_router
from app.modules.gameplay.api.router import router as runs_router
from app.modules.inorganic.api.router import router as inorganic_router


def create_app() -> FastAPI:
    app = FastAPI(title="Chem Game API", version="0.2.0")

    # Authlib luu state/nonce cua OAuth vao session cookie nay.
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.SESSION_SECRET,
        same_site="lax",
        https_only=settings.COOKIE_SECURE,
    )

    # allow_credentials=True thi KHONG duoc dung "*" — trinh duyet se chan.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(DomainError)
    async def _domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.code, "detail": exc.message},
        )

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(auth_router)
    app.include_router(runs_router)
    app.include_router(leaderboard_router)
    app.include_router(inorganic_router)
    return app


app = create_app()
