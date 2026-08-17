"""Value object cua mien auth. Khong phu thuoc framework nao."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class Provider(StrEnum):
    GOOGLE = "google"
    FACEBOOK = "facebook"
    GITHUB = "github"


@dataclass(frozen=True, slots=True)
class Email:
    value: str

    def __post_init__(self) -> None:
        if "@" not in self.value or self.value.startswith("@") or self.value.endswith("@"):
            raise ValueError(f"Email khong hop le: {self.value}")
        object.__setattr__(self, "value", self.value.strip().lower())

    @property
    def local_part(self) -> str:
        return self.value.split("@", 1)[0]

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True, slots=True)
class OAuthProfile:
    """Ho so nguoi dung do nha cung cap tra ve, da chuan hoa.

    `subject` la id on dinh cua nguoi dung o phia provider ('sub' cua Google).
    """

    provider: Provider
    subject: str
    email: Email | None = None
    email_verified: bool = False
    name: str | None = None
    avatar_url: str | None = None

    def __post_init__(self) -> None:
        if not self.subject:
            raise ValueError("OAuth profile thieu subject")
        if self.email is None and self.email_verified:
            raise ValueError("Khong the danh dau email da xac thuc khi khong co email")
