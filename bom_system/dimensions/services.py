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

from bom_system.dimensions.models import Dimension, DimensionVersion, DimensionTemplate


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

    def detect_dimension_type(self, nominal_value: str) -> str:
        """智能检测尺寸类型

        根据尺寸值自动判断尺寸类型

        Args:
            nominal_value: 名义尺寸值

        Returns:
            检测到的尺寸类型
        """
        import re
        
        # 去除空白字符
        value = nominal_value.strip()
        
        # 检测角度尺寸（包含°符号）
        if '°' in value or '度' in value:
            return "angular"
        
        # 检测直径尺寸（包含Φ、φ、D等符号）
        if re.search(r'[ΦφDφ]', value):
            return "diameter"
        
        # 检测半径尺寸（包含R符号）
        if re.search(r'[Rr]', value):
            return "radius"
        
        # 检测球直径（包含SΦ、Sφ等符号）
        if re.search(r'S[Φφ]', value):
            return "spherical_diameter"
        
        # 检测球半径（包含SR、Sr等符号）
        if re.search(r'S[Rr]', value):
            return "spherical_radius"
        
        # 默认为线性尺寸
        return "linear"

    def calculate_tolerance(self, nominal_value: str, standard: str = "GB/T 1804") -> Dict[str, str]:
        """根据尺寸值和标准自动计算公差

        支持GB/T 1804和ISO 2768标准

        Args:
            nominal_value: 名义尺寸值
            standard: 公差标准，默认为GB/T 1804

        Returns:
            包含上公差、下公差和公差值的字典
        """
        import re
        
        # 提取数值部分
        value_str = re.search(r'[\d.]+', nominal_value)
        if not value_str:
            return {}
        
        try:
            value = float(value_str.group())
        except ValueError:
            return {}
        
        # GB/T 1804-2000 一般公差标准
        if standard == "GB/T 1804":
            # 线性尺寸公差（m级，中等）
            if value <= 3:
                tolerance = "0.1"
                upper = "0.05"
                lower = "-0.05"
            elif value <= 6:
                tolerance = "0.1"
                upper = "0.05"
                lower = "-0.05"
            elif value <= 10:
                tolerance = "0.15"
                upper = "0.075"
                lower = "-0.075"
            elif value <= 18:
                tolerance = "0.2"
                upper = "0.1"
                lower = "-0.1"
            elif value <= 30:
                tolerance = "0.3"
                upper = "0.15"
                lower = "-0.15"
            elif value <= 50:
                tolerance = "0.4"
                upper = "0.2"
                lower = "-0.2"
            elif value <= 120:
                tolerance = "0.5"
                upper = "0.25"
                lower = "-0.25"
            elif value <= 250:
                tolerance = "0.6"
                upper = "0.3"
                lower = "-0.3"
            elif value <= 500:
                tolerance = "0.8"
                upper = "0.4"
                lower = "-0.4"
            else:
                tolerance = "1.0"
                upper = "0.5"
                lower = "-0.5"
        
        # ISO 2768 一般公差标准
        elif standard == "ISO 2768":
            if value <= 0.5:
                tolerance = "0.05"
                upper = "0.025"
                lower = "-0.025"
            elif value <= 3:
                tolerance = "0.1"
                upper = "0.05"
                lower = "-0.05"
            elif value <= 6:
                tolerance = "0.1"
                upper = "0.05"
                lower = "-0.05"
            elif value <= 30:
                tolerance = "0.15"
                upper = "0.075"
                lower = "-0.075"
            elif value <= 120:
                tolerance = "0.2"
                upper = "0.1"
                lower = "-0.1"
            elif value <= 400:
                tolerance = "0.3"
                upper = "0.15"
                lower = "-0.15"
            elif value <= 1000:
                tolerance = "0.5"
                upper = "0.25"
                lower = "-0.25"
            else:
                tolerance = "0.8"
                upper = "0.4"
                lower = "-0.4"
        
        else:
            return {}
        
        return {
            "toleranceValue": tolerance,
            "upperTolerance": upper,
            "lowerTolerance": lower
        }

    def validate_dimension_data(self, data: Dict[str, Any]) -> None:
        """验证尺寸数据（符合ISO 1101/ASME Y14.5和GB/T 1182标准）"""
        # 验证尺寸类型
        dimension_type = data.get("dimensionType", "").strip()
        if not dimension_type:
            # 如果未指定尺寸类型，尝试自动检测
            nominal_value = data.get("nominalValue", "").strip()
            if nominal_value:
                dimension_type = self.detect_dimension_type(nominal_value)
                data["dimensionType"] = dimension_type
            else:
                raise DimensionValidationError("[尺寸类型] 不能为空")
        
        # 验证尺寸类型是否有效（符合ISO 1101/ASME Y14.5和GB/T 1182标准）
        valid_dimension_types = [
            # 基本尺寸类型
            "linear",           # 线性尺寸
            "angular",          # 角度尺寸
            "radial",           # 径向尺寸
            "diameter",         # 直径
            "radius",           # 半径
            "spherical_diameter", # 球直径
            "spherical_radius",   # 球半径
            
            # 形状公差（GB/T 1182-2018）
            "flatness",         # 平面度
            "straightness",      # 直线度
            "circularity",      # 圆度
            "cylindricity",     # 圆柱度
            
            # 方向公差（GB/T 1182-2018）
            "perpendicularity",  # 垂直度
            "parallelism",       # 平行度
            "angularity",        # 倾斜度
            
            # 位置公差（GB/T 1182-2018）
            "position",          # 位置度
            "concentricity",     # 同心度
            "symmetry",          # 对称度
            "coplanarity",       # 共面度
            
            # 轮廓公差（GB/T 1182-2018）
            "profile_surface",   # 面轮廓
            "profile_line",      # 线轮廓
            
            # 跳动公差（GB/T 1182-2018）
            "circular_runout",   # 圆跳动
            "total_runout",      # 全跳动
            
            # 其他类型
            "normal",            # 普通尺寸
            "image",             # 图片尺寸
            "image_dimension",    # 图片尺寸
        ]
        if dimension_type not in valid_dimension_types:
            raise DimensionValidationError(
                f"[尺寸类型] 无效。有效值为：{', '.join(valid_dimension_types)}（符合ISO 1101/ASME Y14.5和GB/T 1182标准）"
            )

        # 位置度特殊验证（符合ISO 1101/ASME Y14.5标准）
        if dimension_type == "position":
            # 位置度必须有公差值
            tolerance_value = data.get("toleranceValue", "").strip()
            if not tolerance_value:
                raise DimensionValidationError("[位置度] 必须输入公差值（符合ISO 1101/ASME Y14.5标准）")
            
            # 位置度建议有基准
            datum = data.get("datum", "").strip()
            if not datum:
                raise DimensionValidationError("[位置度] 必须指定基准（符合ISO 1101/ASME Y14.5标准）")

        # 如果是图片尺寸，只需要验证图片URL
        if dimension_type in ["image", "image_dimension"]:
            if not data.get("imageUrl"):
                raise DimensionValidationError(
                    "[图片URL] 不能为空，图片尺寸必须包含图片URL"
                )
            # 图片尺寸设置默认名义值，因为模型中该字段为必填
            if not data.get("nominalValue"):
                data["nominalValue"] = "0"
            return

        # 对于普通尺寸，验证名义值
        nominal_value = data.get("nominalValue", "").strip()
        if not nominal_value:
            raise DimensionValidationError("[名义值] 不能为空")

        # 验证数值格式 - 提取数值部分
        import re
        value_str = re.search(r'[\d.]+', nominal_value)
        if not value_str:
            raise DimensionValidationError(
                f"[名义值] 必须包含有效数字，当前值: '{nominal_value}'"
            )
        
        try:
            float(value_str.group())
        except ValueError:
            raise DimensionValidationError(
                f"[名义值] 必须包含有效数字，当前值: '{nominal_value}'"
            )

        # 验证公差值（符合ISO 1101/ASME Y14.5和GB/T 1182/GB/T 1804标准）
        upper_tolerance = data.get("upperTolerance", "").strip()
        lower_tolerance = data.get("lowerTolerance", "").strip()
        tolerance_value = data.get("toleranceValue", "").strip()
        
        # 如果没有提供公差值，自动计算
        if not upper_tolerance and not lower_tolerance and not tolerance_value:
            tolerance_data = self.calculate_tolerance(nominal_value)
            if tolerance_data:
                data.update(tolerance_data)
                upper_tolerance = tolerance_data.get("upperTolerance", "")
                lower_tolerance = tolerance_data.get("lowerTolerance", "")
                tolerance_value = tolerance_data.get("toleranceValue", "")

        # 公差值可以为0，根据GB/T 1804标准调整
        # GB/T 1804-2000《一般公差 未注公差的线性和角度尺寸的公差》
        if tolerance_value:
            try:
                tolerance = float(tolerance_value)
                if tolerance < 0:
                    raise DimensionValidationError(
                        f"[公差值] 不能为负数，当前值: '{tolerance_value}'（符合GB/T 1804标准）"
                    )
            except ValueError:
                raise DimensionValidationError(
                    f"[公差值] 必须是有效数字，当前值: '{tolerance_value}'"
                )

        # ISO 1101/GB/T 1182要求：上公差必须大于或等于下公差
        if upper_tolerance and lower_tolerance:
            try:
                upper = float(upper_tolerance)
                lower = float(lower_tolerance)
                if upper < lower:
                    raise DimensionValidationError(
                        f"[公差值] 上公差必须大于或等于下公差（符合ISO 1101/GB/T 1182标准），当前值: 上公差='{upper_tolerance}', 下公差='{lower_tolerance}'"
                    )
            except ValueError:
                raise DimensionValidationError(
                    f"[公差值] 必须是有效数字，当前值: 上公差='{upper_tolerance}', 下公差='{lower_tolerance}'"
                )

        # 验证单个公差值格式
        if upper_tolerance:
            try:
                float(upper_tolerance)
            except ValueError:
                raise DimensionValidationError(
                    f"[上公差] 必须是有效数字，当前值: '{upper_tolerance}'"
                )

        if lower_tolerance:
            try:
                float(lower_tolerance)
            except ValueError:
                raise DimensionValidationError(
                    f"[下公差] 必须是有效数字，当前值: '{lower_tolerance}'"
                )

        # ISO 1101/ASME Y14.5和GB/T 1182要求：验证基准符号格式
        datum = data.get("datum", "").strip()
        if datum:
            # 基准符号可以是单个基准或基准体系（符合ISO 1101/ASME Y14.5和GB/T 1182标准）
            # 支持格式：A, B1, ABC, A-B-C, A1-B2-C3等
            import re

            # 验证基准体系格式 - 更简单的正则表达式
            if not re.match(r"^[A-Z0-9]+(?:-[A-Z0-9]+)*$|^[A-Z0-9]+$", datum):
                raise DimensionValidationError(
                    f"[基准符号] 格式无效。支持单个基准（如 A, B1）、连续基准（如 ABC）或基准体系（如 A-B-C, A1-B2-C3）（符合ISO 1101/ASME Y14.5和GB/T 1182标准），当前值: '{datum}'"
                )

        # FCF（特征控制框）验证（符合ASME Y14.5标准）
        fcf_symbol = data.get("fcfSymbol", "").strip()
        fcf_value = data.get("fcfValue", "").strip()
        fcf_datums = data.get("fcfDatums", "").strip()
        
        if fcf_symbol:
            # 验证FCF符号
            valid_fcf_symbols = [
                "T",  # 公差
                "P",  # 位置度
                "F",  # 平面度
                "S",  # 直线度
                "C",  # 圆度
                "CYL", # 圆柱度
                "PERP", # 垂直度
                "PAR",  # 平行度
                "ANG",  # 倾斜度
                "CONC", # 同心度
                "SYM",  # 对称度
                "PROF-S", # 面轮廓
                "PROF-L", # 线轮廓
                "RUN",  # 圆跳动
                "TIR"   # 全跳动
            ]
            if fcf_symbol not in valid_fcf_symbols:
                raise DimensionValidationError(
                    f"[FCF符号] 无效。有效值为：{', '.join(valid_fcf_symbols)}（符合ASME Y14.5标准），当前值: '{fcf_symbol}'"
                )
            
            # FCF符号存在时，FCF值也必须存在
            if not fcf_value:
                raise DimensionValidationError(
                    "[FCF值] 不能为空，当FCF符号存在时必须指定FCF值（符合ASME Y14.5标准）"
                )
            
            # 验证FCF值格式
            try:
                float(fcf_value)
            except ValueError:
                raise DimensionValidationError(
                    f"[FCF值] 必须是有效数字，当前值: '{fcf_value}'"
                )
        
        # 验证FCF基准序列格式
        if fcf_datums:
            import re
            if not re.match(r"^[A-Z0-9]+(?:-[A-Z0-9]+)*$|^[A-Z0-9]+$", fcf_datums):
                raise DimensionValidationError(
                    f"[FCF基准序列] 格式无效。支持单个基准（如 A, B1）、连续基准（如 ABC）或基准体系（如 A-B-C, A1-B2-C3）（符合ASME Y14.5标准），当前值: '{fcf_datums}'"
                )

        # 特殊特性可以为空，根据用户需求调整
        # ISO 1101-2004标准建议添加特殊特性，但不强制要求
        characteristic = data.get("characteristic", "").strip()

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
                fcf_symbol=data.get("fcfSymbol", ""),
                fcf_value=data.get("fcfValue", ""),
                fcf_modifier=data.get("fcfModifier", ""),
                fcf_datums=data.get("fcfDatums", ""),
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

    def save_dimension_version(self, dimension: Dimension, modified_by: str = "", modification_reason: str = "") -> None:
        """保存尺寸版本历史"""
        # 获取当前最大版本号
        max_version = (
            self.session.query(func.max(DimensionVersion.version))
            .filter_by(dimension_id=dimension.id)
            .scalar()
        )
        
        # 计算新版本号
        new_version = (max_version or 0) + 1
        
        # 创建版本历史记录
        version = DimensionVersion(
            dimension_id=dimension.id,
            version=new_version,
            project_id=dimension.project_id,
            part_id=dimension.part_id,
            group_no=dimension.group_no,
            dimension_type=dimension.dimension_type,
            nominal_value=dimension.nominal_value,
            tolerance_value=dimension.tolerance_value,
            upper_tolerance=dimension.upper_tolerance,
            lower_tolerance=dimension.lower_tolerance,
            unit=dimension.unit,
            datum=dimension.datum,
            characteristic=dimension.characteristic,
            fcf_symbol=dimension.fcf_symbol,
            fcf_value=dimension.fcf_value,
            fcf_modifier=dimension.fcf_modifier,
            fcf_datums=dimension.fcf_datums,
            notes=dimension.notes,
            image_url=dimension.image_url,
            image_data=dimension.image_data,
            image_type=dimension.image_type,
            combined_image_url=dimension.combined_image_url,
            combined_image_data=dimension.combined_image_data,
            modified_by=modified_by,
            modification_reason=modification_reason,
        )
        
        self.session.add(version)

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

            # 保存版本历史
            self.save_dimension_version(
                dimension,
                modified_by=data.get("modifiedBy", ""),
                modification_reason=data.get("modificationReason", "")
            )

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
            if "fcfSymbol" in data:
                dimension.fcf_symbol = data["fcfSymbol"]
            if "fcfValue" in data:
                dimension.fcf_value = data["fcfValue"]
            if "fcfModifier" in data:
                dimension.fcf_modifier = data["fcfModifier"]
            if "fcfDatums" in data:
                dimension.fcf_datums = data["fcfDatums"]
            if "notes" in data:
                dimension.notes = data["notes"]
            if "imageUrl" in data:
                dimension.image_url = data["imageUrl"]
            if "imageData" in data:
                dimension.image_data = data["imageData"]
            if "imageType" in data:
                dimension.image_type = data["imageType"]
            if "combinedImageUrl" in data:
                dimension.combined_image_url = data["combinedImageUrl"]
            if "combinedImageData" in data:
                dimension.combined_image_data = data["combinedImageData"]

            self.session.commit()
            return dimension

        except Exception as e:
            self.session.rollback()
            raise e

    def get_dimension_versions(self, dimension_id: int) -> List[DimensionVersion]:
        """获取尺寸的版本历史"""
        return (
            self.session.query(DimensionVersion)
            .filter_by(dimension_id=dimension_id)
            .order_by(DimensionVersion.version.desc())
            .all()
        )

    def rollback_to_version(self, dimension_id: int, version: int) -> Optional[Dimension]:
        """回滚到指定版本"""
        try:
            # 获取要回滚到的版本
            target_version = (
                self.session.query(DimensionVersion)
                .filter_by(dimension_id=dimension_id, version=version)
                .first()
            )
            
            if not target_version:
                return None
            
            # 获取当前尺寸
            dimension = self.get_dimension_by_id(dimension_id)
            if not dimension:
                return None
            
            # 保存当前状态为新版本
            self.save_dimension_version(
                dimension,
                modified_by="System",
                modification_reason=f"回滚到版本 {version}"
            )
            
            # 回滚到目标版本
            dimension.group_no = target_version.group_no
            dimension.part_id = target_version.part_id
            dimension.dimension_type = target_version.dimension_type
            dimension.nominal_value = target_version.nominal_value
            dimension.tolerance_value = target_version.tolerance_value
            dimension.upper_tolerance = target_version.upper_tolerance
            dimension.lower_tolerance = target_version.lower_tolerance
            dimension.unit = target_version.unit
            dimension.datum = target_version.datum
            dimension.characteristic = target_version.characteristic
            dimension.fcf_symbol = target_version.fcf_symbol
            dimension.fcf_value = target_version.fcf_value
            dimension.fcf_modifier = target_version.fcf_modifier
            dimension.fcf_datums = target_version.fcf_datums
            dimension.notes = target_version.notes
            dimension.image_url = target_version.image_url
            dimension.image_data = target_version.image_data
            dimension.image_type = target_version.image_type
            dimension.combined_image_url = target_version.combined_image_url
            dimension.combined_image_data = target_version.combined_image_data
            
            self.session.commit()
            return dimension
            
        except Exception as e:
            self.session.rollback()
            raise e

    def get_dimension_statistics(self, project_id: str) -> Dict[str, Any]:
        """获取尺寸统计信息"""
        import re
        
        # 获取项目的所有尺寸
        dimensions = self.get_dimensions_by_project(project_id)
        
        # 统计数据
        total_dimensions = len(dimensions)
        dimension_type_distribution = {}
        tolerance_range_distribution = {}
        nominal_value_stats = {
            "min": None,
            "max": None,
            "avg": 0,
            "count": 0
        }
        
        # 计算统计数据
        total_nominal_value = 0
        for dimension in dimensions:
            # 尺寸类型分布
            dim_type = dimension.dimension_type
            if dim_type not in dimension_type_distribution:
                dimension_type_distribution[dim_type] = 0
            dimension_type_distribution[dim_type] += 1
            
            # 公差范围分析
            if dimension.tolerance_value:
                try:
                    tolerance = float(dimension.tolerance_value)
                    # 按公差范围分组
                    if tolerance < 0.1:
                        range_key = "< 0.1"
                    elif tolerance < 0.5:
                        range_key = "0.1-0.5"
                    elif tolerance < 1.0:
                        range_key = "0.5-1.0"
                    else:
                        range_key = ">= 1.0"
                    
                    if range_key not in tolerance_range_distribution:
                        tolerance_range_distribution[range_key] = 0
                    tolerance_range_distribution[range_key] += 1
                except ValueError:
                    pass
            
            # 名义值统计
            if dimension.dimension_type not in ["image", "image_dimension"]:
                value_str = re.search(r'[\d.]+', dimension.nominal_value)
                if value_str:
                    try:
                        value = float(value_str.group())
                        total_nominal_value += value
                        nominal_value_stats["count"] += 1
                        
                        if nominal_value_stats["min"] is None or value < nominal_value_stats["min"]:
                            nominal_value_stats["min"] = value
                        if nominal_value_stats["max"] is None or value > nominal_value_stats["max"]:
                            nominal_value_stats["max"] = value
                    except ValueError:
                        pass
        
        # 计算平均值
        if nominal_value_stats["count"] > 0:
            nominal_value_stats["avg"] = total_nominal_value / nominal_value_stats["count"]
        
        # 零件数量统计
        part_ids = set()
        for dimension in dimensions:
            if dimension.part_id:
                part_ids.add(dimension.part_id)
        total_parts = len(part_ids)
        
        return {
            "total_dimensions": total_dimensions,
            "total_parts": total_parts,
            "dimension_type_distribution": dimension_type_distribution,
            "tolerance_range_distribution": tolerance_range_distribution,
            "nominal_value_stats": nominal_value_stats
        }

    def get_part_dimension_statistics(self, project_id: str, part_id: str) -> Dict[str, Any]:
        """获取零件的尺寸统计信息"""
        import re
        
        # 获取零件的所有尺寸
        dimensions = self.get_dimensions_by_part_number(project_id, part_id)
        
        # 统计数据
        total_dimensions = len(dimensions)
        dimension_type_distribution = {}
        tolerance_range_distribution = {}
        
        # 计算统计数据
        for dimension in dimensions:
            # 尺寸类型分布
            dim_type = dimension.dimension_type
            if dim_type not in dimension_type_distribution:
                dimension_type_distribution[dim_type] = 0
            dimension_type_distribution[dim_type] += 1
            
            # 公差范围分析
            if dimension.tolerance_value:
                try:
                    tolerance = float(dimension.tolerance_value)
                    # 按公差范围分组
                    if tolerance < 0.1:
                        range_key = "< 0.1"
                    elif tolerance < 0.5:
                        range_key = "0.1-0.5"
                    elif tolerance < 1.0:
                        range_key = "0.5-1.0"
                    else:
                        range_key = ">= 1.0"
                    
                    if range_key not in tolerance_range_distribution:
                        tolerance_range_distribution[range_key] = 0
                    tolerance_range_distribution[range_key] += 1
                except ValueError:
                    pass
        
        return {
            "total_dimensions": total_dimensions,
            "dimension_type_distribution": dimension_type_distribution,
            "tolerance_range_distribution": tolerance_range_distribution
        }

    # 尺寸模板管理方法
    def create_template(self, data: Dict[str, Any]) -> DimensionTemplate:
        """创建尺寸模板"""
        try:
            # 验证数据
            if not data.get("name"):
                raise DimensionValidationError("模板名称不能为空")
            if not data.get("dimensionType"):
                raise DimensionValidationError("尺寸类型不能为空")
            
            # 创建模板
            template = DimensionTemplate.from_dict(data)
            self.session.add(template)
            self.session.commit()
            self.session.refresh(template)
            return template
        except Exception as e:
            self.session.rollback()
            raise e

    def update_template(self, template_id: int, data: Dict[str, Any]) -> Optional[DimensionTemplate]:
        """更新尺寸模板"""
        try:
            template = self.session.query(DimensionTemplate).filter_by(id=template_id).first()
            if not template:
                return None
            
            # 更新字段
            if "name" in data:
                template.name = data["name"]
            if "description" in data:
                template.description = data["description"]
            if "dimensionType" in data:
                template.dimension_type = data["dimensionType"]
            if "nominalValue" in data:
                template.nominal_value = data["nominalValue"]
            if "toleranceValue" in data:
                template.tolerance_value = data["toleranceValue"]
            if "upperTolerance" in data:
                template.upper_tolerance = data["upperTolerance"]
            if "lowerTolerance" in data:
                template.lower_tolerance = data["lowerTolerance"]
            if "unit" in data:
                template.unit = data["unit"]
            if "datum" in data:
                template.datum = data["datum"]
            if "characteristic" in data:
                template.characteristic = data["characteristic"]
            if "fcfSymbol" in data:
                template.fcf_symbol = data["fcfSymbol"]
            if "fcfValue" in data:
                template.fcf_value = data["fcfValue"]
            if "fcfModifier" in data:
                template.fcf_modifier = data["fcfModifier"]
            if "fcfDatums" in data:
                template.fcf_datums = data["fcfDatums"]
            if "notes" in data:
                template.notes = data["notes"]
            if "isSystem" in data:
                template.is_system = data["isSystem"]
            
            self.session.commit()
            return template
        except Exception as e:
            self.session.rollback()
            raise e

    def delete_template(self, template_id: int) -> bool:
        """删除尺寸模板"""
        try:
            template = self.session.query(DimensionTemplate).filter_by(id=template_id).first()
            if not template:
                return False
            
            # 系统模板不能删除
            if template.is_system:
                raise DimensionValidationError("系统模板不能删除")
            
            self.session.delete(template)
            self.session.commit()
            return True
        except Exception as e:
            self.session.rollback()
            raise e

    def get_templates(self, dimension_type: str = None) -> List[DimensionTemplate]:
        """获取尺寸模板，可按类型过滤"""
        query = self.session.query(DimensionTemplate)
        if dimension_type:
            query = query.filter_by(dimension_type=dimension_type)
        return query.order_by(DimensionTemplate.is_system.desc(), DimensionTemplate.name.asc()).all()

    def get_template_by_id(self, template_id: int) -> Optional[DimensionTemplate]:
        """根据ID获取模板"""
        return self.session.query(DimensionTemplate).filter_by(id=template_id).first()

    def apply_template(self, project_id: str, template_id: int, data: Dict[str, Any]) -> Dimension:
        """应用模板创建尺寸"""
        try:
            # 获取模板
            template = self.get_template_by_id(template_id)
            if not template:
                raise DimensionValidationError("模板不存在")
            
            # 基于模板创建尺寸数据
            dimension_data = {
                "partId": data.get("partId"),
                "groupNo": data.get("groupNo"),
                "dimensionType": template.dimension_type,
                "nominalValue": data.get("nominalValue", template.nominal_value),
                "toleranceValue": data.get("toleranceValue", template.tolerance_value),
                "upperTolerance": data.get("upperTolerance", template.upper_tolerance),
                "lowerTolerance": data.get("lowerTolerance", template.lower_tolerance),
                "unit": data.get("unit", template.unit),
                "datum": data.get("datum", template.datum),
                "characteristic": data.get("characteristic", template.characteristic),
                "fcfSymbol": data.get("fcfSymbol", template.fcf_symbol),
                "fcfValue": data.get("fcfValue", template.fcf_value),
                "fcfModifier": data.get("fcfModifier", template.fcf_modifier),
                "fcfDatums": data.get("fcfDatums", template.fcf_datums),
                "notes": data.get("notes", template.notes),
                "imageUrl": data.get("imageUrl"),
            }
            
            # 创建尺寸
            return self.create_dimension(project_id, dimension_data)
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
                fcf_symbol=data.get("fcfSymbol", ""),
                fcf_value=data.get("fcfValue", ""),
                fcf_modifier=data.get("fcfModifier", ""),
                fcf_datums=data.get("fcfDatums", ""),
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
            print(f"删除尺寸失败: {e}")
            import traceback

            traceback.print_exc()
            return False

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
                    fcf_symbol=data.get("fcfSymbol", ""),
                    fcf_value=data.get("fcfValue", ""),
                    fcf_modifier=data.get("fcfModifier", ""),
                    fcf_datums=data.get("fcfDatums", ""),
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

    def clear_all_dimensions(self) -> int:
        """清空所有尺寸数据，包括虚拟数据"""
        try:
            # 删除所有尺寸数据
            deleted_count = self.session.query(Dimension).delete()
            self.session.commit()
            return deleted_count
        except Exception as e:
            self.session.rollback()
            raise e
