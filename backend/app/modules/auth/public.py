"""Mat tien cua module auth.

Cac module khac (gameplay, inorganic, organic) CHI duoc import tu file nay.
Khong bao gio import truc tiep vao domain/, application/, infrastructure/.

Router khong nam o day: `main.py` la composition root, tu lay tu `api.router`.
Neu de router o public.py thi module khac import public se keo theo ca FastAPI
va `app.container`, sinh vong import.
"""

from app.modules.auth.api.deps import CurrentPlayer, current_player
from app.modules.auth.domain.entities import Player
from app.shared.ids import PlayerId

__all__ = ["CurrentPlayer", "Player", "PlayerId", "current_player"]
