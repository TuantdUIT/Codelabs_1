"""HTTP cho module auth. Router khong chua nghiep vu — chi goi use case."""

from __future__ import annotations

from fastapi import APIRouter, Request, Response, status
from fastapi.responses import JSONResponse, RedirectResponse

from app.container import auth_uow_factory, get_oauth_provider
from app.core.config import settings
from app.core.errors import AuthenticationError
from app.modules.auth.api.deps import CurrentPlayer
from app.modules.auth.api.schemas import AccessTokenOut, PlayerOut
from app.modules.auth.application.dto import AuthTokens
from app.modules.auth.application.use_cases.login_with_oauth import LoginWithOAuth
from app.modules.auth.application.use_cases.logout import Logout
from app.modules.auth.application.use_cases.refresh_session import RefreshSession

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_refresh_cookie(response: Response, tokens: AuthTokens) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=tokens.refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path=settings.refresh_cookie_path,
        max_age=settings.REFRESH_TOKEN_DAYS * 24 * 3600,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=settings.refresh_cookie_path,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
    )


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


@router.get("/me", response_model=PlayerOut)
async def me(player: CurrentPlayer) -> PlayerOut:
    return PlayerOut.from_entity(player)


def _auth_error_response(exc: AuthenticationError) -> JSONResponse:
    """Tra loi 401 va xoa luon cookie hong, de trinh duyet khong gui lai mai."""
    response = JSONResponse(status_code=exc.status_code, content={"error": exc.code, "detail": exc.message})
    _clear_refresh_cookie(response)
    return response


@router.post("/refresh", response_model=AccessTokenOut)
async def refresh(request: Request, response: Response) -> AccessTokenOut | JSONResponse:
    raw_token = request.cookies.get(settings.refresh_cookie_name)
    if not raw_token:
        return _auth_error_response(AuthenticationError("Khong co refresh token"))

    try:
        tokens = await RefreshSession(auth_uow_factory).execute(
            raw_token,
            user_agent=request.headers.get("user-agent"),
            ip=_client_ip(request),
        )
    except AuthenticationError as exc:
        return _auth_error_response(exc)

    _set_refresh_cookie(response, tokens)
    return AccessTokenOut(access_token=tokens.access_token, expires_in=tokens.expires_in)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response) -> None:
    await Logout(auth_uow_factory).execute(request.cookies.get(settings.refresh_cookie_name))
    _clear_refresh_cookie(response)


@router.get("/{provider}/login")
async def oauth_login(provider: str, request: Request) -> Response:
    client = get_oauth_provider(provider)
    redirect_uri = f"{settings.BACKEND_URL}/auth/{provider}/callback"
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/{provider}/callback")
async def oauth_callback(provider: str, request: Request) -> Response:
    client = get_oauth_provider(provider)
    profile = await client.fetch_profile(request)

    result = await LoginWithOAuth(auth_uow_factory).execute(
        profile,
        user_agent=request.headers.get("user-agent"),
        ip=_client_ip(request),
    )

    # Khong nhet token vao URL: chi dat cookie refresh roi de frontend goi /auth/refresh.
    response = RedirectResponse(
        f"{settings.FRONTEND_URL}/auth/callback", status_code=status.HTTP_303_SEE_OTHER
    )
    _set_refresh_cookie(response, result.tokens)
    return response
