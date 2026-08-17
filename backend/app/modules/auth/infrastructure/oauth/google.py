"""Adapter Google OAuth (OpenID Connect) dua tren Authlib.

Day la noi duy nhat trong module biet den Authlib va Starlette request.
"""

from __future__ import annotations

from typing import Any

from authlib.integrations.starlette_client import OAuth

from app.core.config import settings
from app.modules.auth.domain.exceptions import OAuthProfileIncomplete
from app.modules.auth.domain.value_objects import Email, OAuthProfile, Provider

GOOGLE_METADATA_URL = "https://accounts.google.com/.well-known/openid-configuration"


def build_oauth_registry() -> OAuth:
    oauth = OAuth()
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url=GOOGLE_METADATA_URL,
        client_kwargs={"scope": "openid email profile"},
    )
    return oauth


class GoogleOAuthProvider:
    provider = Provider.GOOGLE

    def __init__(self, oauth: OAuth | None = None) -> None:
        self._client = (oauth or build_oauth_registry()).google

    async def authorize_redirect(self, request: Any, redirect_uri: str) -> Any:
        # Authlib luu `state`/`nonce` vao session cua Starlette -> can SessionMiddleware.
        return await self._client.authorize_redirect(request, redirect_uri)

    async def fetch_profile(self, request: Any) -> OAuthProfile:
        token = await self._client.authorize_access_token(request)
        info: dict[str, Any] = token.get("userinfo") or {}

        subject = info.get("sub")
        if not subject:
            raise OAuthProfileIncomplete("Google khong tra ve 'sub'")

        raw_email = info.get("email")
        email = Email(raw_email) if raw_email else None
        return OAuthProfile(
            provider=Provider.GOOGLE,
            subject=str(subject),
            email=email,
            email_verified=bool(info.get("email_verified")) and email is not None,
            name=info.get("name"),
            avatar_url=info.get("picture"),
        )
