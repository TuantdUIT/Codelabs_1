"""Bang cua module vo co: chi tiet van choi + danh muc ion/hop chat."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    SmallInteger,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class IonModel(Base):
    """Danh muc ion — seed tu shared/chemistry.json, khong nhap tay."""

    __tablename__ = "ion"
    __table_args__ = (
        CheckConstraint("type IN ('cation', 'anion')", name="ck_ion_type"),
        CheckConstraint("charge BETWEEN 1 AND 3", name="ck_ion_charge"),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    symbol: Mapped[str] = mapped_column(Text, nullable=False)
    charge: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    polyatomic: Mapped[bool] = mapped_column(Boolean, nullable=False)
    acid_name: Mapped[str | None] = mapped_column(Text, nullable=True)


class CompoundModel(Base):
    """Dan xuat tu buildCompound() ben TypeScript. Nguon chan ly la code, day chi la ban sao."""

    __tablename__ = "compound"
    __table_args__ = (
        CheckConstraint(
            "type IN ('axit', 'base', 'muoi', 'oxit')", name="ck_compound_type"
        ),
        CheckConstraint("total = cat_sub + an_sub", name="ck_compound_total"),
    )

    cation_id: Mapped[str] = mapped_column(
        Text, ForeignKey("ion.id", ondelete="RESTRICT"), primary_key=True
    )
    anion_id: Mapped[str] = mapped_column(
        Text, ForeignKey("ion.id", ondelete="RESTRICT"), primary_key=True
    )
    formula: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    cat_sub: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    an_sub: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    total: Mapped[int] = mapped_column(SmallInteger, nullable=False)


class RunInorganicModel(Base):
    __tablename__ = "run_inorganic"

    run_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("game_run.id", ondelete="CASCADE"), primary_key=True
    )
    level_reached: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    compounds_made: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    rows_dropped: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    grids_cleared: Mapped[int] = mapped_column(SmallInteger, nullable=False)


class RunIonChoiceModel(Base):
    """Bo ion nguoi choi chon truoc van — thu tu `slot` quyet dinh mau bong."""

    __tablename__ = "run_ion_choice"

    run_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("run_inorganic.run_id", ondelete="CASCADE"),
        primary_key=True,
    )
    ion_id: Mapped[str] = mapped_column(
        Text, ForeignKey("ion.id", ondelete="RESTRICT"), primary_key=True
    )
    slot: Mapped[int] = mapped_column(SmallInteger, nullable=False)


class RunCompoundModel(Base):
    __tablename__ = "run_compound"
    __table_args__ = (
        ForeignKeyConstraint(
            ["cation_id", "anion_id"],
            ["compound.cation_id", "compound.anion_id"],
            name="fk_run_compound_compound",
        ),
        UniqueConstraint("run_id", "seq", name="uq_run_compound_seq"),
        Index("ix_run_compound_run", "run_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    run_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("run_inorganic.run_id", ondelete="CASCADE"), nullable=False
    )
    seq: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    cation_id: Mapped[str] = mapped_column(Text, nullable=False)
    anion_id: Mapped[str] = mapped_column(Text, nullable=False)
    gained: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    dropped: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    at_ms: Mapped[int] = mapped_column(Integer, nullable=False)


class PlayerCompoundStatModel(Base):
    """Bang tong hop 'da thao hop chat nao' — tranh phai quet run_compound moi lan hien."""

    __tablename__ = "player_compound_stat"
    __table_args__ = (
        ForeignKeyConstraint(
            ["cation_id", "anion_id"],
            ["compound.cation_id", "compound.anion_id"],
            name="fk_player_compound_stat_compound",
        ),
    )

    player_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("player.id", ondelete="CASCADE"), primary_key=True
    )
    cation_id: Mapped[str] = mapped_column(Text, primary_key=True)
    anion_id: Mapped[str] = mapped_column(Text, primary_key=True)
    times_made: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    first_made_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    last_made_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
