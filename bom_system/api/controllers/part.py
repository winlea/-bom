"""Part Controller - Handles Part CRUD operations"""
import logging
from io import BytesIO
from typing import Any

from flask import Blueprint, request, send_file, Response

from ..response import APIResponse
from ...database.session import get_db_session
from ...models import BomTable
from .base import _escape_like_pattern

logger = logging.getLogger(__name__)
part_bp = Blueprint("part", __name__)


@part_bp.route("/parts", methods=["GET"])
def list_parts() -> Response:
    """List parts with project filter: supports ?project_id=1&q=part"""
    try:
        project_id = (
            int(request.args.get("project_id"))
            if request.args.get("project_id")
            else None
        )
    except ValueError:
        project_id = None

    q = (request.args.get("q") or "").strip()

    session = get_db_session()
    query = session.query(BomTable)

    if project_id:
        query = query.filter(BomTable.project_id == project_id)

    if q:
        safe_q = _escape_like_pattern(q)
        like = f"%{safe_q}%"
        query = query.filter(BomTable.part_number.like(like, escape='\\'))

    rows = query.order_by(BomTable.bom_sort.asc(), BomTable.created_at.desc()).all()

    # 去重：按(project_id, part_number, sequence)分组，只保留最新记录
    unique_parts = {}
    for part in rows:
        sequence = part.sequence or ""
        key = (part.project_id, part.part_number, sequence)
        if key not in unique_parts:
            unique_parts[key] = part
        elif part.created_at and unique_parts[key].created_at and part.created_at > unique_parts[key].created_at:
            unique_parts[key] = part

    unique_rows = list(unique_parts.values())

    def ser_part(r: BomTable):
        image_url = r.image_url
        if not image_url and r.image_data:
            image_url = f"/api/parts/{r.id}/image"

        return {
            "id": r.id,
            "project_id": r.project_id,
            "part_number": r.part_number,
            "part_name": r.part_name,
            "sequence": r.sequence,
            "assembly_level": r.assembly_level,
            "original_material": r.original_material,
            "final_material_cn": r.final_material_cn,
            "net_weight_kg": r.net_weight_kg,
            "drawing_2d": r.drawing_2d,
            "drawing_3d": r.drawing_3d,
            "image_url": image_url,
            "part_category": r.part_category,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "has_image": bool(r.image_data)
        }

    return APIResponse.success(data={"items": [ser_part(r) for r in unique_rows]})


@part_bp.route("/parts/<int:part_id>", methods=["GET"])
def get_part(part_id: int) -> Response:
    """Get a single part"""
    try:
        session = get_db_session()
        part = session.query(BomTable).get(part_id)
        if not part:
            return APIResponse.not_found(message="part not found")

        return APIResponse.success(
            data={
                "id": part.id,
                "project_id": part.project_id,
                "part_number": part.part_number,
                "part_name": part.part_name,
                "sequence": part.sequence,
                "assembly_level": part.assembly_level,
                "original_material": part.original_material,
                "final_material_cn": part.final_material_cn,
                "net_weight_kg": part.net_weight_kg,
                "drawing_2d": part.drawing_2d,
                "drawing_3d": part.drawing_3d,
                "image_url": part.image_url,
                "part_category": part.part_category,
                "created_at": part.created_at.isoformat() if part.created_at else None,
            }
        )
    except Exception as e:
        return APIResponse.internal_server_error(
            message=f"Get part failed: {str(e)}",
            errors={"error": "get part failed"}
        )


@part_bp.route("/parts", methods=["POST"])
def create_part() -> Response:
    """Create a new part"""
    session = None
    try:
        data = request.get_json()
        if not data:
            return APIResponse.bad_request(message="request body required")

        part_number = data.get("part_number")
        part_name = data.get("part_name")
        project_id = data.get("project_id")

        if not part_number or not part_name or not project_id:
            return APIResponse.bad_request(
                message="part_number, part_name, and project_id are required"
            )

        part = BomTable(
            part_number=part_number,
            part_name=part_name,
            project_id=project_id,
            sequence=data.get("sequence"),
            assembly_level=data.get("assembly_level"),
            original_material=data.get("original_material"),
            final_material_cn=data.get("final_material_cn"),
            net_weight_kg=data.get("net_weight_kg"),
            drawing_2d=data.get("drawing_2d"),
            drawing_3d=data.get("drawing_3d"),
            image_url=data.get("image_url"),
            part_category=data.get("part_category"),
        )

        session = get_db_session()
        session.add(part)

        return APIResponse.created(
            data={
                "id": part.id,
                "part_number": part.part_number,
                "part_name": part.part_name,
                "project_id": part.project_id,
                "created_at": part.created_at.isoformat() if part.created_at else None,
            }
        )
    except Exception as e:
        if session:
            session.rollback()
        return APIResponse.internal_server_error(
            message=f"Create part failed: {str(e)}",
            errors={"error": "create part failed"}
        )


