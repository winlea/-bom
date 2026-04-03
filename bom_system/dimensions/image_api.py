"""
尺寸图片相关API
"""

import logging

from flask import Blueprint, jsonify, request

from bom_system.database.session import get_db_session
from bom_system.dimensions.image_service import DimensionImageService
from bom_system.dimensions.services import DimensionService

# 创建蓝图
dimension_image_bp = Blueprint(
    "dimension_image", __name__, url_prefix="/api/dimensions/images"
)

# 配置日志
logger = logging.getLogger(__name__)


@dimension_image_bp.route("/save-canvas", methods=["POST"])
def save_canvas_image():
    """保存Canvas生成的尺寸图片到数据库"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "请提供图片数据"}), 400

        dimension_id = data.get("dimensionId")
        canvas_data_url = data.get("canvasDataUrl")
        image_type = data.get("imageType", "canvas")

        if not dimension_id:
            return jsonify({"success": False, "message": "请提供尺寸ID"}), 400

        if not canvas_data_url:
            return jsonify({"success": False, "message": "请提供Canvas图片数据"}), 400

        db_session = get_db_session()
        image_service = DimensionImageService(db_session)

        success = image_service.save_canvas_image_to_db(
            dimension_id=dimension_id,
            canvas_data_url=canvas_data_url,
            image_type=image_type,
        )

        return jsonify({"success": success, "message": "图片保存成功" if success else "图片保存失败"})
    except Exception as e:
        logger.error(f"保存Canvas图片失败: {str(e)}")
        return jsonify({"success": False, "message": f"保存失败: {str(e)}"}), 500
