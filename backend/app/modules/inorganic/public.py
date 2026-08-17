"""Mat tien cua module vo co."""

from app.modules.inorganic.domain.scoring import compound_points
from app.modules.inorganic.infrastructure.verifier import InorganicRunVerifier

__all__ = ["InorganicRunVerifier", "compound_points"]
