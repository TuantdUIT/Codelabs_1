"""Loi cua mien vo co."""

from app.core.errors import DomainError


class InvalidInorganicPayload(DomainError):
    """Goi du lieu van vo co sai cau truc."""

    code = "invalid_inorganic_payload"
    status_code = 400
