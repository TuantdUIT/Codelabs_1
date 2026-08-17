"""Doc shared/chemistry.json — du lieu hoa hoc sinh tu code TypeScript.

Dat o core/ chu khong o mot module nghiep vu nao: ca `inorganic` (ion, hop chat)
lan `organic` (dong phan) deu can, ma hai module do khong duoc biet nhau.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

# Mac dinh: backend/app/core/chemistry_file.py -> len 3 cap la goc repo.
# Trong container thi cay thu muc khac nen dat bien CHEMISTRY_JSON de tro thang.
CHEMISTRY_JSON = Path(
    os.getenv("CHEMISTRY_JSON") or Path(__file__).resolve().parents[3] / "shared" / "chemistry.json"
)


def load_chemistry(path: Path | None = None) -> dict[str, Any]:
    source = path or CHEMISTRY_JSON
    if not source.exists():
        raise FileNotFoundError(
            f"Khong thay {source}. Chay `npm run export:chemistry` trong thu muc frontend/."
        )
    return json.loads(source.read_text(encoding="utf-8"))
