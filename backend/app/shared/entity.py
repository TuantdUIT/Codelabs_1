"""Shared kernel: lop nen cho entity, aggregate root va domain event."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


@dataclass(frozen=True, slots=True)
class DomainEvent:
    occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC))


@dataclass(eq=False)
class Entity:
    """Hai entity bang nhau khi cung id, khong so sanh theo gia tri."""

    id: Any

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Entity):
            return NotImplemented
        return type(self) is type(other) and self.id == other.id

    def __hash__(self) -> int:
        return hash((type(self).__name__, self.id))


@dataclass(eq=False)
class AggregateRoot(Entity):
    _events: list[DomainEvent] = field(default_factory=list, repr=False, compare=False)

    def record(self, event: DomainEvent) -> None:
        self._events.append(event)

    def pull_events(self) -> list[DomainEvent]:
        events, self._events = self._events, []
        return events
