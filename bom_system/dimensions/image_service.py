"""
尺寸图片处理服务
"""

import base64
import io
import os
import uuid
from datetime import datetime
from bom_system.models import _utcnow
from typing import Optional, Tuple

from PIL import Image
from sqlalchemy.orm import Session
from werkzeug.utils import secure_filename

from bom_system.dimensions.models import Dimension


class DimensionImageService:
    """尺寸图片处理服务"""

    def __init__(self, session: Session):
        self.session = session

    def save_canvas_image_to_db(
        self, dimension_id: int, canvas_data_url: str, image_type: str = "canvas"
    ) -> bool:
        """
        将Canvas生成的图片数据保存到数据库

        Args:
            dimension_id: 尺寸ID
            canvas_data_url: Canvas生成的data URL (data:image/png;base64,...)
            image_type: 图片类型标识

        Returns:
            bool: 保存是否成功
        """
        try:
            logger.debug("开始保存Canvas图片 - 尺寸ID: {dimension_id}")

            # 获取尺寸记录
            dimension = self.session.query(Dimension).filter_by(id=dimension_id).first()
            if not dimension:
                raise ValueError(f"尺寸记录不存在: {dimension_id}")

            logger.debug("找到尺寸记录: {dimension.characteristic}")

            # 解析data URL
            if not canvas_data_url.startswith("data:image/"):
                raise ValueError(f"无效的图片数据格式: {canvas_data_url[:50]}...")

            logger.debug("Canvas数据URL格式正确，长度: {len(canvas_data_url)}")

            # 提取base64数据
            try:
                header, data = canvas_data_url.split(",", 1)
                image_data = base64.b64decode(data)
                logger.debug("Base64解码成功，图片数据大小: {len(image_data)} bytes")
            except Exception as e:
                raise ValueError(f"Base64解码失败: {str(e)}")

            # 生成文件路径
            upload_dir = os.path.join("static", "uploads", "dimensions", "canvas")
            logger.debug("创建上传目录: {upload_dir}")

            try:
                os.makedirs(upload_dir, exist_ok=True)
                logger.debug("上传目录创建成功")
            except Exception as e:
                raise Exception(f"创建上传目录失败: {str(e)}")

            filename = (
                f"dimension_{dimension_id}_{image_type}_{uuid.uuid4().hex[:8]}.png"
            )
            file_path = os.path.join(upload_dir, filename)
            logger.debug("文件路径: {file_path}")

            # 保存图片文件
            try:
                with open(file_path, "wb") as f:
                    f.write(image_data)
                logger.debug("图片文件保存成功: {file_path}")
            except Exception as e:
                raise Exception(f"保存图片文件失败: {str(e)}")

            # 更新数据库记录
            image_url = f"/static/uploads/dimensions/canvas/{filename}"
            dimension.image_url = image_url
            dimension.updated_at = _utcnow()

            try:
                self.session.commit()
                logger.debug("数据库更新成功，图片URL: {image_url}")
            except Exception as e:
                raise Exception(f"数据库更新失败: {str(e)}")

            return True

        except Exception as e:
            logger.debug("保存Canvas图片失败: {str(e)}")
            self.session.rollback()
            raise Exception(f"保存Canvas图片失败: {str(e)}")

    def save_combined_dimension_images(
        self,
        project_id: str,
        part_id: str,
        dimension_images: list,
        layout_config: dict = None,
    ) -> str:
        """
        保存拼接的尺寸图片组合

        Args:
            project_id: 项目ID
            part_id: 零件ID
            dimension_images: 尺寸图片列表 [{'id': 1, 'canvas_data': 'data:image/...', 'position': {...}}]
            layout_config: 布局配置

        Returns:
            str: 拼接图片的URL
        """
        try:
            if not dimension_images:
                raise ValueError("没有提供尺寸图片数据")

            # 创建拼接图片
            combined_image = self._create_combined_image(
                dimension_images, layout_config
            )

            # 保存拼接图片
            upload_dir = os.path.join("static", "uploads", "dimensions", "combined")
            os.makedirs(upload_dir, exist_ok=True)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"combined_{project_id}_{part_id}_{timestamp}_{uuid.uuid4().hex[:8]}.png"
            file_path = os.path.join(upload_dir, filename)

            combined_image.save(file_path, "PNG", quality=95)

            # 返回URL
            return f"/static/uploads/dimensions/combined/{filename}"

        except Exception as e:
            raise Exception(f"保存拼接图片失败: {str(e)}")

    def _create_combined_image(
        self, dimension_images: list, layout_config: dict = None
    ) -> Image.Image:
        """
        创建拼接图片

        Args:
            dimension_images: 尺寸图片列表
            layout_config: 布局配置

        Returns:
            PIL.Image: 拼接后的图片
        """
        try:
            # 默认布局配置
            if layout_config is None:
                layout_config = {
                    "canvas_width": 800,
                    "canvas_height": 600,
                    "background_color": (255, 255, 255),
                    "padding": 20,
                    "grid_cols": 2,
                    "spacing": 10,
                }

            # 创建画布
            canvas_width = layout_config.get("canvas_width", 800)
            canvas_height = layout_config.get("canvas_height", 600)
            background_color = layout_config.get("background_color", (255, 255, 255))

            combined_image = Image.new(
                "RGB", (canvas_width, canvas_height), background_color
            )

            # 处理每个尺寸图片
            padding = layout_config.get("padding", 20)
            spacing = layout_config.get("spacing", 10)
            grid_cols = layout_config.get("grid_cols", 2)

            # 计算每个图片的可用空间 - 水平拼接成一行
            total_items = len(dimension_images)
            available_width = (canvas_width - 2 * padding - (total_items - 1) * spacing) / total_items
            available_height = canvas_height - 2 * padding

            for i, img_data in enumerate(dimension_images):
                try:
                    # 解析图片数据
                    canvas_data = img_data.get("canvas_data", "")
                    if not canvas_data.startswith("data:image/"):
                        continue

                    # 提取base64数据并创建图片
                    header, data = canvas_data.split(",", 1)
                    image_bytes = base64.b64decode(data)
                    dimension_img = Image.open(io.BytesIO(image_bytes))

                    # 调整图片大小以适应布局
                    dimension_img = self._resize_image_to_fit(
                        dimension_img, available_width, available_height
                    )

                    # 计算粘贴位置 - 水平排列
                    x = padding + i * (available_width + spacing)
                    y = padding

                    # 粘贴图片
                    combined_image.paste(dimension_img, (x, y))

                except Exception as e:
                    logger.debug("处理单个尺寸图片失败: {str(e)}")
                    continue

            return combined_image

        except Exception as e:
            raise Exception(f"创建拼接图片失败: {str(e)}")

    def _resize_image_to_fit(
        self, image: Image.Image, max_width: int, max_height: int
    ) -> Image.Image:
        """
        调整图片大小以适应指定区域

        Args:
            image: 原始图片
            max_width: 最大宽度
            max_height: 最大高度

        Returns:
            PIL.Image: 调整后的图片
        """
        # 计算缩放比例
        width_ratio = max_width / image.width
        height_ratio = max_height / image.height
        scale_ratio = min(width_ratio, height_ratio)

        # 如果图片已经足够小，不需要缩放
        if scale_ratio >= 1:
            return image

        # 计算新尺寸
        new_width = int(image.width * scale_ratio)
        new_height = int(image.height * scale_ratio)

        # 调整大小
        return image.resize((new_width, new_height), Image.Resampling.LANCZOS)

    def get_dimension_image_data(self, dimension_id: int) -> Optional[dict]:
        """
        获取尺寸的图片数据

        Args:
            dimension_id: 尺寸ID

        Returns:
            dict: 图片数据信息
        """
        try:
            dimension = self.session.query(Dimension).filter_by(id=dimension_id).first()
            if not dimension or not dimension.image_url:
                return None

            return {
                "id": dimension.id,
                "image_url": dimension.image_url,
                "dimension_type": dimension.dimension_type,
                "characteristic": dimension.characteristic,
                "group_no": dimension.group_no,
            }

        except Exception as e:
            raise Exception(f"获取尺寸图片数据失败: {str(e)}")

    def delete_dimension_image(self, dimension_id: int) -> bool:
        """
        删除尺寸图片

        Args:
            dimension_id: 尺寸ID

        Returns:
            bool: 删除是否成功
        """
        try:
            dimension = self.session.query(Dimension).filter_by(id=dimension_id).first()
            if not dimension:
                return False

            # 删除文件
            if dimension.image_url:
                file_path = dimension.image_url.replace("/static/", "static/")
                if os.path.exists(file_path):
                    os.remove(file_path)

            # 清空数据库记录
            dimension.image_url = None
            dimension.updated_at = _utcnow()

            self.session.commit()
            return True

        except Exception as e:
            self.session.rollback()
            raise Exception(f"删除尺寸图片失败: {str(e)}")