@part_bp.route("/parts/<int:part_id>", methods=["PUT"])
def update_part(part_id: int) -> Response:
    """Update an existing part"""
    session = None
    try:
        data = request.get_json()
        if not data:
            return APIResponse.bad_request(message="request body required")

        session = get_db_session()
        part = session.query(BomTable).get(part_id)
        if not part:
            return APIResponse.not_found(message="part not found")

        # Update fields
        update_fields = [
            "part_name", "sequence", "assembly_level", "original_material",
            "final_material_cn", "net_weight_kg", "drawing_2d", "drawing_3d",
            "image_url", "part_category"
        ]
        for field in update_fields:
            if field in data:
                setattr(part, field, data[field])

        return APIResponse.success(
            data={
                "id": part.id,
                "part_number": part.part_number,
                "part_name": part.part_name,
                "project_id": part.project_id,
                "created_at": part.created_at.isoformat() if part.created_at else None,
            }
        )
    except Exception as e:
        if session:
            session.rollback()
        return APIResponse.internal_server_error(
            message=f"Update part failed: {str(e)}",
            errors={"error": "update part failed"}
        )


@part_bp.route("/parts/<int:part_id>", methods=["DELETE"])
def delete_part(part_id):
    """Delete a part"""
    session = None
    try:
        session = get_db_session()
        part = session.query(BomTable).get(part_id)
        if not part:
            return APIResponse.not_found(message="part not found")

        session.delete(part)
        return APIResponse.success(message="part deleted", data={"status": "success"})
    except Exception as e:
        if session:
            session.rollback()
        return APIResponse.internal_server_error(
            message=f"Delete part failed: {str(e)}",
            errors={"error": "delete part failed"}
        )


@part_bp.route("/parts/<int:part_id>/image", methods=["GET"])
def get_part_image(part_id: int) -> Response:
    """Get part image, returns placeholder if no image exists"""
    try:
        import os
        
        session = get_db_session()
        part = session.query(BomTable).get(part_id)
        if not part:
            return APIResponse.not_found(message="Part not found")

        # 如果有图片数据，返回图片
        if part.image_data:
            import imghdr
            image_type = imghdr.what(None, part.image_data)
            if not image_type:
                image_type = "png"

            return send_file(
                BytesIO(part.image_data),
                mimetype=f"image/{image_type}",
                as_attachment=False,
                download_name=f"part_{part_id}.{image_type}",
            )

        # 没有图片数据，返回占位图
        # 使用零件编号作为占位图文字
        part_number = part.part_number or f"ID:{part_id}"
        
        # 动态生成 SVG 占位图（包含零件编号）
        svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="240" height="180" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f3f9"/>
  <rect x="10" y="10" width="220" height="160" rx="8" fill="#ffffff" stroke="#d0d8e8" stroke-width="2"/>
  <text x="120" y="85" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7c99">
    📷 无零件简图
  </text>
  <text x="120" y="105" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#8b9dc3">
    {part_number}
  </text>
  <text x="120" y="125" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#aabbdd">
    请上传零件简图
  </text>
</svg>'''

        return send_file(
            BytesIO(svg_content.encode('utf-8')),
            mimetype="image/svg+xml",
            as_attachment=False,
            download_name=f"placeholder_{part_id}.svg",
        )
    except Exception as e:
        logger.debug(f"获取图片失败: {e}")
        return APIResponse.internal_server_error(
            message=f"Get part image failed: {str(e)}",
            errors={"error": "get part image failed"}
        )
