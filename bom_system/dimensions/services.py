"""
尺寸管理服务层
"""

import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, func
from sqlalchemy.orm import Session
from werkzeug.utils import secure_filename

from bom_system.dimensions.models import Dimension


class DimensionValidationError(Exception):
    """尺寸验证错误"""

    pass


class DimensionService:
    """尺寸管理服务"""

    def __init__(self, session: Session):
        self.session = session

    def get_dimensions_by_project(self, project_id: str) -> List[Dimension]:
        """获取项目的所有尺寸，按组号排序"""
        return (
            self.session.query(Dimension)
            .filter_by(project_id=project_id)
            .order_by(Dimension.group_no.asc())
            .all()
        )

    def get_dimensions_by_part(self, part_id: str) -> List[Dimension]:
        """获取某零件的所有尺寸，按组号排序"""
        return (
            self.session.query(Dimension)
            .filter_by(part_id=part_id)
            .order_by(Dimension.group_no.asc())
            .all()
        )

    def get_dimensions_by_part_number(
        self, project_id: str, part_number: str
    ) -> List[Dimension]:
        """根据项目ID和产品编号获取尺寸数据"""
        return (
            self.session.query(Dimension)
            .filter(
                and_(
                    Dimension.project_id == project_id,
                    Dimension.part_id == part_number,  # part_id字段存储的是产品编号
                )
            )
            .order_by(Dimension.group_no.asc())
            .all()
        )

    def get_dimension_by_id(self, dimension_id: int) -> Optional[Dimension]:
        """根据ID获取尺寸"""
        return self.session.query(Dimension).filter_by(id=dimension_id).first()

    def search_dimensions(self, project_id: str, search_term: str) -> List[Dimension]:
        """搜索尺寸"""
        return (
            self.session.query(Dimension)
            .filter(
                and_(
                    Dimension.project_id == project_id,
                    Dimension.characteristic.ilike(f"%{search_term}%"),
                )
            )
            .order_by(Dimension.group_no.asc())
            .all()
        )

    def get_dimensions_grouped(self, project_id: str) -> Dict[str, List[Dict]]:
        """获取分组的尺寸数据"""
        dimensions = self.get_dimensions_by_project(project_id)

        groups = {}
        for dim in dimensions:
            group_key = f"组{dim.group_no}"
            if group_key not in groups:
                groups[group_key] = []
            groups[group_key].append(dim.to_dict())

        return groups

    def get_next_group_number(self, project_id: str) -> int:
        """获取下一个组号"""
        max_group = (
            self.session.query(func.max(Dimension.group_no))
            .filter_by(project_id=project_id)
            .scalar()
        )

        return (max_group or 0) + 1

    def validate_dimension_data(self, data: Dict[str, Any]) -> None:
        """验证尺寸数据"""
        # 如果是图片尺寸，只需要验证图片URL和特性
        if data.get("dimensionType") in ["image", "image_dimension"]:
            if not data.get("imageUrl"):
                raise DimensionValidationError("图片尺寸必须包含图片URL")
            if not data.get("characteristic", "").strip():
                raise DimensionValidationError("图片尺寸必须包含特殊特性")
            return

        # 对于普通尺寸，验证名义值
        nominal_value = data.get("nominalValue", "").strip()
        if not nominal_value:
            raise DimensionValidationError("名义值不能为空")

        # 验证数值格式
        try:
            float(nominal_value)
        except ValueError:
            raise DimensionValidationError("名义值必须是有效数字")

        # 验证公差值
        upper_tolerance = data.get("upperTolerance", "").strip()
        lower_tolerance = data.get("lowerTolerance", "").strip()
        tolerance_value = data.get("toleranceValue", "").strip()

        if upper_tolerance:
            try:
                float(upper_tolerance)
            except ValueError:
                raise DimensionValidationError("上公差必须是有效数字")

        if lower_tolerance:
            try:
                float(lower_tolerance)
            except ValueError:
                raise DimensionValidationError("下公差必须是有效数字")

        if tolerance_value:
            try:
                float(tolerance_value)
            except ValueError:
                raise DimensionValidationError("公差值必须是有效数字")

    def create_dimension(self, project_id: str, data: Dict[str, Any]) -> Dimension:
        """创建尺寸"""
        try:
            # 验证数据
            self.validate_dimension_data(data)

            # 创建尺寸对象
            dimension = Dimension(
                project_id=project_id,
                part_id=data.get("partId"),
                group_no=data.get("groupNo"),
                dimension_type=data.get("dimensionType", ""),
                nominal_value=data.get("nominalValue", ""),
                tolerance_value=data.get("toleranceValue", ""),
                upper_tolerance=data.get("upperTolerance", ""),
                lower_tolerance=data.get("lowerTolerance", ""),
                datum=data.get("datum", ""),
                characteristic=data.get("characteristic", ""),
                notes=data.get("notes", ""),
                image_url=data.get("imageUrl", ""),
            )

            self.session.add(dimension)
            self.session.commit()

            # 刷新对象以确保会话绑定
            self.session.refresh(dimension)

            return dimension

        except Exception as e:
            self.session.rollback()
            raise e

    def update_dimension(
        self, dimension_id: int, data: Dict[str, Any]
    ) -> Optional[Dimension]:
        """更新尺寸"""
        try:
            dimension = self.get_dimension_by_id(dimension_id)
            if not dimension:
                return None

            # 验证数据
            self.validate_dimension_data(data)

            # 更新字段
            if "groupNo" in data:
                dimension.group_no = data["groupNo"]
            if "partId" in data:
                dimension.part_id = data["partId"]
            if "dimensionType" in data:
                dimension.dimension_type = data["dimensionType"]
            if "nominalValue" in data:
                dimension.nominal_value = data["nominalValue"]
            if "toleranceValue" in data:
                dimension.tolerance_value = data["toleranceValue"]
            if "upperTolerance" in data:
                dimension.upper_tolerance = data["upperTolerance"]
            if "lowerTolerance" in data:
                dimension.lower_tolerance = data["lowerTolerance"]
            if "datum" in data:
                dimension.datum = data["datum"]
            if "characteristic" in data:
                dimension.characteristic = data["characteristic"]
            if "notes" in data:
                dimension.notes = data["notes"]
            if "imageUrl" in data:
                dimension.image_url = data["imageUrl"]

            self.session.commit()
            return dimension

        except Exception as e:
            self.session.rollback()
            raise e

    def delete_dimension(self, dimension_id: int) -> bool:
        """删除尺寸"""
        try:
            dimension = self.session.query(Dimension).filter_by(id=dimension_id).first()
            if dimension:
                self.session.delete(dimension)
                self.session.commit()
                return True
            return False
        except Exception as e:
            self.session.rollback()
            raise e

    def insert_dimension_at_position(
        self, project_id: str, insert_position: int, data: Dict[str, Any]
    ) -> Dimension:
        """在指定位置插入尺寸，后续编号自动顺延"""
        try:
            # 验证数据
            self.validate_dimension_data(data)

            # 获取需要顺延的尺寸（组号 >= 插入位置的所有尺寸）
            dimensions_to_shift = (
                self.session.query(Dimension)
                .filter(
                    and_(
                        Dimension.project_id == project_id,
                        Dimension.group_no >= insert_position,
                    )
                )
                .all()
            )

            # 将这些尺寸的组号都加1（从大到小更新，避免唯一约束冲突）
            for dim in sorted(
                dimensions_to_shift, key=lambda x: x.group_no, reverse=True
            ):
                dim.group_no += 1

            # 先提交编号更新
            self.session.commit()

            # 创建新尺寸，组号为插入位置
            dimension = Dimension(
                project_id=project_id,
                part_id=data.get("partId"),
                group_no=insert_position,
                dimension_type=data.get("dimensionType", ""),
                nominal_value=data.get("nominalValue", ""),
                tolerance_value=data.get("toleranceValue", ""),
                upper_tolerance=data.get("upperTolerance", ""),
                lower_tolerance=data.get("lowerTolerance", ""),
                datum=data.get("datum", ""),
                characteristic=data.get("characteristic", ""),
                notes=data.get("notes", ""),
                image_url=data.get("imageUrl", ""),
            )

            self.session.add(dimension)
            self.session.commit()

            # 刷新对象以确保会话绑定
            self.session.refresh(dimension)

            return dimension

        except Exception as e:
            self.session.rollback()
            raise e

    def delete_dimension_with_reorder(self, dimension_id: int) -> bool:
        """删除尺寸并重新排序后续编号"""
        try:
            dimension = self.session.query(Dimension).filter_by(id=dimension_id).first()
            if not dimension:
                return False

            project_id = dimension.project_id
            deleted_group_no = dimension.group_no

            # 删除尺寸
            self.session.delete(dimension)

            # 获取需要前移的尺寸（组号 > 被删除尺寸组号的所有尺寸）
            dimensions_to_shift = (
                self.session.query(Dimension)
                .filter(
                    and_(
                        Dimension.project_id == project_id,
                        Dimension.group_no > deleted_group_no,
                    )
                )
                .all()
            )

            # 将这些尺寸的组号都减1
            for dim in sorted(dimensions_to_shift, key=lambda x: x.group_no):
                dim.group_no -= 1

            self.session.commit()
            return True

        except Exception as e:
            self.session.rollback()
            raise e

    def save_dimension_image(self, file) -> str:
        """保存尺寸图片并返回URL"""
        try:
            # 确保上传目录存在
            upload_dir = os.path.join("static", "uploads", "dimensions")
            os.makedirs(upload_dir, exist_ok=True)

            # 生成唯一文件名
            filename = secure_filename(file.filename)
            name, ext = os.path.splitext(filename)
            unique_filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"

            # 保存文件
            file_path = os.path.join(upload_dir, unique_filename)
            file.save(file_path)

            # 返回相对URL
            return f"/static/uploads/dimensions/{unique_filename}"

        except Exception as e:
            raise Exception(f"保存图片失败: {str(e)}")

    def bulk_create_dimensions(
        self, project_id: str, dimensions_data: List[Dict[str, Any]]
    ) -> List[Dimension]:
        """批量创建尺寸"""
        try:
            dimensions = []

            for data in dimensions_data:
                # 验证数据
                self.validate_dimension_data(data)

                # 如果没有指定组号，自动分配
                if "groupNo" not in data or not data["groupNo"]:
                    data["groupNo"] = self.get_next_group_number(project_id)

                dimension = Dimension(
                    project_id=project_id,
                    part_id=data.get("partId"),
                    group_no=data.get("groupNo"),
                    dimension_type=data.get("dimensionType", ""),
                    nominal_value=data.get("nominalValue", ""),
                    tolerance_value=data.get("toleranceValue", ""),
                    upper_tolerance=data.get("upperTolerance", ""),
                    lower_tolerance=data.get("lowerTolerance", ""),
                    datum=data.get("datum", ""),
                    characteristic=data.get("characteristic", ""),
                    notes=data.get("notes", ""),
                    image_url=data.get("imageUrl", ""),
                )

                dimensions.append(dimension)
                self.session.add(dimension)

            self.session.commit()
            return dimensions

        except Exception as e:
            self.session.rollback()
            raise e
