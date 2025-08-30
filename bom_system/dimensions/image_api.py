"""
尺寸图片相关API
"""

import logging
from flask import Blueprint, jsonify, request
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from bom_system.config import SQLALCHEMY_DATABASE_URI
from bom_system.dimensions.image_service import DimensionImageService
from bom_system.dimensions.services import DimensionService

# 创建蓝图
dimension_image_bp = Blueprint("dimension_image", __name__, url_prefix="/api/dimensions/images")

# 配置日志
logger = logging.getLogger(__name__)


def get_db_session():
    """获取数据库会话"""
    engine = create_engine(SQLALCHEMY_DATABASE_URI)
    Session = sessionmaker(bind=engine)
    return Session()


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
        
        # 保存图片
        success = image_service.save_canvas_image_to_db(
            dimension_id=dimension_id,
            canvas_data_url=canvas_data_url,
            image_type=image_type
        )
        
        db_session.close()
        
        if success:
            return jsonify({
                "success": True,
                "message": "Canvas图片保存成功"
            })
        else:
            return jsonify({
                "success": False,
                "message": "Canvas图片保存失败"
            }), 500
            
    except Exception as e:
        logger.error(f"保存Canvas图片失败: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"保存Canvas图片失败: {str(e)}"
        }), 500


@dimension_image_bp.route("/save-combined", methods=["POST"])
def save_combined_images():
    """保存拼接的尺寸图片组合"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "message": "请提供拼接数据"}), 400
        
        project_id = data.get("projectId")
        part_id = data.get("partId")
        dimension_images = data.get("dimensionImages", [])
        layout_config = data.get("layoutConfig", {})
        
        if not project_id:
            return jsonify({"success": False, "message": "请提供项目ID"}), 400
        
        if not part_id:
            return jsonify({"success": False, "message": "请提供零件ID"}), 400
        
        if not dimension_images:
            return jsonify({"success": False, "message": "请提供尺寸图片数据"}), 400
        
        db_session = get_db_session()
        image_service = DimensionImageService(db_session)
        
        # 保存拼接图片
        combined_image_url = image_service.save_combined_dimension_images(
            project_id=project_id,
            part_id=part_id,
            dimension_images=dimension_images,
            layout_config=layout_config
        )
        
        db_session.close()
        
        return jsonify({
            "success": True,
            "message": "拼接图片保存成功",
            "data": {
                "combinedImageUrl": combined_image_url
            }
        })
        
    except Exception as e:
        logger.error(f"保存拼接图片失败: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"保存拼接图片失败: {str(e)}"
        }), 500


@dimension_image_bp.route("/batch-save-canvas", methods=["POST"])
def batch_save_canvas_images():
    """批量保存多个尺寸的Canvas图片"""
    try:
        # 记录请求信息
        logger.info("收到批量保存Canvas图片请求")
        
        data = request.get_json()
        logger.info(f"请求数据: {data}")
        
        if not data:
            logger.error("请求数据为空")
            return jsonify({"success": False, "message": "请提供批量图片数据"}), 400
        
        canvas_images = data.get("canvasImages", [])
        logger.info(f"Canvas图片数量: {len(canvas_images)}")
        
        if not canvas_images:
            logger.error("Canvas图片数据列表为空")
            return jsonify({"success": False, "message": "请提供Canvas图片数据列表"}), 400
        
        try:
            db_session = get_db_session()
            logger.info("数据库连接成功")
        except Exception as e:
            logger.error(f"数据库连接失败: {str(e)}")
            return jsonify({"success": False, "message": f"数据库连接失败: {str(e)}"}), 500
        
        image_service = DimensionImageService(db_session)
        
        success_count = 0
        error_count = 0
        errors = []
        
        # 批量处理每个图片
        for i, img_data in enumerate(canvas_images):
            try:
                logger.info(f"处理第 {i+1} 个图片: {img_data.keys()}")
                
                dimension_id = img_data.get("dimensionId")
                canvas_data_url = img_data.get("canvasDataUrl")
                image_type = img_data.get("imageType", "canvas")
                
                logger.info(f"尺寸ID: {dimension_id}, 图片类型: {image_type}")
                logger.info(f"Canvas数据长度: {len(canvas_data_url) if canvas_data_url else 0}")
                
                if not dimension_id:
                    error_msg = f"尺寸ID缺失"
                    logger.error(error_msg)
                    error_count += 1
                    errors.append(error_msg)
                    continue
                
                if not canvas_data_url:
                    error_msg = f"尺寸ID {dimension_id}: Canvas数据缺失"
                    logger.error(error_msg)
                    error_count += 1
                    errors.append(error_msg)
                    continue
                
                success = image_service.save_canvas_image_to_db(
                    dimension_id=dimension_id,
                    canvas_data_url=canvas_data_url,
                    image_type=image_type
                )
                
                if success:
                    success_count += 1
                    logger.info(f"尺寸ID {dimension_id}: 保存成功")
                else:
                    error_count += 1
                    error_msg = f"尺寸ID {dimension_id}: 保存失败"
                    logger.error(error_msg)
                    errors.append(error_msg)
                    
            except Exception as e:
                error_count += 1
                error_msg = f"尺寸ID {img_data.get('dimensionId', 'unknown')}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        db_session.close()
        
        result = {
            "success": True,
            "message": f"批量保存完成: 成功 {success_count} 个，失败 {error_count} 个",
            "data": {
                "successCount": success_count,
                "errorCount": error_count,
                "errors": errors
            }
        }
        
        logger.info(f"批量保存结果: {result}")
        return jsonify(result)
        
    except Exception as e:
        error_msg = f"批量保存Canvas图片失败: {str(e)}"
        logger.error(error_msg)
        return jsonify({
            "success": False,
            "message": error_msg
        }), 500


@dimension_image_bp.route("/<int:dimension_id>", methods=["GET"])
def get_dimension_image(dimension_id):
    """获取尺寸图片信息"""
    try:
        db_session = get_db_session()
        image_service = DimensionImageService(db_session)
        
        image_data = image_service.get_dimension_image_data(dimension_id)
        
        db_session.close()
        
        if image_data:
            return jsonify({
                "success": True,
                "data": image_data
            })
        else:
            return jsonify({
                "success": False,
                "message": "未找到图片数据"
            }), 404
            
    except Exception as e:
        logger.error(f"获取尺寸图片失败: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"获取尺寸图片失败: {str(e)}"
        }), 500


@dimension_image_bp.route("/<int:dimension_id>", methods=["DELETE"])
def delete_dimension_image(dimension_id):
    """删除尺寸图片"""
    try:
        db_session = get_db_session()
        image_service = DimensionImageService(db_session)
        
        success = image_service.delete_dimension_image(dimension_id)
        
        db_session.close()
        
        if success:
            return jsonify({
                "success": True,
                "message": "图片删除成功"
            })
        else:
            return jsonify({
                "success": False,
                "message": "图片删除失败或不存在"
            }), 404
            
    except Exception as e:
        logger.error(f"删除尺寸图片失败: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"删除尺寸图片失败: {str(e)}"
        }), 500


@dimension_image_bp.route("/project/<project_id>/part/<part_id>/combined", methods=["POST"])
def create_combined_dimension_sheet():
    """为指定项目和零件创建尺寸图片拼接表"""
    try:
        data = request.get_json() or {}
        
        db_session = get_db_session()
        dimension_service = DimensionService(db_session)
        image_service = DimensionImageService(db_session)
        
        # 获取该零件的所有尺寸
        dimensions = dimension_service.get_dimensions_by_part_number(project_id, part_id)
        
        if not dimensions:
            db_session.close()
            return jsonify({
                "success": False,
                "message": "未找到该零件的尺寸数据"
            }), 404
        
        # 收集所有有图片的尺寸
        dimension_images = []
        for dim in dimensions:
            if dim.image_url:
                # 这里需要从前端传递Canvas数据，或者从已保存的图片生成
                # 暂时使用占位符，实际使用时需要前端提供Canvas数据
                dimension_images.append({
                    'id': dim.id,
                    'canvas_data': data.get('canvasData', {}).get(str(dim.id), ''),
                    'position': {
                        'group_no': dim.group_no,
                        'characteristic': dim.characteristic
                    }
                })
        
        if not dimension_images:
            db_session.close()
            return jsonify({
                "success": False,
                "message": "该零件没有可拼接的尺寸图片"
            }), 400
        
        # 创建拼接图片
        layout_config = data.get('layoutConfig', {
            'canvas_width': 1200,
            'canvas_height': 800,
            'grid_cols': 3,
            'padding': 30,
            'spacing': 20
        })
        
        combined_image_url = image_service.save_combined_dimension_images(
            project_id=project_id,
            part_id=part_id,
            dimension_images=dimension_images,
            layout_config=layout_config
        )
        
        db_session.close()
        
        return jsonify({
            "success": True,
            "message": "尺寸拼接表创建成功",
            "data": {
                "combinedImageUrl": combined_image_url,
                "dimensionCount": len(dimension_images),
                "projectId": project_id,
                "partId": part_id
            }
        })
        
    except Exception as e:
        logger.error(f"创建尺寸拼接表失败: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"创建尺寸拼接表失败: {str(e)}"
        }), 500


# 错误处理
@dimension_image_bp.errorhandler(404)
def not_found(error):
    return jsonify({"success": False, "message": "接口不存在"}), 404


@dimension_image_bp.errorhandler(500)
def internal_error(error):
    return jsonify({"success": False, "message": "服务器内部错误"}), 500