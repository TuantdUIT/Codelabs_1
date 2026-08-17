"""Bang cua module huu co."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class IsomerModel(Base):
    """Danh muc dong phan ankan — seed tu shared/chemistry.json (enumerateAlkanes)."""

    __tablename__ = "isomer"
    __table_args__ = (Index("ix_isomer_carbons", "carbons"),)

    canonical_key: Mapped[str] = mapped_column(Text, primary_key=True)
    carbons: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    formula: Mapped[str] = mapped_column(Text, nullable=False)
    iupac_name: Mapped[str | None] = mapped_column(Text, nullable=True)


class RunOrganicModel(Base):
    __tablename__ = "run_organic"
    __table_args__ = (
        CheckConstraint("difficulty IN ('easy', 'medium', 'hard')", name="ck_run_organic_difficulty"),
        CheckConstraint("end_reason IN ('timeout', 'complete')", name="ck_run_organic_end_reason"),
    )

    run_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("game_run.id", ondelete="CASCADE"), primary_key=True
    )
    difficulty: Mapped[str] = mapped_column(Text, nullable=False)
    carbons: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    found_count: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    total_count: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    won: Mapped[bool] = mapped_column(Boolean, nullable=False)
    end_reason: Mapped[str] = mapped_column(Text, nullable=False)


class RunIsomerModel(Base):
    __tablename__ = "run_isomer"
    __table_args__ = (
        UniqueConstraint("run_id", "seq", name="uq_run_isomer_seq"),
        # Mot dong phan chi duoc tinh diem mot lan trong mot van.
        UniqueConstraint("run_id", "canonical_key", name="uq_run_isomer_key"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    run_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("run_organic.run_id", ondelete="CASCADE"), nullable=False
    )
    seq: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    canonical_key: Mapped[str] = mapped_column(
        Text, ForeignKey("isomer.canonical_key", ondelete="RESTRICT"), nullable=False
    )
    gained: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    bonus: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    at_ms: Mapped[int] = mapped_column(Integer, nullable=False)
