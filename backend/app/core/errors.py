"""Loi nghiep vu. File nay CHI dung stdlib de tang domain import duoc.

Viec bien DomainError thanh HTTP response nam o app/main.py.
"""

from __future__ import annotations


class DomainError(Exception):
    """Goc cua moi loi nghiep vu."""

    code: str = "domain_error"
    status_code: int = 400

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.__doc__ or self.code)
        self.message = message or (self.__doc__ or self.code)


class NotFoundError(DomainError):
    code = "not_found"
    status_code = 404


class ConflictError(DomainError):
    code = "conflict"
    status_code = 409


class AuthenticationError(DomainError):
    code = "unauthenticated"
    status_code = 401
