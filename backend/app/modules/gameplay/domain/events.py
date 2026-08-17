"""Domain event cua mien gameplay."""

from __future__ import annotations

from dataclasses import dataclass

from app.modules.gameplay.domain.value_objects import GameMode
from app.shared.entity import DomainEvent
from app.shared.ids import PlayerId, RunId


@dataclass(frozen=True, slots=True, kw_only=True)
class RunStarted(DomainEvent):
    run_id: RunId
    player_id: PlayerId
    mode: GameMode


@dataclass(frozen=True, slots=True, kw_only=True)
class RunFinished(DomainEvent):
    run_id: RunId
    player_id: PlayerId
    score: int
    verified: bool
