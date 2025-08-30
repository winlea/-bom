import base64
from io import BytesIO
from typing import Optional, Tuple

import requests
from PIL import Image

from .config import ALLOWED_IMAGE_MIME, HTTP_FETCH_TIMEOUT, MAX_IMAGE_BYTES
from .models import BomTable, db

_FORMAT_TO_MIME = {
    "PNG": "image/png",
    "JPEG": "image/jpeg",
    "JPG": "image/jpeg",
    "GIF": "image/gif",
    "BMP": "image/bmp",
    "WEBP": "image/webp",
}


def _validate_image_bytes(buf: bytes) -> Tuple[bool, Optional[str]]:
    """Validate image bytes and detect mime using Pillow.
    Returns (ok, mime) where mime is e.g., 'image/png' or None.
    """
    if not buf:
        return False, None
    if len(buf) > MAX_IMAGE_BYTES:
        return False, None
    try:
        with Image.open(BytesIO(buf)) as img:
            fmt = (img.format or "").upper()
            # Force decode to ensure content is actually an image
            img.load()
    except Exception:
        return False, None
    mime = _FORMAT_TO_MIME.get(fmt)
    if not mime:
        return False, None
    if ALLOWED_IMAGE_MIME and mime not in ALLOWED_IMAGE_MIME:
        return False, None
    return True, mime


def save_base64_image(
    part_number: str, base64_str: str, part_name: Optional[str] = None
) -> int:
    """Save base64 data URI or raw base64 string for an image.
    Returns created record ID.
    """
    if "," in base64_str and base64_str.strip().lower().startswith("data:"):
        _, encoded = base64_str.split(",", 1)
    else:
        encoded = base64_str
    try:
        image_data = base64.b64decode(encoded, validate=True)
    except Exception as e:
        raise ValueError("Invalid base64 image data") from e

    ok, _ = _validate_image_bytes(image_data)
    if not ok:
        raise ValueError("Invalid or unsupported image content/size")

    record = BomTable(
        part_number=part_number, part_name=part_name, image_data=image_data
    )
    db.session.add(record)
    db.session.commit()
    return record.id


def save_url_image(part_number: str, url: str, part_name: Optional[str] = None) -> int:
    """Fetch image from URL and store bytes + URL reference. Returns record ID."""
    try:
        resp = requests.get(url, timeout=HTTP_FETCH_TIMEOUT)
    except requests.RequestException as e:
        raise ValueError(f"Failed to fetch URL: {e}")

    if resp.status_code != 200:
        raise ValueError(f"Non-200 from URL: {resp.status_code}")

    content_type = resp.headers.get("Content-Type", "").split(";")[0].strip().lower()
    data = resp.content or b""

    ok, detected_mime = _validate_image_bytes(data)
    if not ok:
        raise ValueError("Invalid or unsupported image content/size from URL")

    # Prefer detected mime; optionally enforce against header if header provided and allowed set present
    if content_type and ALLOWED_IMAGE_MIME and content_type not in ALLOWED_IMAGE_MIME:
        if detected_mime not in ALLOWED_IMAGE_MIME:
            raise ValueError("Disallowed image mime from URL")

    record = BomTable(
        part_number=part_number, part_name=part_name, image_url=url, image_data=data
    )
    db.session.add(record)
    db.session.commit()
    return record.id


def get_image_bytes(record_id: int) -> Tuple[bytes, str]:
    """Load image by ID and return bytes and detected mimetype."""
    rec = db.session.get(BomTable, record_id)
    if not rec or not rec.image_data:
        raise LookupError("Image not found")
    data = rec.image_data
    ok, mime = _validate_image_bytes(data)
    if not ok or not mime:
        mime = "application/octet-stream"
    return data, mime


def get_effective_image_bytes(record_id: int) -> Tuple[bytes, str]:
    """Return this record's image bytes if present; otherwise try ancestor levels based on sequence.
    Falls back to LookupError if none found.
    """
    rec = db.session.get(BomTable, record_id)
    if not rec:
        raise LookupError("not found")
    # Use self image
    if rec.image_data:
        data = rec.image_data
        ok, mime = _validate_image_bytes(data)
        if ok and mime:
            return data, mime
    # Try ancestors by sequence prefixes
    seq = (rec.sequence or "").strip()
    if seq:
        parts = seq.split(".")
        for cut in range(len(parts) - 1, 0, -1):
            prefix = ".".join(parts[:cut])
            cand = (
                db.session.query(BomTable)
                .filter(BomTable.sequence == prefix, BomTable.image_data.isnot(None))
                .order_by(BomTable.bom_sort.asc())
                .first()
            )
            if cand and cand.image_data:
                ok, mime = _validate_image_bytes(cand.image_data)
                if ok and mime:
                    return cand.image_data, mime
    raise LookupError("Image not found")
