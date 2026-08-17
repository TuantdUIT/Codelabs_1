"""Domain service: cac quy tac khong thuoc ve rieng mot entity nao.

Toan bo file nay la ham thuan — test duoc ma khong can DB.
"""

from __future__ import annotations

from enum import StrEnum

from app.modules.auth.domain.entities import Player
from app.modules.auth.domain.value_objects import OAuthProfile


class LinkDecision(StrEnum):
    LINK_EXISTING = "link_existing"
    CREATE_NEW = "create_new"


def decide_account_link(profile: OAuthProfile, existing: Player | None) -> LinkDecision:
    """Co duoc gop tai khoan OAuth moi vao mot Player san co khong?

    Chi gop khi CA HAI phia deu co email da xac thuc va trung nhau. Neu noi long
    dieu kien nay, ke tan cong chi can tao tai khoan o mot provider khong xac thuc
    email la chiem duoc tai khoan nguoi khac.
    """
    if existing is None:
        return LinkDecision.CREATE_NEW
    if not profile.email_verified or profile.email is None:
        return LinkDecision.CREATE_NEW
    if not existing.email_verified or existing.email is None:
        return LinkDecision.CREATE_NEW
    if existing.email.value != profile.email.value:
        return LinkDecision.CREATE_NEW
    return LinkDecision.LINK_EXISTING


def display_name_for(profile: OAuthProfile) -> str:
    """Google tra 'name', Facebook cung 'name' — nhung khong nha nao dam bao co."""
    if profile.name and profile.name.strip():
        return profile.name.strip()
    if profile.email is not None:
        return profile.email.local_part
    return "Nguoi choi moi"
