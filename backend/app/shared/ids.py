"""Dinh danh dung chung giua cac module.

Module khac chi duoc tham chieu tai nguyen cua auth qua PlayerId, khong qua entity.
"""

from typing import NewType
from uuid import UUID

PlayerId = NewType("PlayerId", UUID)
SessionId = NewType("SessionId", UUID)
RunId = NewType("RunId", UUID)
