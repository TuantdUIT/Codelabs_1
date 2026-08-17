"""Loi cua mien auth."""

from app.core.errors import AuthenticationError, DomainError


class UnknownProvider(DomainError):
    """Nha cung cap dang nhap khong duoc ho tro."""

    code = "unknown_provider"
    status_code = 400


class OAuthProfileIncomplete(DomainError):
    """Nha cung cap khong tra du thong tin de tao tai khoan."""

    code = "oauth_profile_incomplete"
    status_code = 400


class InvalidRefreshToken(AuthenticationError):
    """Refresh token khong ton tai hoac da bi thu hoi."""

    code = "invalid_refresh_token"


class RefreshTokenExpired(AuthenticationError):
    """Refresh token da het han."""

    code = "refresh_token_expired"


class RefreshTokenReuse(AuthenticationError):
    """Refresh token da xoay bi dung lai — moi phien cua tai khoan da bi thu hoi."""

    code = "refresh_token_reuse"


class PlayerNotFound(AuthenticationError):
    """Khong tim thay nguoi choi ung voi token."""

    code = "player_not_found"
