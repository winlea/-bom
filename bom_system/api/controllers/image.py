"""Image Controller - Handles image upload/download"""
import logging
from io import BytesIO

from flask import Blueprint, request, send_file

from ..response import APIResponse
# 保留从 bom_system.services (文件) 导入
import bom_system.services as bom_services_module

logger = logging.getLogger(__name__)
image_bp = Blueprint("image", __name__)


@image_bp.route("/upload/base64", methods=["POST"])
def upload_base64():
    """Upload image from base64 data"""
    payload = request.get_json(silent=True) or {}
    part_number = payload.get("part_number")
    image_data = payload.get("image_data")
    part_name = payload.get("part_name")
    
    if not part_number or not image_data:
        return APIResponse.bad_request(
            message="part_number and image_data are required"
        )
    
    try:
        rec_id = save_base64_image(part_number, image_data, part_name)
    except ValueError as e:
        return APIResponse.bad_request(message=str(e))
    
    return APIResponse.success(data={"status": "success", "id": rec_id})


@image_bp.route("/upload/url", methods=["POST"])
def upload_url():
    """Upload image from URL"""
    payload = request.get_json(silent=True) or {}
    part_number = payload.get("part_number")
    url = payload.get("url")
    part_name = payload.get("part_name")
    
    if not part_number or not url:
        return APIResponse.bad_request(
            message="part_number and url are required"
        )
    
    try:
        rec_id = save_url_image(part_number, url, part_name)
    except ValueError as e:
        return APIResponse.bad_request(message=str(e))
    
    return APIResponse.success(data={"status": "success", "id": rec_id})


@image_bp.route("/download/<int:record_id>", methods=["GET"])
def download_image(record_id: int):
    """Download image by record ID with ancestor fallback"""
    try:
        data, mime = bom_services_module.get_image_bytes(record_id)
    except LookupError:
        try:
            data, mime = bom_services_module.get_effective_image_bytes(record_id)
        except LookupError:
            return APIResponse.not_found(message="Image not found")
    
    return send_file(
        BytesIO(data),
        mimetype=mime,
        as_attachment=False,
        download_name=f"image_{record_id}",
    )
