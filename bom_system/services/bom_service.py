"""BOM Service Implementation"""
import base64
import logging
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple

import requests
from PIL import Image
from sqlalchemy.orm import Session

from ..config import ALLOWED_IMAGE_MIME, HTTP_FETCH_TIMEOUT, MAX_IMAGE_BYTES
from ..interfaces.bom import IBOMService
from ..models import BomTable

logger = logging.getLogger(__name__)

_FORMAT_TO_MIME = {
    "PNG": "image/png",
    "JPEG": "image/jpeg",
    "JPG": "image/jpeg",
    "GIF": "image/gif",
    "BMP": "image/bmp",
    "WEBP": "image/webp",
}


class BOMService(IBOMService):
    """BOM服务实现类"""

    def __init__(self, session: Session):
        self._session = session

    def _validate_image_bytes(self, buf: bytes) -> Tuple[bool, Optional[str]]:
        """Validate image bytes and detect mime"""
        if not buf:
            return False, None
        if len(buf) > MAX_IMAGE_BYTES:
            return False, None
        try:
            with Image.open(BytesIO(buf)) as img:
                fmt = (img.format or "").upper()
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
        self, part_number: str, base64_str: str, part_name: Optional[str] = None
    ) -> int:
        """Save base64 image data"""
        if "," in base64_str and base64_str.strip().lower().startswith("data:"):
            _, encoded = base64_str.split(",", 1)
        else:
            encoded = base64_str
        try:
            image_data = base64.b64decode(encoded, validate=True)
        except Exception as e:
            raise ValueError("Invalid base64 image data") from e

        ok, _ = self._validate_image_bytes(image_data)
        if not ok:
            raise ValueError("Invalid or unsupported image content/size")

        record = BomTable(
            part_number=part_number, part_name=part_name, image_data=image_data
        )
        self._session.add(record)
        self._session.commit()
        return record.id

    def save_url_image(
        self, part_number: str, url: str, part_name: Optional[str] = None
    ) -> int:
        """Fetch image from URL and store"""
        try:
            resp = requests.get(url, timeout=HTTP_FETCH_TIMEOUT)
        except requests.RequestException as e:
            raise ValueError(f"Failed to fetch URL: {e}")

        if resp.status_code != 200:
            raise ValueError(f"Non-200 from URL: {resp.status_code}")

        content_type = resp.headers.get("Content-Type", "").split(";")[0].strip().lower()
        data = resp.content or b""

        ok, detected_mime = self._validate_image_bytes(data)
        if not ok:
            raise ValueError("Invalid or unsupported image content/size from URL")

        record = BomTable(
            part_number=part_number, part_name=part_name, image_url=url, image_data=data
        )
        self._session.add(record)
        self._session.commit()
        return record.id

    def get_image_bytes(self, record_id: int) -> Tuple[bytes, str]:
        """Get image bytes by record ID"""
        record = self._session.query(BomTable).get(record_id)
        if not record or not record.image_data:
            raise LookupError(f"Image not found: {record_id}")
        
        mime = "image/png"
        if record.image_url:
            ext = record.image_url.rsplit(".", 1)[-1].lower() if "." in record.image_url else ""
            mime = _FORMAT_TO_MIME.get(ext.upper(), "image/png")
        
        return record.image_data, mime

    def get_effective_image_bytes(self, record_id: int) -> Tuple[bytes, str]:
        """Get effective image bytes with ancestor fallback"""
        # TODO: 实现祖先追溯逻辑
        return self.get_image_bytes(record_id)

    def import_bom(
        self, file_data: bytes, filename: str, project_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Import BOM from file"""
        from ..importer import import_csv, import_xlsx
        
        if filename.endswith(".csv"):
            return import_csv(file_data, project_id=project_id)
        elif filename.endswith((".xlsx", ".xlsm")):
            return import_xlsx(file_data, project_id=project_id)
        else:
            raise ValueError("Unsupported file type")

    def get_parts(
        self, q: Optional[str] = None, project_id: Optional[int] = None, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get parts list with optional search"""
        query = self._session.query(BomTable)
        
        if project_id:
            query = query.filter(BomTable.project_id == project_id)
        
        if q:
            query = query.filter(BomTable.part_number.like(f"%{q}%"))
        
        parts = query.order_by(BomTable.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": p.id,
                "part_number": p.part_number,
                "part_name": p.part_name,
                "sequence": p.sequence,
                "project_id": p.project_id,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in parts
        ]
