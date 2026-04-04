"""Item Controller - Handles item search (recent items for UI)"""
import logging

from flask import Blueprint, request

from ..response import APIResponse
from ...database.session import get_db_session
from ...models import BomTable
from .base import _escape_like_pattern

logger = logging.getLogger(__name__)
item_bp = Blueprint("item", __name__)


@item_bp.route("/items", methods=["GET"])
def list_items():
    """List recent items for UI: supports ?q=part&limit=20"""
    q = (request.args.get("q") or "").strip()
    try:
        limit = int(request.args.get("limit", "20"))
    except ValueError:
        limit = 20
    limit = max(1, min(100, limit))

    session = get_db_session()
    query = session.query(BomTable)
    
    if q:
        safe_q = _escape_like_pattern(q)
        like = f"%{safe_q}%"
        query = query.filter(BomTable.part_number.like(like, escape='\\'))
    
    rows = query.order_by(BomTable.created_at.desc()).limit(limit).all()

    def ser(r: BomTable):
        return {
            "id": r.id,
            "part_number": r.part_number,
            "part_name": r.part_name,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }

    return APIResponse.success(data={"items": [ser(r) for r in rows]})
