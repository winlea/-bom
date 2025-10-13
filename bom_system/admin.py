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
from .models import BomTable, db

admin_bp = Blueprint("admin", __name__)

def _require_admin():
    token = request.headers.get("X-Admin-Token") or request.args.get("token")
    if ADMIN_TOKEN and token != ADMIN_TOKEN:
        return False
    if not ADMIN_TOKEN:
        return True
    return True

@admin_bp.post("/admin/cleanup")
def cleanup_db():
    if not _require_admin():
        return jsonify({"error": "unauthorized"}), 401
    deleted = db.session.query(BomTable).delete()
    db.session.commit()
    return jsonify({"status": "success", "deleted": deleted})

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
    rec = db.session.get(BomTable, record_id)
    if not rec:
        return jsonify({"error": "not found"}), 404
    data = generate_placeholder(rec.part_number)
    return send_file(
        BytesIO(data),
        mimetype="image/png",
        as_attachment=False,
        download_name=f"ph_{record_id}.png",
    )
