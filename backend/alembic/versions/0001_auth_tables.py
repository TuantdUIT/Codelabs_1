"""auth tables: player, identity, auth_session, player_settings

Revision ID: 0001_auth_tables
Revises:
Create Date: 2026-08-17

Viet tay (khong autogenerate) vi may dung khong co Postgres de so sanh schema.
Cac cho autogenerate thuong bo sot va da duoc dat thu cong o day:
  - CHECK constraint cua `identity.provider` va `player_settings.volume`
  - index co dieu kien `ix_auth_session_active ... WHERE revoked_at IS NULL`
  - kieu INET cua `auth_session.ip`
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_auth_tables"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "player",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("display_name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=True),
        sa.Column("email_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("is_guest", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_player"),
        sa.UniqueConstraint("email", name="uq_player_email"),
    )

    op.create_table(
        "identity",
        sa.Column("provider", sa.Text(), nullable=False),
        sa.Column("provider_user_id", sa.Text(), nullable=False),
        sa.Column("player_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.Text(), nullable=True),
        sa.Column(
            "linked_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "provider IN ('google', 'facebook', 'github')", name="ck_identity_provider"
        ),
        sa.ForeignKeyConstraint(
            ["player_id"], ["player.id"], name="fk_identity_player", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("provider", "provider_user_id", name="pk_identity"),
    )
    op.create_index("ix_identity_player_id", "identity", ["player_id"])

    op.create_table(
        "auth_session",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("player_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("refresh_token_hash", sa.Text(), nullable=False),
        sa.Column(
            "issued_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rotated_from", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("ip", postgresql.INET(), nullable=True),
        sa.ForeignKeyConstraint(
            ["player_id"], ["player.id"], name="fk_auth_session_player", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["rotated_from"],
            ["auth_session.id"],
            name="fk_auth_session_rotated_from",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_auth_session"),
        sa.UniqueConstraint("refresh_token_hash", name="uq_auth_session_token_hash"),
    )
    op.create_index(
        "ix_auth_session_active",
        "auth_session",
        ["player_id"],
        postgresql_where=sa.text("revoked_at IS NULL"),
    )

    op.create_table(
        "player_settings",
        sa.Column("player_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("track_id", sa.Text(), nullable=True),
        sa.Column("volume", postgresql.REAL(), server_default=sa.text("0.55"), nullable=False),
        sa.Column("muted", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column(
            "last_setup",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("volume >= 0 AND volume <= 1", name="ck_player_settings_volume"),
        sa.ForeignKeyConstraint(
            ["player_id"], ["player.id"], name="fk_player_settings_player", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("player_id", name="pk_player_settings"),
    )


def downgrade() -> None:
    op.drop_table("player_settings")
    op.drop_index("ix_auth_session_active", table_name="auth_session")
    op.drop_table("auth_session")
    op.drop_index("ix_identity_player_id", table_name="identity")
    op.drop_table("identity")
    op.drop_table("player")
