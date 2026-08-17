"""Schema vao/ra cua HTTP. Khong ro ri entity domain ra ngoai."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel

from app.modules.auth.domain.entities import Player


class PlayerOut(BaseModel):
    id: UUID
    display_name: str
    email: str | None
    avatar_url: str | None

    @classmethod
    def from_entity(cls, player: Player) -> PlayerOut:
        return cls(
            id=player.id,
            display_name=player.display_name,
            email=player.email.value if player.email else None,
            avatar_url=player.avatar_url,
        )


class AccessTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
