"""Loi cua mien huu co."""

from app.core.errors import DomainError


class InvalidOrganicPayload(DomainError):
    """Goi du lieu van huu co sai cau truc."""

    code = "invalid_organic_payload"
    status_code = 400
