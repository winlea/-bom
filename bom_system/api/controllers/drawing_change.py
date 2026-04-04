"""Drawing Change Controller - Handles drawing change records"""
import logging
from datetime import datetime

from flask import Blueprint, request

from ..response import APIResponse
from ...database.session import get_db_session
from ...models import DrawingChange

logger = logging.getLogger(__name__)
drawing_bp = Blueprint("drawing_change", __name__)


@drawing_bp.route("/drawing-changes", methods=["POST"])
def create_drawing_change():
    """Create a new drawing change"""
    session = None
    try:
        data = request.get_json()
        if not data:
            return APIResponse.bad_request(message="request body required")

        required_fields = [
            "project_id", "part_id", "part_name", "part_number",
            "drawing_number", "engineering_change_level", "drawing_change_version",
            "cr_number", "change_count", "change_date"
        ]
        
        if not all(data.get(f) for f in required_fields):
            return APIResponse.bad_request(message="all fields are required")

        drawing_change = DrawingChange(
            project_id=data["project_id"],
            part_id=data["part_id"],
            part_name=data["part_name"],
            part_number=data["part_number"],
            drawing_number=data["drawing_number"],
            engineering_change_level=data["engineering_change_level"],
            drawing_change_version=data["drawing_change_version"],
            cr_number=data["cr_number"],
            change_count=data["change_count"],
            change_date=datetime.strptime(data["change_date"], "%Y-%m-%d").date()
        )

        session = get_db_session()
        session.add(drawing_change)

        return APIResponse.created(
            data={
                "id": drawing_change.id,
                "part_name": drawing_change.part_name,
                "part_number": drawing_change.part_number,
                "drawing_number": drawing_change.drawing_number,
                "engineering_change_level": drawing_change.engineering_change_level,
                "drawing_change_version": drawing_change.drawing_change_version,
                "cr_number": drawing_change.cr_number,
                "change_count": drawing_change.change_count,
                "change_date": drawing_change.change_date.isoformat(),
                "created_at": drawing_change.created_at.isoformat() if drawing_change.created_at else None,
            }
        )
    except Exception as e:
        if session:
            session.rollback()
        return APIResponse.internal_server_error(
            message=f"Create drawing change failed: {str(e)}",
            errors={"error": "create drawing change failed"}
        )


@drawing_bp.route("/drawing-changes", methods=["GET"])
def list_drawing_changes():
    """List all drawing changes"""
    try:
        drawing_changes = DrawingChange.query.order_by(
            DrawingChange.created_at.desc()
        ).all()

        def ser(dc):
            return {
                "id": dc.id,
                "part_name": dc.part_name,
                "part_number": dc.part_number,
                "drawing_number": dc.drawing_number,
                "engineering_change_level": dc.engineering_change_level,
                "drawing_change_version": dc.drawing_change_version,
                "cr_number": dc.cr_number,
                "change_count": dc.change_count,
                "change_date": dc.change_date.isoformat(),
                "created_at": dc.created_at.isoformat() if dc.created_at else None,
            }

        return APIResponse.success(data=[ser(dc) for dc in drawing_changes])
    except Exception as e:
        return APIResponse.internal_server_error(
            message=f"List drawing changes failed: {str(e)}",
            errors={"error": "list drawing changes failed"}
        )
