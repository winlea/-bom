import logging
from io import BytesIO

from flask import Blueprint, jsonify, request, send_file
from PIL import Image, ImageDraw, ImageFont

from .config import (
    ADMIN_TOKEN,
    PLACEHOLDER_BG,
    PLACEHOLDER_ENABLED,
    PLACEHOLDER_FG,
    PLACEHOLDER_HEIGHT,
    PLACEHOLDER_TEXT_FMT,
    PLACEHOLDER_WIDTH,
)
from .database.session import get_db_session
from .models import BomTable

logger = logging.getLogger(__name__)

admin_bp = Blueprint("admin", __name__)

# 防止意外清理: 必须在请求体中显式确认
_CLEANUP_CONFIRM_KEY = "confirm"
_CLEANUP_CONFIRM_VALUE = "DELETE_ALL_DATA"


def _require_admin():
    token = request.headers.get("X-Admin-Token") or request.args.get("token")
    if ADMIN_TOKEN and token != ADMIN_TOKEN:
        return False
    if not ADMIN_TOKEN:
        return True
    return True


@admin_bp.post("/admin/cleanup")
def cleanup_db():
    """清空 BOM 表数据。必须在请求体中携带 {"confirm": "DELETE_ALL_DATA"} 才能执行。"""
    if not _require_admin():
        logger.warning("cleanup_db: 未授权访问")
        return jsonify({"error": "unauthorized"}), 401

    payload = request.get_json(silent=True) or {}
    confirm_value = payload.get(_CLEANUP_CONFIRM_KEY)

    if confirm_value != _CLEANUP_CONFIRM_VALUE:
        logger.warning("cleanup_db: 缺少确认参数，操作已拒绝")
        return jsonify({
            "error": "confirmation_required",
            "message": f'请求体必须包含 {{"{_CLEANUP_CONFIRM_KEY}": "{_CLEANUP_CONFIRM_VALUE}"}} 才能执行清理',
        }), 400

    try:
        session = get_db_session()
        deleted = session.query(BomTable).delete()
        session.commit()
        logger.info("cleanup_db: 已删除 %d 条 BOM 记录", deleted)
        return jsonify({"status": "success", "deleted": deleted})
    except Exception as e:
        session.rollback()
        logger.error("cleanup_db: 清理失败 - %s", str(e))
        return jsonify({"error": "cleanup_failed", "message": str(e)}), 500


def _hex_to_rgb(hex_color: str):
    hex_color = hex_color.lstrip("#")
    lv = len(hex_color)
    if lv == 3:
        hex_color = "".join([c * 2 for c in hex_color])
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def generate_placeholder(
    part_number: str, width: int = PLACEHOLDER_WIDTH, height: int = PLACEHOLDER_HEIGHT
) -> bytes:
    bg = _hex_to_rgb(PLACEHOLDER_BG)
    fg = _hex_to_rgb(PLACEHOLDER_FG)
    text = (PLACEHOLDER_TEXT_FMT or "{part_number}").format(
        part_number=part_number or ""
    )

    img = Image.new("RGB", (width, height), color=bg)
    draw = ImageDraw.Draw(img)
    font_size = max(12, width // 12)
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()
    text_w, text_h = draw.textbbox((0, 0), text, font=font)[2:]
    draw.text(((width - text_w) / 2, (height - text_h) / 2), text, fill=fg, font=font)

    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@admin_bp.get("/placeholder/<int:record_id>.png")
def placeholder_image(record_id: int):
    session = get_db_session()
    rec = session.get(BomTable, record_id)
    if not rec:
        return jsonify({"error": "not found"}), 404
    data = generate_placeholder(rec.part_number)
    return send_file(
        BytesIO(data),
        mimetype="image/png",
        as_attachment=False,
        download_name=f"ph_{record_id}.png",
    )
