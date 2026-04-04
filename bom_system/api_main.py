"""
BOM System API - Refactored Controller Layer
原来的 1449 行文件已拆分为多个 Controller 模块
"""
import logging

from flask import Flask

from .api.controllers import register_controllers

logger = logging.getLogger(__name__)


def create_api_blueprint():
    """
    Create and configure the API blueprint.
    Blueprints are now registered from api/controllers/
    """
    from .api.controllers import (
        image_bp, import_bp, part_bp, report_bp,
        drawing_bp, ods_bp, capability_bp, item_bp
    )
    
    # 所有控制器现在各自注册，不需要统一蓝图
    # 保留空函数用于兼容
    return None


def init_api(app: Flask):
    """Initialize API routes with the Flask app"""
    register_controllers(app)
    logger.info("API controllers registered successfully")
