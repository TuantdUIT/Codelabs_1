"""Bang cua module gameplay."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import BigInteger, Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, Text, func, text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class GameRunModel(Base):
    __tablename__ = "game_run"
    __table_args__ = (
        CheckConstraint("mode IN ('inorganic', 'organic')", name="ck_game_run_mode"),
        CheckConstraint(
            "status IN ('playing', 'finished', 'abandoned')", name="ck_game_run_status"
        ),
        CheckConstraint("score >= 0", name="ck_game_run_score"),
        Index("ix_game_run_player", "player_id", "started_at"),
        # Chi so phuc vu bang xep hang: chi cac van da xac thuc moi duoc quet.
        Index(
            "ix_game_run_leaderboard",
            "mode",
            "score",
            postgresql_where=text("status = 'finished' AND score_verified"),
        ),
    )

    id: Mapped[UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True)
    player_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("player.id", ondelete="CASCADE"), nullable=False
    )
    mode: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'playing'"))
    seed: Mapped[int] = mapped_column(BigInteger, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    score_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    client_version: Mapped[str] = mapped_column(Text, nullable=False)


class MusicTrackModel(Base):
    """Danh muc nhac nen, de `player_settings.track_id` co cho tham chieu."""

    __tablename__ = "music_track"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
