"""Bang SQLAlchemy cua module auth.

Khong khai bao relationship() sang bang cua module khac — lien ket giua cac module
chi qua id, rang buoc toan ven de o tang DB (FK).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Text, func, text
from sqlalchemy.dialects.postgresql import INET, JSONB, REAL
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

PROVIDERS = ("google", "facebook", "github")


class PlayerModel(Base):
    __tablename__ = "player"

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    display_name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_guest: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class IdentityModel(Base):
    __tablename__ = "identity"
    __table_args__ = (
        CheckConstraint(
            "provider IN ('google', 'facebook', 'github')", name="ck_identity_provider"
        ),
        Index("ix_identity_player_id", "player_id"),
    )

    provider: Mapped[str] = mapped_column(Text, primary_key=True)
    provider_user_id: Mapped[str] = mapped_column(Text, primary_key=True)
    player_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("player.id", ondelete="CASCADE"), nullable=False
    )
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    linked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AuthSessionModel(Base):
    __tablename__ = "auth_session"
    __table_args__ = (
        Index(
            "ix_auth_session_active",
            "player_id",
            postgresql_where=text("revoked_at IS NULL"),
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    player_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("player.id", ondelete="CASCADE"), nullable=False
    )
    refresh_token_hash: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rotated_from: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("auth_session.id", ondelete="SET NULL"), nullable=True
    )
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip: Mapped[str | None] = mapped_column(INET, nullable=True)


class PlayerSettingsModel(Base):
    __tablename__ = "player_settings"
    __table_args__ = (
        CheckConstraint("volume >= 0 AND volume <= 1", name="ck_player_settings_volume"),
    )

    player_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("player.id", ondelete="CASCADE"), primary_key=True
    )
    # FK toi bang music_track cua module gameplay: chi tham chieu bang ten bang o
    # tang DB, khong import model va khong khai bao relationship() xuyen module.
    track_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("music_track.id", ondelete="SET NULL"), nullable=True
    )
    volume: Mapped[float] = mapped_column(REAL, nullable=False, server_default=text("0.55"))
    muted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    last_setup: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
