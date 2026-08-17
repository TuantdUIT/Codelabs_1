"""Loi cua mien gameplay."""

from app.core.errors import ConflictError, DomainError, NotFoundError


class RunNotFound(NotFoundError):
    """Khong tim thay van choi."""

    code = "run_not_found"


class RunNotOwned(DomainError):
    """Van choi nay khong thuoc ve nguoi dang dang nhap."""

    code = "run_not_owned"
    status_code = 403


class RunAlreadyFinished(ConflictError):
    """Van choi da ket thuc, khong nop ket qua lai duoc."""

    code = "run_already_finished"


class NoVerifierForMode(DomainError):
    """Chua co module nao dang ky cham diem cho che do choi nay."""

    code = "no_verifier_for_mode"
    status_code = 500
